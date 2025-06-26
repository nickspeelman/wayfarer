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
let isReturning = false;


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
  if (isReturning) {
    console.warn("Ignored handleTileClick during return phase");
    return;
  }

  const key = `${x},${y}`;
  const tile = gridMap.get(key);
  if (!tile || tile.state !== 'grey') return;

  tile.setState('black');
  stepCount++;
  updateStepDisplay();
  path.push({ x, y, stepIndex: stepCount, note: '' });
  scrollToTile(tile.el);

  //tile.el.addEventListener('click', () => openNoteModal(x, y));

  const available = getAvailablePositions(x, y, occupied);

  if (stepCount === maxSteps || available.length === 0) {
    showCenter(x, y);
  } else {
    removeOldGreyTiles(available);
    addNextTiles(x, y);
}

}



function addNextTiles(x, y) {
  const available = getAvailablePositions(x, y, occupied);
  console.log("Available positions for next tiles:", available);

  const next = available.slice(0, 3);
  next.forEach(pos => {
    const tile = createTile(pos.x, pos.y, '', handleTileClick);
    gridContainer.appendChild(tile.el);
    gridMap.set(`${pos.x},${pos.y}`, tile);
    occupied.add(`${pos.x},${pos.y}`);
  });
}


function removeOldGreyTiles(excludePositions = []) {
  gridMap.forEach(tile => {
    const key = `${tile.x},${tile.y}`;
    const isExcluded = excludePositions.some(pos => pos.x === tile.x && pos.y === tile.y);
    if (tile.state === 'grey' && !isExcluded) {
      console.log(`Removing grey tile at ${tile.x}, ${tile.y}`);
      tile.el.remove();
      gridMap.delete(key);
      occupied.delete(key);
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
  const centerModal = document.getElementById('centerModal');
  const returnBtn = document.getElementById('returnBtn');

  centerModal.classList.remove('hidden');

  returnBtn.onclick = () => {
    centerModal.classList.add('hidden');

    const lastStep = path[path.length - 1];
    const tile = gridMap.get(`${lastStep.x},${lastStep.y}`);
    if (tile) {
      tile.setState('grey');
    }

    removeOldGreyTiles([{ x: lastStep.x, y: lastStep.y }]);
    initiateReturnPhase();
  };
}

function initiateReturnPhase() {
  isReturning = true;
  returnIndex = path.length - 1;

  path.forEach(({ x, y }, idx) => {
  const tile = gridMap.get(`${x},${y}`);
  if (tile) {
    if (idx === returnIndex) {
      // Last tile in the path – make it grey and clickable
      const newTileEl = tile.el.cloneNode(true);
      tile.el.replaceWith(newTileEl);
      tile.el = newTileEl;
      tile.setState('grey');
      tile.el.addEventListener('click', () => handleReturnClick(), { once: true });
    } else if (idx === 0) {
      // 🎯 First tile in the path — change label to "end"
      tile.setState('black', 'end');
    } else {
      tile.setState('black');
    }
  }
});
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
      nextTile.setState('grey'); // ✅ Turn the next tile grey
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

  // 🚀 Trigger zoom-out immediately
  gridContainer.style.transition = 'transform 1s ease';
  gridContainer.style.transformOrigin = 'center center';
  gridContainer.style.transform = 'scale(0.5) translate(-50%, -50%)';

  setTimeout(() => {
    alert('You have returned.');
  }, 1000);
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
