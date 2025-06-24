// js/main.js
import { createTile, clearGrid } from './tiles.js';
import { scrollToTile } from './grid.js';

const gridContainer = document.getElementById('gridContainer');
const stepSlider = document.getElementById('stepSlider');
const stepValue = document.getElementById('stepValue');
const stepToggle = document.getElementById('stepToggle');
const stepCounter = document.getElementById('stepCounter');

let stepCount = 0;
let maxSteps = parseInt(stepSlider.value);
let showCounter = stepToggle.checked;

const path = []; // Stack of clicked tiles with { x, y, stepIndex, note }
const gridMap = new Map(); // Keyed by `${x},${y}`

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
  stepCount = 0;
  updateStepDisplay();

  // Start at (0,0)
  const startTile = createTile(0, 0, 'begin', (x, y) => handleTileClick(x, y));
  gridContainer.appendChild(startTile.el);
  scrollToTile(startTile.el);
  gridMap.set('0,0', startTile);
}

function handleTileClick(x, y) {
  const key = `${x},${y}`;
  const tile = gridMap.get(key);
  if (!tile || tile.state !== 'grey') return;

  tile.setState('black');
  stepCount++;
  updateStepDisplay();
  path.push({ x, y, stepIndex: stepCount, note: '' });

  // TODO: Generate new grey tiles
  // TODO: Remove previous greys
  // TODO: Detect when to show center
  // TODO: Attach note behavior
  scrollToTile(tile.el);
}

stepSlider.addEventListener('input', () => {
  stepValue.textContent = stepSlider.value;
  maxSteps = parseInt(stepSlider.value);
});

stepToggle.addEventListener('change', () => {
  showCounter = stepToggle.checked;
  updateStepDisplay();
});

// Start the app
initializeGrid();
