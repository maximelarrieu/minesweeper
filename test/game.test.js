'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeDocument } = require('./helpers/dom-stub.js');

global.document = createFakeDocument();

const {
  createGame,
  handleCellReveal,
  handleCellFlag,
  checkWinCondition,
  getDifficultyPreset,
  renderBoard,
} = require('../game.js');

test('premier clic sûr : la case cliquée et ses voisines ne contiennent jamais de mine', () => {
  const difficulty = { rows: 9, cols: 9, mines: 10 };
  for (let attempt = 0; attempt < 20; attempt++) {
    let state = createGame(difficulty);
    state = handleCellReveal(state, 4, 4);

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const cell = state.board[4 + dr][4 + dc];
        assert.equal(cell.isMine, false);
      }
    }
    assert.equal(state.status, 'playing');
  }
});

test('flood-fill : révéler une case à 0 mine adjacente révèle toute la zone connectée', () => {
  const difficulty = { rows: 9, cols: 9, mines: 1 };
  let state = createGame(difficulty);
  state = handleCellReveal(state, 0, 0);

  const revealedCount = state.board
    .flat()
    .filter((cell) => cell.isRevealed).length;

  assert.ok(
    revealedCount > 1,
    'le flood-fill doit révéler plus qu\'une seule case sur une grille quasi vide'
  );
});

test('condition de victoire : révéler toutes les cases sans mine déclare la partie gagnée', () => {
  const difficulty = { rows: 2, cols: 2, mines: 1 };
  let state = createGame(difficulty);
  state = handleCellReveal(state, 0, 0);

  assert.notEqual(state.status, 'lost', 'le premier clic ne doit jamais toucher une mine');

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const cell = state.board[row][col];
      if (!cell.isMine && !cell.isRevealed) {
        state = handleCellReveal(state, row, col);
      }
    }
  }

  assert.equal(state.status, 'won');
  assert.equal(checkWinCondition(state.board), true);
});

test('défaite : révéler une mine termine la partie et révèle toutes les mines', () => {
  const difficulty = { rows: 5, cols: 5, mines: 20 };
  let state = createGame(difficulty);
  state = handleCellReveal(state, 0, 0);

  assert.equal(state.status, 'playing');

  const mineCell = state.board
    .flat()
    .find((cell) => cell.isMine && !cell.isRevealed);
  assert.ok(mineCell, 'il doit rester au moins une mine non révélée après le 1er clic sûr');

  state = handleCellReveal(state, mineCell.row, mineCell.col);

  assert.equal(state.status, 'lost');
  for (const cell of state.board.flat()) {
    if (cell.isMine) {
      assert.equal(cell.isRevealed, true);
    }
  }
});

test('un flag empêche la révélation tant qu\'il n\'est pas retiré', () => {
  const difficulty = { rows: 5, cols: 5, mines: 5 };
  let state = createGame(difficulty);
  state = handleCellFlag(state, 2, 2);
  assert.equal(state.board[2][2].isFlagged, true);
  assert.equal(state.flagsPlaced, 1);

  state = handleCellReveal(state, 2, 2);
  assert.equal(state.board[2][2].isRevealed, false);

  state = handleCellFlag(state, 2, 2);
  assert.equal(state.board[2][2].isFlagged, false);
  assert.equal(state.flagsPlaced, 0);
});

test('renderBoard peuple #board avec une cellule par case, pour chaque difficulté', () => {
  for (const name of ['beginner', 'intermediate', 'expert']) {
    const difficulty = getDifficultyPreset(name);
    const state = createGame(difficulty);
    const container = document.createElement('div');

    renderBoard(container, state.board, { onReveal() {}, onFlag() {} });

    assert.equal(
      container.children.length,
      difficulty.rows * difficulty.cols,
      `${name} : ${difficulty.rows}x${difficulty.cols} attendu`
    );
  }
});

test('renderBoard vide le conteneur avant de le repeupler (pas d\'accumulation sur un changement de difficulté)', () => {
  const difficulty = { rows: 3, cols: 3, mines: 1 };
  const state = createGame(difficulty);
  const container = document.createElement('div');

  renderBoard(container, state.board, { onReveal() {}, onFlag() {} });
  renderBoard(container, state.board, { onReveal() {}, onFlag() {} });

  assert.equal(container.children.length, 9);
});

test('clic gauche sur une cellule déclenche onReveal avec les coordonnées de cette cellule', () => {
  const difficulty = { rows: 3, cols: 3, mines: 1 };
  const state = createGame(difficulty);
  const container = document.createElement('div');
  const calls = [];

  renderBoard(container, state.board, {
    onReveal: (row, col) => calls.push(['reveal', row, col]),
    onFlag: (row, col) => calls.push(['flag', row, col]),
  });

  const button = container.querySelector('.cell[data-row="1"][data-col="2"]');
  assert.ok(button, 'la cellule (1,2) doit exister dans le DOM rendu');

  button.trigger('click');

  assert.deepEqual(calls, [['reveal', 1, 2]]);
});

test('clic droit sur une cellule déclenche onFlag (pas onReveal) et bloque le menu contextuel natif', () => {
  const difficulty = { rows: 3, cols: 3, mines: 1 };
  const state = createGame(difficulty);
  const container = document.createElement('div');
  const calls = [];

  renderBoard(container, state.board, {
    onReveal: (row, col) => calls.push(['reveal', row, col]),
    onFlag: (row, col) => calls.push(['flag', row, col]),
  });

  const button = container.querySelector('.cell[data-row="0"][data-col="1"]');
  const event = button.trigger('contextmenu');

  assert.equal(event.defaultPrevented, true, 'le menu contextuel natif doit être bloqué');
  assert.deepEqual(calls, [['flag', 0, 1]]);
});
