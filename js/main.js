// js/main.js
import { createTile, clearGrid } from './tiles.js';
import { scrollToTile, getAvailablePositions } from './grid.js';
import { meditativeWords, getRandomWord } from './meditativeWords.js';


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
let minX = 0, maxX = 0, minY = 0, maxY = 0;
let suppressWelcome = false;




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
  isReturning = false;
  updateStepDisplay();

  const tileSize = 60;
  const gridTileCount = maxSteps * 2;              // e.g., 100 steps → 200x200 tiles
  const gridPixelSize = tileSize * gridTileCount;  // → 12000px

  // Set fixed pixel size for grid container FIRST
  gridContainer.style.width = `${gridPixelSize}px`;
  gridContainer.style.height = `${gridPixelSize}px`;

  const centerTile = Math.floor(gridTileCount / 2); // → 100
  const x = centerTile;
  const y = centerTile;

  minX = maxX = x;
  minY = maxY = y;

  const startTile = createTile(x, y, 'begin', handleTileClick);
  startTile.setState('grey', 'begin', true);  // ✅ explicitly force label to show

  gridContainer.appendChild(startTile.el);
  gridMap.set(`${x},${y}`, startTile);
  occupied.add(`${x},${y}`);

  setTimeout(() => {
    scrollToTile(startTile.el);
    console.log('Start tile offset:', startTile.el.offsetLeft, startTile.el.offsetTop);
  }, 0);
}



function resizeGrid() {
  const tileSize = 60;
  const span = maxSteps * 2;

  gridContainer.style.width = `${tileSize * span}px`;
  gridContainer.style.height = `${tileSize * span}px`;
}





function handleTileClick(x, y) {
  if (isReturning) return; // ⛔ Block clicks during return phase

  const key = `${x},${y}`;
  const tile = gridMap.get(key);
  if (!tile || tile.state !== 'grey') return;

  tile.setState('black');
  stepCount++;
  updateStepDisplay();
  path.push({ x, y, stepIndex: stepCount, note: '', word: tile.word });
  scrollToTile(tile.el);

  // Track bounds for resizing
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
  minY = Math.min(minY, y);
  maxY = Math.max(maxY, y);
  resizeGrid();

  const available = getAvailablePositions(x, y, occupied);

  if (stepCount === maxSteps || available.length === 0) {
    showCenter(x, y);
  } else {
    removeOldGreyTiles(available);
    addNextTiles(x, y, available); // pass available to avoid recomputing
  }
}



function addNextTiles(x, y, availablePositions = null) {
  const available = availablePositions || getAvailablePositions(x, y, occupied);
  const next = available.slice(0, 3);

  next.forEach(pos => {
  const word = getRandomWord();
  const label = word;

    const tile = createTile(pos.x, pos.y, label, handleTileClick);
    tile.word = word;

    gridContainer.appendChild(tile.el);
    gridMap.set(`${pos.x},${pos.y}`, tile);
    occupied.add(`${pos.x},${pos.y}`);

    // Expand bounds
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
  });

  resizeGrid();
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
    if (!tile) return;

    const entry = path.find(p => p.x === x && p.y === y);
    const label = entry?.stepIndex === 1
      ? 'begin'
      : entry?.word || '';

    if (idx === returnIndex) {
      // First tile in the return path: make grey and clickable
      tile.setState('grey', label);

      const newTileEl = tile.el.cloneNode(true);
      newTileEl.addEventListener('click', () => handleReturnClick(), { once: true });

      tile.el.replaceWith(newTileEl);
      tile.el = newTileEl;
    } else if (idx === 0) {
      // Last tile of return path (i.e., beginning of forward): show as "end"
      tile.setState('black', 'end', true);
    } else {
      tile.setState('black', '');
    }
  });
}


function revealFullPath() {
  path.forEach(({ x, y }) => {
    const key = `${x},${y}`;
    if (!gridMap.has(key)) {
      const tile = createTile(x, y, '', () => {}); // dummy click handler
      tile.setState('black');
      gridMap.set(key, tile);
      gridContainer.appendChild(tile.el);
    } else {
      const tile = gridMap.get(key);
      tile.setState('black');
    }
  });
}


function handleReturnClick() {
  const { x, y, note, stepIndex, word } = path[returnIndex];
  const key = `${x},${y}`;
  const tile = gridMap.get(key);
  stepCount--;
  updateStepDisplay();
  if (!tile) return;

  // Optional: show note modal before removal
  if (note) openNoteModal(x, y, note);

  // Remove the tile from DOM and tracking structures
  tile.el.remove();
  gridMap.delete(key);
  occupied.delete(key);

  // 👇 Do this AFTER we access current values
  returnIndex--;

  // If we’re not done yet, make the next tile grey
  if (returnIndex >= 0) {
    const next = path[returnIndex];
    const nextTile = gridMap.get(`${next.x},${next.y}`);
    if (nextTile) {
      let label;
      if (returnIndex === 0) {
        // This was the last tile before the center — label it as 'end'
        label = 'end';     
      } else {
        label = next.word || '';
      }

      // Replace element to reset click listener
      const newTileEl = nextTile.el.cloneNode(true);
      newTileEl.classList.remove('black');
      newTileEl.classList.add('grey');
      newTileEl.innerHTML = `<span>${label}</span>`;
      newTileEl.addEventListener('click', () => handleReturnClick(), { once: true });

      nextTile.el.replaceWith(newTileEl);
      nextTile.el = newTileEl;

      scrollToTile(nextTile.el);
    }
  } else {
    // 🎉 Finished return journey
    revealFullPath();

    const start = path[0];
    const startKey = `${start.x},${start.y}`;
    const oldTile = gridMap.get(startKey);
    if (oldTile) {
      oldTile.el.remove();
      gridMap.delete(startKey);
      occupied.delete(startKey);
    }

    const wrapper = document.getElementById('gridWrapper');
    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    const fullWidth = gridContainer.scrollWidth;
    const fullHeight = gridContainer.scrollHeight;
    const scale = Math.min(wrapperWidth / fullWidth, wrapperHeight / fullHeight);

    gridContainer.style.transition = 'transform 1.5s ease-in-out';
    gridContainer.style.transformOrigin = 'center center';
    gridContainer.style.transform = `scale(${scale})`;

    setTimeout(() => {
      document.getElementById('completionMessage').classList.add('visible');
    }, 1800);

    document.getElementById('restartButton').addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.setItem('suppressWelcome', 'true');
      location.reload();
    });


  }
}








function showEndTile() {
  const start = path[0];
  const key = `${start.x},${start.y}`;

  const oldTile = gridMap.get(key);
  if (oldTile) {
    oldTile.el.remove();
    gridMap.delete(key);
    occupied.delete(key);
  }

  const tile = createTile(start.x, start.y, 'end');
  tile.setState('black', 'end');
  gridMap.set(key, tile);
  occupied.add(key);
  gridContainer.appendChild(tile.el);
  scrollToTile(tile.el);

  tile.el.addEventListener('click', () => {
    const wrapper = document.getElementById('gridWrapper');
    const gridContainer = document.getElementById('gridContainer');

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    const tileSize = 60;

    const spanX = maxX - minX + 1;
    const spanY = maxY - minY + 1;
    const requiredWidth = spanX * tileSize;
    const requiredHeight = spanY * tileSize;

    const scale = Math.min(wrapperWidth / requiredWidth, wrapperHeight / requiredHeight);

    gridContainer.style.transition = 'transform 1s ease';
    gridContainer.style.transformOrigin = 'top left';
    gridContainer.style.transform = `scale(${scale}) translate(${-minX * tileSize}px, ${-minY * tileSize}px)`;

    setTimeout(() => {
      alert('you have returned.');
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

document.getElementById('startButton').addEventListener('click', () => {
  initializeGrid();
});

document.addEventListener('DOMContentLoaded', () => {
  const suppress = sessionStorage.getItem('suppressWelcome');
  if (suppress !== 'true') {
    document.getElementById('welcomeModal').classList.remove('hidden');
  }

  // Always clear it on first load, so it doesn't persist between restarts
  sessionStorage.removeItem('suppressWelcome');
});


document.getElementById('closeWelcome').addEventListener('click', () => {
  document.getElementById('welcomeModal').classList.add('hidden');
});