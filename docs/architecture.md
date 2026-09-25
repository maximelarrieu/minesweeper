# Architecture — Démineur

## Contexte

Dépôt vide (rien à réutiliser). Choix technique : **HTML/CSS/JS vanilla, sans build
ni dépendance**. C'est le plus rapide à livrer pour ce périmètre (un plateau,
un clic gauche/droit, un compteur, un timer) : ouvrir `index.html` dans un
navigateur suffit, aucune tooling à maintenir.

## Fichiers

```
index.html   → structure DOM (déjà écrit, voir plus bas)
style.css    → apparence de la grille et des cellules (squelette de sélecteurs)
game.js      → modèle de données + logique de jeu + rendu DOM (signatures, à implémenter)
```

Un seul fichier JS comme demandé par le ticket, mais organisé en 3 sections
cloisonnées à l'intérieur (voir découpage ci-dessous) pour que la logique pure
et le rendu DOM restent séparés et testables indépendamment.

## Modèle de données

```js
/**
 * @typedef {Object} Cell
 * @property {boolean} isMine
 * @property {boolean} isRevealed
 * @property {boolean} isFlagged
 * @property {number}  adjacentMines   // 0-8, calculé à la génération
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
 *   ready   : plateau généré sans mines placées, en attente du 1er clic
 *   playing : mines placées, partie en cours
 *   won     : toutes les cellules non-minées révélées
 *   lost    : une mine a été révélée
 */

/**
 * @typedef {Object} GameState
 * @property {Cell[][]}   board       // board[row][col]
 * @property {Difficulty} difficulty
 * @property {GameStatus} status
 * @property {number}     flagsPlaced
 * @property {number}     startTime   // ms epoch, fixé au 1er clic
 */
```

Placement des mines différé au premier clic (pattern standard démineur) :
`generateBoard` crée une grille vide, puis `placeMines(board, safeRow, safeCol, mineCount)`
exclut la cellule cliquée (et ses voisines) pour garantir un premier coup sûr.

## Découpage interne de `game.js`

### 1. Modèle / logique pure (pas de DOM, testable isolément)

```js
function createEmptyBoard(rows, cols) {}                 // -> Cell[][]
function placeMines(board, mineCount, safeRow, safeCol) {} // -> void (mutate board)
function computeAdjacency(board) {}                        // -> void (remplit adjacentMines)
function revealCell(board, row, col) {}
  // -> { revealed: {row,col}[], hitMine: boolean }
  // flood-fill si adjacentMines === 0
function toggleFlag(board, row, col) {}                    // -> Cell
function checkWinCondition(board) {}                       // -> boolean
function getDifficultyPreset(name) {}                       // -> Difficulty
  // 'beginner' 9x9/10, 'intermediate' 16x16/40, 'expert' 30x16/99
```

### 2. Contrôleur (orchestre modèle + horloge, pas de DOM)

```js
function createGame(difficulty) {}      // -> GameState
function handleCellReveal(state, row, col) {} // -> GameState (nouvel état)
function handleCellFlag(state, row, col) {}   // -> GameState
function resetGame(state, difficulty) {}      // -> GameState
```

### 3. Rendu / DOM (aucune règle de jeu ici, uniquement lecture d'état + événements)

```js
function renderBoard(container, board, callbacks) {}
  // callbacks: { onReveal(row,col), onFlag(row,col) }
  // construit la grille de <button class="cell"> une seule fois

function updateBoardView(container, board) {}
  // met à jour classes/contenu des cellules déjà rendues (pas de re-render complet)

function updateStatusBar({ mineCount, flagsPlaced, elapsedSeconds, status }) {}

function showEndOverlay(status) {} // 'won' | 'lost'

function initGame() {}
  // point d'entrée : lit la difficulté choisie, appelle createGame,
  // renderBoard, démarre le timer, câble les callbacks -> handleCellReveal/Flag
```

### Contrat logique ↔ rendu

- La logique ne touche jamais au DOM ; elle prend et retourne des données
  (`GameState`, `Cell[][]`).
- Le rendu ne modifie jamais l'état ; il appelle les callbacks fournies par le
  contrôleur puis redemande l'affichage via `updateBoardView`.
- `initGame` est le seul point de couture entre les deux couches.

## Structure DOM (`index.html`)

```
#app
  .status-bar
    #mine-counter
    #reset-button      (visage souriant, reset au clic)
    #timer
  #board.board         (grid CSS générée dynamiquement en JS : grid-template-columns)
  #difficulty-select    (beginner/intermediate/expert)
  #end-overlay.hidden   (message victoire/défaite)
```

Chaque cellule rendue : `<button class="cell" data-row data-col>` avec classes
d'état ajoutées dynamiquement (`revealed`, `flagged`, `mine`, `mine-hit`,
`adjacent-N`).

## Fichiers livrés par l'architecte

- `docs/architecture.md` (ce fichier)
- `index.html` — structure complète (markup statique, pas de logique)
- `style.css` — squelette de sélecteurs (classes listées, pas de règles visuelles)
- `game.js` — typedefs + signatures de fonctions ci-dessus, corps en
  `throw new Error('not implemented')`

## Reste à faire par le rôle suivant (dev)

- Implémenter toutes les fonctions de `game.js` (modèle, contrôleur, rendu).
- Remplir `style.css` (grille, couleurs par nombre adjacent, états survolé/pressé,
  overlay fin de partie).
- Gérer le clic droit (flag) avec `event.preventDefault()` sur `contextmenu`.
- Démarrer/arrêter le timer (`setInterval`) proprement entre les statuts.
