'use strict';

/**
 * Démineur — squelette d'architecture.
 * Voir docs/architecture.md pour le détail du modèle et des contrats.
 *
 * Organisation de ce fichier (3 sections cloisonnées) :
 *   1. Modèle / logique pure   — aucune référence au DOM
 *   2. Contrôleur              — orchestre le modèle, toujours sans DOM
 *   3. Rendu / DOM              — lit l'état, câble les événements
 *
 * La logique ne doit jamais toucher au DOM ; le rendu ne doit jamais
 * modifier l'état directement (il passe par les callbacks du contrôleur).
 */

/**
 * @typedef {Object} Cell
 * @property {boolean} isMine
 * @property {boolean} isRevealed
 * @property {boolean} isFlagged
 * @property {number}  adjacentMines
 * @property {number}  row
 * @property {number}  col
 */

/**
 * @typedef {Object} Difficulty
 * @property {number} rows
 * @property {number} cols
 * @property {number} mines
 */

/**
 * @typedef {'ready'|'playing'|'won'|'lost'} GameStatus
 */

/**
 * @typedef {Object} GameState
 * @property {Cell[][]}   board
 * @property {Difficulty} difficulty
 * @property {GameStatus} status
 * @property {number}     flagsPlaced
 * @property {number|null} startTime
 */

/* -------------------------------------------------------------------------
 * 1. Modèle / logique pure
 * ---------------------------------------------------------------------- */

const DIFFICULTY_PRESETS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

/**
 * @param {'beginner'|'intermediate'|'expert'} name
 * @returns {Difficulty}
 */
function getDifficultyPreset(name) {
  const preset = DIFFICULTY_PRESETS[name];
  if (!preset) {
    throw new Error(`Difficulté inconnue : ${name}`);
  }
  return { ...preset };
}

/**
 * @param {number} rows
 * @param {number} cols
 * @returns {Cell[][]}
 */
function createEmptyBoard(rows, cols) {
  const board = [];
  for (let row = 0; row < rows; row++) {
    const line = [];
    for (let col = 0; col < cols; col++) {
      line.push({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
        row,
        col,
      });
    }
    board.push(line);
  }
  return board;
}

/**
 * @param {Cell[][]} board
 * @param {number} row
 * @param {number} col
 * @returns {{row: number, col: number}[]}
 */
function getNeighborCoords(board, row, col) {
  const rows = board.length;
  const cols = board[0].length;
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        neighbors.push({ row: r, col: c });
      }
    }
  }
  return neighbors;
}

/**
 * Place les mines en excluant la cellule cliquée (et ses voisines).
 * Mute `board` en place.
 * @param {Cell[][]} board
 * @param {number} mineCount
 * @param {number} safeRow
 * @param {number} safeCol
 * @returns {void}
 */
function placeMines(board, mineCount, safeRow, safeCol) {
  const rows = board.length;
  const cols = board[0].length;

  const safeZone = new Set([`${safeRow},${safeCol}`]);
  for (const { row, col } of getNeighborCoords(board, safeRow, safeCol)) {
    safeZone.add(`${row},${col}`);
  }

  const candidates = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!safeZone.has(`${row},${col}`)) {
        candidates.push({ row, col });
      }
    }
  }

  const minesToPlace = Math.min(mineCount, candidates.length);
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (let i = 0; i < minesToPlace; i++) {
    const { row, col } = candidates[i];
    board[row][col].isMine = true;
  }
}

/**
 * Calcule Cell.adjacentMines pour chaque cellule. Mute `board` en place.
 * @param {Cell[][]} board
 * @returns {void}
 */
function computeAdjacency(board) {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell.isMine) {
        cell.adjacentMines = 0;
        continue;
      }
      let count = 0;
      for (const { row: r, col: c } of getNeighborCoords(board, row, col)) {
        if (board[r][c].isMine) count++;
      }
      cell.adjacentMines = count;
    }
  }
}

/**
 * Révèle une cellule ; flood-fill si adjacentMines === 0.
 * Mute `board` en place et retourne la liste des cellules affectées.
 * @param {Cell[][]} board
 * @param {number} row
 * @param {number} col
 * @returns {{ revealed: {row: number, col: number}[], hitMine: boolean }}
 */
function revealCell(board, row, col) {
  const revealed = [];
  const startCell = board[row][col];

  if (startCell.isRevealed || startCell.isFlagged) {
    return { revealed, hitMine: false };
  }

  if (startCell.isMine) {
    startCell.isRevealed = true;
    revealed.push({ row, col });
    return { revealed, hitMine: true };
  }

  const stack = [{ row, col }];
  const seen = new Set();

  while (stack.length > 0) {
    const current = stack.pop();
    const key = `${current.row},${current.col}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const cell = board[current.row][current.col];
    if (cell.isRevealed || cell.isFlagged || cell.isMine) continue;

    cell.isRevealed = true;
    revealed.push({ row: current.row, col: current.col });

    if (cell.adjacentMines === 0) {
      for (const neighbor of getNeighborCoords(board, current.row, current.col)) {
        const neighborCell = board[neighbor.row][neighbor.col];
        if (!neighborCell.isRevealed && !neighborCell.isFlagged && !neighborCell.isMine) {
          stack.push(neighbor);
        }
      }
    }
  }

  return { revealed, hitMine: false };
}

/**
 * @param {Cell[][]} board
 * @param {number} row
 * @param {number} col
 * @returns {Cell}
 */
function toggleFlag(board, row, col) {
  const cell = board[row][col];
  if (!cell.isRevealed) {
    cell.isFlagged = !cell.isFlagged;
  }
  return cell;
}

/**
 * @param {Cell[][]} board
 * @returns {boolean} true si toutes les cellules non-minées sont révélées
 */
function checkWinCondition(board) {
  for (const line of board) {
    for (const cell of line) {
      if (!cell.isMine && !cell.isRevealed) {
        return false;
      }
    }
  }
  return true;
}

/* -------------------------------------------------------------------------
 * 2. Contrôleur (orchestre le modèle + horloge, pas de DOM)
 * ---------------------------------------------------------------------- */

/**
 * @param {Difficulty} difficulty
 * @returns {GameState}
 */
function createGame(difficulty) {
  return {
    board: createEmptyBoard(difficulty.rows, difficulty.cols),
    difficulty,
    status: 'ready',
    flagsPlaced: 0,
    startTime: null,
  };
}

function revealAllMines(board) {
  for (const line of board) {
    for (const cell of line) {
      if (cell.isMine) {
        cell.isRevealed = true;
      }
    }
  }
}

/**
 * @param {GameState} state
 * @param {number} row
 * @param {number} col
 * @returns {GameState}
 */
function handleCellReveal(state, row, col) {
  if (state.status === 'won' || state.status === 'lost') {
    return state;
  }

  const cell = state.board[row][col];
  if (cell.isRevealed || cell.isFlagged) {
    return state;
  }

  let status = state.status;
  let startTime = state.startTime;

  if (status === 'ready') {
    placeMines(state.board, state.difficulty.mines, row, col);
    computeAdjacency(state.board);
    status = 'playing';
    startTime = Date.now();
  }

  const { hitMine } = revealCell(state.board, row, col);

  if (hitMine) {
    revealAllMines(state.board);
    status = 'lost';
  } else if (checkWinCondition(state.board)) {
    status = 'won';
  }

  return {
    ...state,
    status,
    startTime,
  };
}

/**
 * @param {GameState} state
 * @param {number} row
 * @param {number} col
 * @returns {GameState}
 */
function handleCellFlag(state, row, col) {
  if (state.status === 'won' || state.status === 'lost') {
    return state;
  }

  const cell = state.board[row][col];
  if (cell.isRevealed) {
    return state;
  }

  toggleFlag(state.board, row, col);
  const flagsPlaced = state.flagsPlaced + (cell.isFlagged ? 1 : -1);

  return {
    ...state,
    flagsPlaced,
  };
}

/**
 * @param {GameState} state
 * @param {Difficulty} difficulty
 * @returns {GameState}
 */
function resetGame(state, difficulty) {
  return createGame(difficulty);
}

/* -------------------------------------------------------------------------
 * 3. Rendu / DOM (aucune règle de jeu ici)
 * ---------------------------------------------------------------------- */

const ADJACENT_SYMBOLS = ['', '1', '2', '3', '4', '5', '6', '7', '8'];

/**
 * Construit la grille de cellules une seule fois.
 * @param {HTMLElement} container
 * @param {Cell[][]} board
 * @param {{ onReveal: (row: number, col: number) => void, onFlag: (row: number, col: number) => void }} callbacks
 * @returns {void}
 */
function renderBoard(container, board, callbacks) {
  container.innerHTML = '';
  const cols = board[0].length;
  container.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell';
      button.dataset.row = String(row);
      button.dataset.col = String(col);
      button.setAttribute('aria-label', `Case ${row + 1}, ${col + 1}`);

      button.addEventListener('click', () => {
        callbacks.onReveal(Number(button.dataset.row), Number(button.dataset.col));
      });
      button.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        callbacks.onFlag(Number(button.dataset.row), Number(button.dataset.col));
      });

      container.appendChild(button);
    }
  }
}

/**
 * Met à jour classes/contenu des cellules déjà rendues (pas de re-render complet).
 * @param {HTMLElement} container
 * @param {Cell[][]} board
 * @returns {void}
 */
function updateBoardView(container, board) {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      const button = container.querySelector(
        `.cell[data-row="${row}"][data-col="${col}"]`
      );
      if (!button) continue;

      button.className = 'cell';
      button.textContent = '';
      button.disabled = false;

      if (cell.isFlagged && !cell.isRevealed) {
        button.classList.add('flagged');
        button.textContent = '🚩';
        continue;
      }

      if (!cell.isRevealed) {
        continue;
      }

      button.classList.add('revealed');
      button.disabled = true;

      if (cell.isMine) {
        button.classList.add('mine');
        button.textContent = '💣';
      } else if (cell.adjacentMines > 0) {
        button.classList.add(`adjacent-${cell.adjacentMines}`);
        button.textContent = ADJACENT_SYMBOLS[cell.adjacentMines];
      }
    }
  }
}

/**
 * Marque la mine explosée séparément (style distinct) après un `updateBoardView`.
 * @param {HTMLElement} container
 * @param {number} row
 * @param {number} col
 * @returns {void}
 */
function markMineHit(container, row, col) {
  const button = container.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (button) {
    button.classList.add('mine-hit');
  }
}

function pad3(value) {
  return String(Math.max(0, Math.min(999, value))).padStart(3, '0');
}

/**
 * @param {{ mineCount: number, flagsPlaced: number, elapsedSeconds: number, status: GameStatus }} info
 * @returns {void}
 */
function updateStatusBar(info) {
  const mineCounter = document.getElementById('mine-counter');
  const timer = document.getElementById('timer');
  const resetButton = document.getElementById('reset-button');

  mineCounter.textContent = pad3(info.mineCount - info.flagsPlaced);
  timer.textContent = pad3(info.elapsedSeconds);

  if (info.status === 'won') {
    resetButton.textContent = '😎';
  } else if (info.status === 'lost') {
    resetButton.textContent = '😵';
  } else {
    resetButton.textContent = '🙂';
  }
}

/**
 * @param {'won'|'lost'} status
 * @returns {void}
 */
function showEndOverlay(status) {
  const overlay = document.getElementById('end-overlay');
  const message = document.getElementById('end-message');
  message.textContent = status === 'won' ? 'Bravo, vous avez gagné !' : 'Boum ! Partie perdue.';
  overlay.classList.remove('hidden');
}

function hideEndOverlay() {
  document.getElementById('end-overlay').classList.add('hidden');
}

/**
 * Point d'entrée : câble le DOM (#board, #difficulty-select, #reset-button, ...)
 * au contrôleur et démarre une première partie.
 * @returns {void}
 */
function initGame() {
  const boardContainer = document.getElementById('board');
  const difficultySelect = document.getElementById('difficulty-select');
  const resetButton = document.getElementById('reset-button');
  const endOverlayRestart = document.getElementById('end-overlay-restart');

  let state = null;
  let timerId = null;

  function elapsedSeconds() {
    if (!state.startTime) return 0;
    return Math.floor((Date.now() - state.startTime) / 1000);
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimerIfNeeded() {
    if (timerId === null && state.status === 'playing') {
      timerId = setInterval(() => {
        updateStatusBar({
          mineCount: state.difficulty.mines,
          flagsPlaced: state.flagsPlaced,
          elapsedSeconds: elapsedSeconds(),
          status: state.status,
        });
      }, 1000);
    }
  }

  function refreshView(previousStatus, hitRow, hitCol) {
    updateBoardView(boardContainer, state.board);
    updateStatusBar({
      mineCount: state.difficulty.mines,
      flagsPlaced: state.flagsPlaced,
      elapsedSeconds: elapsedSeconds(),
      status: state.status,
    });

    if (previousStatus !== 'playing' && state.status === 'playing') {
      startTimerIfNeeded();
    }

    if (state.status === 'lost' || state.status === 'won') {
      stopTimer();
      if (state.status === 'lost' && hitRow !== undefined) {
        markMineHit(boardContainer, hitRow, hitCol);
      }
      showEndOverlay(state.status);
    }
  }

  function onReveal(row, col) {
    const previousStatus = state.status;
    state = handleCellReveal(state, row, col);
    refreshView(previousStatus, row, col);
  }

  function onFlag(row, col) {
    const previousStatus = state.status;
    state = handleCellFlag(state, row, col);
    refreshView(previousStatus);
  }

  function startNewGame() {
    stopTimer();
    hideEndOverlay();
    const difficulty = getDifficultyPreset(difficultySelect.value);
    state = createGame(difficulty);
    renderBoard(boardContainer, state.board, { onReveal, onFlag });
    updateBoardView(boardContainer, state.board);
    updateStatusBar({
      mineCount: state.difficulty.mines,
      flagsPlaced: state.flagsPlaced,
      elapsedSeconds: 0,
      status: state.status,
    });
  }

  difficultySelect.addEventListener('change', startNewGame);
  resetButton.addEventListener('click', startNewGame);
  endOverlayRestart.addEventListener('click', startNewGame);

  startNewGame();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initGame);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDifficultyPreset,
    createEmptyBoard,
    getNeighborCoords,
    placeMines,
    computeAdjacency,
    revealCell,
    toggleFlag,
    checkWinCondition,
    createGame,
    revealAllMines,
    handleCellReveal,
    handleCellFlag,
    resetGame,
  };
}
