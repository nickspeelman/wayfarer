// js/main.js
import { createTile, clearGrid } from './tiles.js';
import { scrollToTile, getAvailablePositions } from './grid.js';
import { getRandomWord } from './meditativeWords.js';

const gridContainer = document.getElementById('gridContainer');
const stepSlider = document.getElementById('stepSlider');
const stepValue = document.getElementById('stepValue');
const stepToggle = document.getElementById('stepToggle');
const stepCounter = document.getElementById('stepCounter');
const noteModal = document.getElementById('noteModal');
const noteText = document.getElementById('noteText');
const closeNote = document.getElementById('closeNote');
const reviewButton = document.getElementById('reviewButton');
const reviewModal = document.getElementById('reviewModal');
const reviewList = document.getElementById('reviewList');
const closeReview = document.getElementById('closeReview');

let stepCount = 0;
let maxSteps = parseInt(stepSlider.value);
let showCounter = stepToggle.checked;
let reviewButtonBound = false;


const path = [];
const gridMap = new Map();
const occupied = new Set();
let returnIndex = null;
let isReturning = false;
let minX = 0, maxX = 0, minY = 0, maxY = 0;

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
  const gridTileCount = maxSteps * 2;
  const gridPixelSize = tileSize * gridTileCount;
  gridContainer.style.width = `${gridPixelSize}px`;
  gridContainer.style.height = `${gridPixelSize}px`;

  const centerTile = Math.floor(gridTileCount / 2);
  const x = centerTile;
  const y = centerTile;

  minX = maxX = x;
  minY = maxY = y;

  const startTile = createTile(x, y, 'begin', () => handleInitialTileClick(x, y));
  startTile.setState('grey', 'begin', true);

  gridContainer.appendChild(startTile.el);
  gridMap.set(`${x},${y}`, startTile);
  occupied.add(`${x},${y}`);

  setTimeout(() => {
    scrollToTile(startTile.el);
  }, 0);
}

function handleInitialTileClick(x, y) {
  const key = `${x},${y}`;
  const tile = gridMap.get(key);
  if (!tile || tile.state !== 'grey') return;

  tile.setState('black');
  stepCount++;
  updateStepDisplay();
  path.push({ x, y, stepIndex: stepCount, note: '', word: 'begin' });
  scrollToTile(tile.el);

  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
  minY = Math.min(minY, y);
  maxY = Math.max(maxY, y);
  resizeGrid();

  const directions = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];
  directions.forEach(({ x: dx, y: dy }) => {
    const word = getRandomWord();
    const tile = createTile(dx, dy, word, handleTileClick);
    tile.word = word;
    gridContainer.appendChild(tile.el);
    gridMap.set(`${dx},${dy}`, tile);
    occupied.add(`${dx},${dy}`);

    minX = Math.min(minX, dx);
    maxX = Math.max(maxX, dx);
    minY = Math.min(minY, dy);
    maxY = Math.max(maxY, dy);
  });

  resizeGrid();
}

function resizeGrid() {
  const tileSize = 60;
  const span = maxSteps * 2;
  gridContainer.style.width = `${tileSize * span}px`;
  gridContainer.style.height = `${tileSize * span}px`;
}

function handleTileClick(x, y) {
  if (isReturning) return;
  const key = `${x},${y}`;
  const tile = gridMap.get(key);
  if (!tile || tile.state !== 'grey') return;

  tile.setState('black');
  stepCount++;
  updateStepDisplay();
  path.push({ x, y, stepIndex: stepCount, note: '', word: tile.word });
  scrollToTile(tile.el);

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
    addNextTiles(x, y, available);
  }
}

function addNextTiles(x, y, availablePositions = null) {
  const available = availablePositions || getAvailablePositions(x, y, occupied);
  const next = available.slice(0, 3);

  next.forEach(pos => {
    const word = getRandomWord();
    const tile = createTile(pos.x, pos.y, word, handleTileClick);
    tile.word = word;
    gridContainer.appendChild(tile.el);
    gridMap.set(`${pos.x},${pos.y}`, tile);
    occupied.add(`${pos.x},${pos.y}`);

    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
  });

  resizeGrid();
}

function removeOldGreyTiles(excludePositions = []) {
  gridMap.forEach(tile => {
    const isExcluded = excludePositions.some(pos => pos.x === tile.x && pos.y === tile.y);
    if (tile.state === 'grey' && !isExcluded) {
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
  const centerModal = document.getElementById('centerModal');
  const returnBtn = document.getElementById('returnBtn');

  // Remove all current grey tiles before opening the modal
  removeOldGreyTiles([{ x, y }]);

  centerModal.classList.remove('hidden');

  returnBtn.onclick = () => {
    centerModal.classList.add('hidden');
    const lastStep = path[path.length - 1];
    const tile = gridMap.get(`${lastStep.x},${lastStep.y}`);
    if (tile) tile.setState('grey');
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
    const label = entry?.stepIndex === 1 ? 'begin' : entry?.word || '';

    if (idx === returnIndex) {
      tile.setState('grey', label);
      const newTileEl = tile.el.cloneNode(true);
      newTileEl.addEventListener('click', () => handleReturnClick(), { once: true });
      tile.el.replaceWith(newTileEl);
      tile.el = newTileEl;
    } else if (idx === 0) {
      tile.setState('black', 'end');
    } else {
      tile.setState('black', '');
    }
  });
}

function revealFullPath() {
  path.forEach(({ x, y }) => {
    const key = `${x},${y}`;
    if (!gridMap.has(key)) {
      const tile = createTile(x, y, '', () => {});
      tile.setState('black');
      gridMap.set(key, tile);
      gridContainer.appendChild(tile.el);
    } else {
      gridMap.get(key).setState('black');
    }
  });
}

function handleReturnClick() {
  const { x, y, note } = path[returnIndex];
  const tile = gridMap.get(`${x},${y}`);
  stepCount--;
  updateStepDisplay();
  if (!tile) return;

  if (note) openNoteModal(x, y, note);

  tile.el.remove();
  gridMap.delete(`${x},${y}`);
  occupied.delete(`${x},${y}`);
  returnIndex--;

  if (returnIndex >= 0) {
    const next = path[returnIndex];
    const nextTile = gridMap.get(`${next.x},${next.y}`);
    if (nextTile) {
      const label = returnIndex === 0 ? 'end' : next.word || '';
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
    // Save the path to localStorage
    const timestamp = new Date().toISOString();
    const pastPaths = JSON.parse(localStorage.getItem('pastPaths') || '[]');

    pastPaths.push({
      timestamp,
      words: path
      .map(({ word }) => word || '(no word)')
      .filter(word => word !== 'begin')
    });

    if (pastPaths.length > 100) {
      pastPaths.shift(); // Optional: trim to max 100
    }

    localStorage.setItem('pastPaths', JSON.stringify(pastPaths));

    revealFullPath();
    const wrapper = document.getElementById('gridWrapper');
    const scale = Math.min(
      wrapper.clientWidth / gridContainer.scrollWidth,
      wrapper.clientHeight / gridContainer.scrollHeight
    );
    gridContainer.style.transition = 'transform 1.5s ease-in-out';
    gridContainer.style.transformOrigin = 'center center';
    gridContainer.style.transform = `scale(${scale})`;

    setTimeout(() => {
      document.getElementById('completionMessage').classList.add('visible');
      if (!reviewButtonBound) {
      const reviewButton = document.getElementById('reviewButton');
      const reviewModal = document.getElementById('reviewModal');
      const reviewList = document.getElementById('reviewList');
      const closeReview = document.getElementById('closeReview');

      if (reviewButton) {
        reviewButton.addEventListener('click', (e) => {
          console.log('Review button clicked');
          e.preventDefault();
          reviewList.innerHTML = '';

        path.forEach(({ word }) => {
          if (word !== 'begin') {
            const li = document.createElement('li');
            li.textContent = word || '(no word)';
            reviewList.appendChild(li);
          }
        });


          console.log("unhiding modal")
          reviewModal?.classList.remove('hidden');
        });
      }

      if (closeReview) {
        closeReview.addEventListener('click', () => {
          reviewModal?.classList.add('hidden');
        });
      }

      reviewButtonBound = true;
    }

    }, 1800);
  }
}

function openNoteModal(x, y, note = '') {
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

document.getElementById('startButton').addEventListener('click', () => initializeGrid());

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired');

  const welcomeModal = document.getElementById('welcomeModal');
  const hideCheckbox = document.getElementById('hideWelcomeCheckbox');
  const pastListsLink = document.getElementById('pastListsLink');
  const pastListsModal = document.getElementById('pastListsModal');
  const pastListsContent = document.getElementById('pastListsContent');
  const closePastLists = document.getElementById('closePastLists');

  // Show welcome modal if not suppressed
  const suppressed = localStorage.getItem('suppressWelcome') === 'true';
  hideCheckbox.checked = suppressed;
  if (!suppressed) {
    welcomeModal?.classList.remove('hidden');
  }

  hideCheckbox.addEventListener('change', () => {
    if (hideCheckbox.checked) {
      localStorage.setItem('suppressWelcome', 'true');
    } else {
      localStorage.removeItem('suppressWelcome');
      welcomeModal?.classList.remove('hidden');
    }
  });

  document.getElementById('closeWelcome')?.addEventListener('click', () => {
    welcomeModal.classList.add('hidden');
  });

  document.getElementById('aboutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    welcomeModal?.classList.remove('hidden');
  });

  const closePastListsX = document.getElementById('closePastListsX');

  closePastListsX?.addEventListener('click', () => {
    pastListsModal?.classList.add('hidden');
  });


  // ✅ WORKING pastListsLink handler
  pastListsLink?.addEventListener('click', (e) => {
    console.log('Modal shown:', pastListsModal);

    e.preventDefault();
    pastListsContent.innerHTML = '';

    const pastPaths = JSON.parse(localStorage.getItem('pastPaths') || '[]');
    if (pastPaths.length === 0) {
      pastListsContent.textContent = 'no past lists found';
    } else {
      pastPaths.forEach(({ timestamp, words }, index) => {
        const container = document.createElement('div');
        container.style.marginBottom = '1em';

        const title = document.createElement('strong');
        const date = new Date(timestamp);
          title.textContent = date.toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short'
          }).toLowerCase();

        container.appendChild(title);

        const ul = document.createElement('ul');
        words.forEach(word => {
          const li = document.createElement('li');
          li.textContent = word;
          ul.appendChild(li);
        });

        container.appendChild(ul);
        pastListsContent.appendChild(container);
      });
    }

    pastListsModal?.classList.remove('hidden');
  });

  closePastLists?.addEventListener('click', () => {
    pastListsModal?.classList.add('hidden');
  });

  // ✅ Restore missing start over button listener
  document.getElementById('restartButton')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.setItem('suppressWelcome', 'true');
    location.reload();
  });
});



// Service worker registration (outside DOMContentLoaded)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => console.log('✅ Service worker registered:', reg.scope))
      .catch((err) => console.error('❌ Service worker registration failed:', err));
  });
}

