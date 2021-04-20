const htmlGrid = document.querySelector('.grid');
const htmlScore = document.querySelector('.score');
const htmlMessage = document.querySelector('.message');
const mainBtn = document.getElementById('main-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const downBtn = document.getElementById('down-btn');

const grid = [];
const boardWidth = 10;
const boardHeight = 20;
const gameLoopSpeed = 80;
const progressShapeLimit = 10;

let spawnPos = [4, 1];
//Collection of all possible shapes.
let shapes = [
  {
    //Line
    pos: [...spawnPos],
    tiles: [
      [-1, 0],
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  },
  {
    //L shape
    pos: [...spawnPos],
    tiles: [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 0],
    ],
  },
  {
    //T shape
    pos: [...spawnPos],
    tiles: [
      [0, 0],
      [0, 1],
      [1, 0],
      [-1, 0],
    ],
  },
  {
    // Z shape
    pos: [...spawnPos],
    tiles: [
      [0, 0],
      [0, 1],
      [1, 1],
      [-1, 0],
    ],
  },
  {
    // Square
    static: true,
    pos: [...spawnPos],
    tiles: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  },
];
let gameInterval;
let gamePaused = true;
let gameOver = true;
let score = 0;
let currentShape = {};
let translateIntentDir = [0, 0];
let translateIntent = false;
let rotateIntent = false;
let progressShapeCounter = 0;

/* ----- GAME STATE ----- */
function initialise() {
  createBoard();
  htmlScore.textContent = 0;
  htmlMessage.textContent = 'Press any key to start!';
}

function newGame() {
  //Reset variables
  if (gameInterval) clearInterval(gameInterval);
  htmlScore.textContent = 0;
  htmlMessage.textContent = "Let's play!";
  gamePaused = false;
  gameOver = false;
  currentShape = {};

  //Clear board
  clearBoard();

  //Spawn new shape
  newShape();
  //Start new game loop
  gameInterval = setInterval(gameLoop, gameLoopSpeed);
}

function gameLoop() {
  if (gamePaused || gameOver) return;

  //Apply player input
  if (translateIntent) {
    translateShape(currentShape, translateIntentDir);

    //translateIntent = false;
  }
  if (rotateIntent && currentShape.pos[1] > 2) {
    rotateShape(currentShape);
    rotateIntent = false;
  }

  //Translate shape down
  if (progressShapeCounter >= progressShapeLimit) {
    translateShape(currentShape, [0, 1]);
    progressShapeCounter = 0;
  }

  //Advance progress shape counter
  progressShapeCounter++;
}

function increaseScore(points) {
  for (let i = 0; i < points; i++) {
    setTimeout(addOnePoint, 50 * i);
  }

  function addOnePoint() {
    score++;
    htmlScore.textContent = score;
  }
}

function endGame() {
  gameOver = true;
  gamePaused = true;
  htmlScore.textContent = 'GAME OVER!';
  htmlMessage.textContent = `You've made ${score} points. Press any key to restart`;
}

/* ----- BOARD ----- */
function createBoard() {
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      let tile = document.createElement('div');
      tile.id = `${x}-${y}`;
      if (y < 5) tile.classList.add('staging');
      htmlGrid.append(tile);
      grid.push(tile);
    }
  }
}

function clearBoard() {
  for (let i = 0; i < grid.length; i++) {
    grid[i].className = '';
    if (i < 5 * boardWidth) {
      grid[i].classList.add('staging');
    }
  }
}

/* ----- SHAPES ----- */
function newShape() {
  //Create new shape
  let randomIndex = Math.floor(Math.random() * 5);
  currentShape = {
    pos: [...shapes[randomIndex].pos],
    tiles: [...shapes[randomIndex].tiles],
  };

  //Check for collisions
  for (let i = 0; i < currentShape.tiles.length; i++) {
    let x = currentShape.tiles[i][0] + currentShape.pos[0];
    let y = currentShape.tiles[i][1] + currentShape.pos[1];
    if (checkForCollisions(x, y)) return endGame();
  }

  drawShape(currentShape);
}

function drawShape(s) {
  for (let i = 0; i < s.tiles.length; i++) {
    //Draw tiles
    let x = s.pos[0] + s.tiles[i][0];
    let y = s.pos[1] + s.tiles[i][1];
    //Access the tile at the given coordinate.
    let tile = grid[x + y * boardWidth];

    //Draw it
    y < 5 ? tile.classList.remove('staging') : tile.classList.add('filled');
  }
}

function clearShape(s) {
  for (let i = 0; i < s.tiles.length; i++) {
    //Clear tiles
    let x = s.pos[0] + s.tiles[i][0];
    let y = s.pos[1] + s.tiles[i][1];
    //Access the tile at the given coordinate.
    let tile = grid[x + y * boardWidth];
    //Clean it up
    y < 5 ? tile.classList.add('staging') : tile.classList.remove('filled');
  }
}

function translateShape(s, dir) {
  //Copy shape tiles
  let shapeTiles = [...s.tiles];

  //Clear shape
  clearShape(s);

  //Keep track of relevant variables
  let collision = false;
  let shapeInStaging = false;
  let shapeLanded = false;

  //Check for collisions
  for (let i = 0; i < shapeTiles.length; i++) {
    let x = s.tiles[i][0] + s.pos[0];
    let y = s.tiles[i][1] + s.pos[1];
    let newX = x + dir[0];
    let newY = y + dir[1];
    shapeTiles[i] = [newX, newY];

    //Check if tile is in staging area
    if (y < 5) {
      shapeInStaging = true;
    }

    if (checkForCollisions(newX, newY)) {
      if (dir[1] === 1) shapeLanded = true;
      collision = true;
    }
  }

  //Translate shape
  if (!collision) {
    currentShape.pos[0] += dir[0];
    currentShape.pos[1] += dir[1];
  }

  //Redraw shape.
  drawShape(s);

  //Check if game over.
  if (gameOver) endGame();

  //Check if shape landed.
  if (shapeLanded) {
    shapeInStaging ? endGame() : newShape();
    checkLines(boardHeight - 1);
  }
}

function rotateShape(s) {
  //If shape is static don't rotate it (i.e. squares)
  if (s.static) return;

  //Copy shape tiles
  let shapeTiles = [...s.tiles];

  //Clear shape
  clearShape(s);

  //Keep track of any future collisons
  let collisions = false;

  //Rotate Shape
  for (let i = 0; i < shapeTiles.length; i++) {
    let newX = s.tiles[i][1] * -1;
    let newY = s.tiles[i][0];
    shapeTiles[i] = [newX, newY];
    if (checkForCollisions(newX + s.pos[0], newY + s.pos[1])) {
      collisions = true;
    }
  }

  //If no collisions, assing new rotation.
  if (!collisions) s.tiles = shapeTiles;

  //Redraw shape.
  drawShape(s);
}

function checkForCollisions(x, y) {
  //Access the tile at the given coordinate.
  let tile = grid[x + y * boardWidth];

  //Check if game over
  if (y <= 0) {
    gameOver = true;
    return true;
  }

  //Check if tile landed
  if (y > boardHeight - 1) {
    return true;
  }

  //Check collisions with left & right
  if (x < 0 || x > boardWidth - 1) {
    return true;
  }

  //Check collisions with other tiles
  if (tile.classList.contains('filled')) {
    return true;
  }

  return false;
}

/* ----- LINES ----- */
function checkLines(height, linesCompleted = []) {
  if (gameOver) return;
  gamePaused = true;
  let counter = 0;

  for (let i = 0; i < boardWidth; i++) {
    if (grid[i + boardWidth * height].classList.contains('filled')) counter++;
  }

  //If the line was full, paint it blue.
  if (counter === boardWidth) {
    linesCompleted.push(height);
  }

  //If the line was empty, we're done checking lines.
  if (counter === 0) {
    return updateLines(boardHeight - height - 1, linesCompleted);
  }

  //Otherwise, check the line above
  checkLines(height - 1, linesCompleted);
}

function updateLines(total, completed) {
  let delayClear = 50;
  let delayMove = 70;

  //If there is no lines completed return
  if (completed.length === 0) return (gamePaused = false);

  //Otherwise keep track of the gaps
  const totalLines = boardHeight - 1;
  let linesCleared = 0;
  let linesMoved = 0;

  //Loop through all the lines with tiles
  for (let i = 0; i < total; i++) {
    if (completed.includes(totalLines - i)) {
      //If line was completed, clear it & increase the score
      setTimeout(() => clearLine(totalLines - i), delayClear * linesCleared);
      increaseScore(10);
      linesCleared++;
      continue;
    }

    //Otherwise, move line down.
    if (linesCleared > 0) {
      setTimeout(
        () => moveLineDown(totalLines - i, linesCleared),
        delayMove * linesMoved + delayClear * linesCleared
      );
      linesMoved++;
    }
  }

  return (gamePaused = false);
}

function moveLineDown(height, offset) {
  for (let i = 0; i < boardWidth; i++) {
    let tile = grid[i + boardWidth * height];
    let target = grid[i + boardWidth * height + boardWidth * offset];

    if (tile.classList.contains('filled')) {
      //Move filled tile down
      target.classList.add('filled');

      //Apply trail effect
      tile.classList.add('trail');
      setTimeout(() => tile.classList.remove('trail'), 500);
    }

    //Clear previous tile
    tile.classList.remove('filled');
  }
}

function clearLine(height) {
  for (let i = 0; i < boardWidth; i++) {
    let tile = grid[i + boardWidth * height];

    //Clear tile
    tile.classList.remove('filled');

    //Apply flash effect
    tile.classList.add('flash');
    setTimeout(() => tile.classList.remove('flash'), 50 * i);
  }
}

/* ----- USER INPUT ----- */

//Keys events
document.addEventListener('keydown', (e) => handleBtnDown(e.key));
document.addEventListener('keyup', (e) => handleBtnUp(e.key));

//Pointer events
mainBtn.addEventListener('pointerdown', () => handleBtnDown(' '));
leftBtn.addEventListener('pointerdown', () => handleBtnDown('ArrowLeft'));
rightBtn.addEventListener('pointerdown', () => handleBtnDown('ArrowRight'));
downBtn.addEventListener('pointerdown', () => handleBtnDown('ArrowDown'));

document.addEventListener('pointerup', () => handleBtnUp(''));
document.addEventListener('touchend', () => handleBtnUp(''));

function handleBtnDown(key) {
  if (gamePaused || gameOver) return;

  switch (key) {
    case ' ':
      rotateIntent = true;
      break;
    case 'ArrowLeft':
      //translateShape(currentShape, [-1, 0]);
      translateIntent = true;
      translateIntentDir = [-1, 0];
      break;
    case 'ArrowRight':
      //translateShape(currentShape, [1, 0]);
      translateIntent = true;
      translateIntentDir = [1, 0];
      break;
    case 'ArrowDown':
      //translateShape(currentShape, [0, 1]);
      translateIntent = true;
      translateIntentDir = [0, 1];
      break;
    default:
      break;
  }
}

function handleBtnUp(key) {
  console.log('keyUp!');
  //Restart translate intent
  translateIntent = false;

  //Check if we're starting a new game
  if (gameOver) return newGame();

  switch (key) {
    case 'r':
      newGame();
      break;
    case 'p':
      gamePaused = !gamePaused;
    default:
      break;
  }
}

/* ----- init! ----- */
initialise();
