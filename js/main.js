// js/main.js
import { createTile, clearGrid } from './tiles.js';
import { scrollToTile, getAvailablePositions } from './grid.js';

const gridContainer = document.getElementById('gridContainer');
const stepSlider = document.getElementById('stepSlider');
const stepValue = document.getElementById('stepValue');
const stepToggle = document.getElementById('stepToggle');
const stepCounter = document.getElementById('stepCounter');
const noteModal = document.getElementById('noteModal');
const noteText = document.getElementById('noteText');
const closeNote = document.getElementById('closeNote');

let stepCount = 0;
let maxSteps = parseInt(stepSlider.value);
let showCounter = stepToggle.checked;

const path = []; // Stack of clicked tiles with { x, y, stepIndex, note }
const gridMap = new Map(); // Keyed by `${x},${y}`
const occupied = new Set(); // Tracks all placed tiles
let returnIndex = null;

function updateStepDisplay() {
  stepCounter.style.display = showCounter ? 'block' : 'none';
  if (showCounter) {
    stepCounter.textContent = `Step ${stepCount}`;
  }
}

function initializeGrid() {
  clearGrid(gridContainer);
  path.length = 0;
  gridMap.clear();
  occupied.clear();
  stepCount = 0;
  returnIndex = null;
  updateStepDisplay();

  const x = 0, y = 0;
  const startTile = createTile(x, y, 'begin', handleTileClick);
  startTile.setState('grey');
  gridContainer.appendChild(startTile.el);
  gridMap.set(`${x},${y}`, startTile);
  occupied.add(`${x},${y}`);
  scrollToTile(startTile.el);
}


function handleTileClick(x, y) {
  const key = `${x},${y}`;
  const tile = gridMap.get(key);
  if (!tile || tile.state !== 'grey') return;

  // Special handling for the first tile
  if (stepCount === 0 && tile.label === 'begin') {
    tile.setState('black');
    stepCount++;
    updateStepDisplay();
    path.push({ x, y, stepIndex: stepCount, note: '' });

    addNextTiles(x, y); // show first 3 tiles
    scrollToTile(tile.el);
    return; // done with special case
  }

  tile.setState('black');
  stepCount++;
  updateStepDisplay();
  path.push({ x, y, stepIndex: stepCount, note: '' });
  scrollToTile(tile.el);

  if (stepCount === maxSteps) {
    showCenter(x, y);
  } else {
    addNextTiles(x, y);
    removeOldGreyTiles();
  }

  if (tile.state === 'black') {
    tile.el.addEventListener('click', () => openNoteModal(x, y));
  }
}


function addNextTiles(x, y) {
  const available = getAvailablePositions(x, y, occupied);
  const next = available.slice(0, 3);

  next.forEach(pos => {
    const tile = createTile(pos.x, pos.y, '', handleTileClick);
    gridContainer.appendChild(tile.el);
    gridMap.set(`${pos.x},${pos.y}`, tile);
    occupied.add(`${pos.x},${pos.y}`);
  });
}

function removeOldGreyTiles() {
  gridMap.forEach(tile => {
    if (tile.state === 'grey') {
      tile.el.remove();
      gridMap.delete(`${tile.x},${tile.y}`);
      occupied.delete(`${tile.x},${tile.y}`);
    }
  });
}

stepSlider.addEventListener('input', () => {
  stepValue.textContent = stepSlider.value;
  maxSteps = parseInt(stepSlider.value);
});

stepToggle.addEventListener('change', () => {
  showCounter = stepToggle.checked;
  updateStepDisplay();
});

function showCenter(x, y) {
  const centerTile = createTile(x, y, 'center');
  centerTile.setState('black', 'center');
  gridContainer.appendChild(centerTile.el);
  scrollToTile(centerTile.el);

  const returnData = path[path.length - 1];
  const returnTile = gridMap.get(`${returnData.x},${returnData.y}`);
  returnTile.setState('black', 'return');
  returnTile.el.addEventListener('click', () => {
    centerTile.el.remove();
    initiateReturnPhase();
  }, { once: true });
}

function initiateReturnPhase() {
  path.forEach(({ x, y }) => {
    const tile = gridMap.get(`${x},${y}`);
    if (tile) tile.setState('grey');
  });

  returnIndex = path.length - 1;
  const { x, y } = path[returnIndex];
  const tile = gridMap.get(`${x},${y}`);
  if (tile) {
    tile.setState('black');
    tile.el.addEventListener('click', () => handleReturnClick(), { once: true });
  }
}

function handleReturnClick() {
  const { x, y, note } = path[returnIndex];
  const tile = gridMap.get(`${x},${y}`);
  if (!tile) return;

  tile.el.remove();
  gridMap.delete(`${x},${y}`);
  occupied.delete(`${x},${y}`);

  if (note) openNoteModal(x, y, note);

  returnIndex--;

  if (returnIndex >= 0) {
    const next = path[returnIndex];
    const nextTile = gridMap.get(`${next.x},${next.y}`);
    if (nextTile) {
      nextTile.setState('black');
      nextTile.el.addEventListener('click', () => handleReturnClick(), { once: true });
      scrollToTile(nextTile.el);
    }
  } else {
    showEndTile();
  }
}

function showEndTile() {
  const start = path[0];
  const tile = createTile(start.x, start.y, 'end');
  tile.setState('black', 'end');
  gridContainer.appendChild(tile.el);
  scrollToTile(tile.el);

  tile.el.addEventListener('click', () => {
    gridContainer.style.transition = 'transform 1s ease';
    gridContainer.style.transformOrigin = 'center center';
    gridContainer.style.transform = 'scale(0.5) translate(-50%, -50%)';
    setTimeout(() => {
      alert('You have returned.');
    }, 1000);
  }, { once: true });
}

function openNoteModal(x, y, note = '') {
  console.log('Opening modal for:', x, y); // <- log it!
  noteText.value = note;
  noteModal.classList.remove('hidden');
  closeNote.onclick = () => {
    noteModal.classList.add('hidden');
    if (!note && noteText.value.trim()) {
      const entry = path.find(p => p.x === x && p.y === y);
      if (entry) entry.note = noteText.value.trim();
    }
  };
}

// Start the app
initializeGrid();
