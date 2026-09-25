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

/**
 * @param {'beginner'|'intermediate'|'expert'} name
 * @returns {Difficulty}
 */
function getDifficultyPreset(name) {
  throw new Error('not implemented');
}

/**
 * @param {number} rows
 * @param {number} cols
 * @returns {Cell[][]}
 */
function createEmptyBoard(rows, cols) {
  throw new Error('not implemented');
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
  throw new Error('not implemented');
}

/**
 * Calcule Cell.adjacentMines pour chaque cellule. Mute `board` en place.
 * @param {Cell[][]} board
 * @returns {void}
 */
function computeAdjacency(board) {
  throw new Error('not implemented');
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
  throw new Error('not implemented');
}

/**
 * @param {Cell[][]} board
 * @param {number} row
 * @param {number} col
 * @returns {Cell}
 */
function toggleFlag(board, row, col) {
  throw new Error('not implemented');
}

/**
 * @param {Cell[][]} board
 * @returns {boolean} true si toutes les cellules non-minées sont révélées
 */
function checkWinCondition(board) {
  throw new Error('not implemented');
}

/* -------------------------------------------------------------------------
 * 2. Contrôleur (orchestre le modèle + horloge, pas de DOM)
 * ---------------------------------------------------------------------- */

/**
 * @param {Difficulty} difficulty
 * @returns {GameState}
 */
function createGame(difficulty) {
  throw new Error('not implemented');
}

/**
 * @param {GameState} state
 * @param {number} row
 * @param {number} col
 * @returns {GameState}
 */
function handleCellReveal(state, row, col) {
  throw new Error('not implemented');
}

/**
 * @param {GameState} state
 * @param {number} row
 * @param {number} col
 * @returns {GameState}
 */
function handleCellFlag(state, row, col) {
  throw new Error('not implemented');
}

/**
 * @param {GameState} state
 * @param {Difficulty} difficulty
 * @returns {GameState}
 */
function resetGame(state, difficulty) {
  throw new Error('not implemented');
}

/* -------------------------------------------------------------------------
 * 3. Rendu / DOM (aucune règle de jeu ici)
 * ---------------------------------------------------------------------- */

/**
 * Construit la grille de cellules une seule fois.
 * @param {HTMLElement} container
 * @param {Cell[][]} board
 * @param {{ onReveal: (row: number, col: number) => void, onFlag: (row: number, col: number) => void }} callbacks
 * @returns {void}
 */
function renderBoard(container, board, callbacks) {
  throw new Error('not implemented');
}

/**
 * Met à jour classes/contenu des cellules déjà rendues (pas de re-render complet).
 * @param {HTMLElement} container
 * @param {Cell[][]} board
 * @returns {void}
 */
function updateBoardView(container, board) {
  throw new Error('not implemented');
}

/**
 * @param {{ mineCount: number, flagsPlaced: number, elapsedSeconds: number, status: GameStatus }} info
 * @returns {void}
 */
function updateStatusBar(info) {
  throw new Error('not implemented');
}

/**
 * @param {'won'|'lost'} status
 * @returns {void}
 */
function showEndOverlay(status) {
  throw new Error('not implemented');
}

/**
 * Point d'entrée : câble le DOM (#board, #difficulty-select, #reset-button, ...)
 * au contrôleur et démarre une première partie.
 * @returns {void}
 */
function initGame() {
  throw new Error('not implemented');
}

document.addEventListener('DOMContentLoaded', initGame);
