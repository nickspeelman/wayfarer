// js/grid.js

// Return neighboring positions in clockwise order: top, right, bottom, left
export function getAdjacentPositions(x, y) {
  return [
    { x: x,     y: y - 1 }, // up
    { x: x + 1, y: y     }, // right
    { x: x,     y: y + 1 }, // down
    { x: x - 1, y: y     }  // left
  ];
}

// Determine which adjacent positions are unoccupied
export function getAvailablePositions(x, y, occupiedSet) {
  return getAdjacentPositions(x, y).filter(pos => {
    return !occupiedSet.has(`${pos.x},${pos.y}`);
  });
}

// Scroll a tile into the center of the screen
export function scrollToTile(tileEl) {
  const wrapper = document.getElementById('gridWrapper');

  const scrollLeft = tileEl.offsetLeft - wrapper.clientWidth / 2 + tileEl.offsetWidth / 2;
  const scrollTop = tileEl.offsetTop - wrapper.clientHeight / 2 + tileEl.offsetHeight / 2;

  wrapper.scrollTo({
    top: scrollTop,
    left: scrollLeft,
    behavior: 'smooth'
  });
}




