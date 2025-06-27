// js/tiles.js

export function createTile(x, y, label = '', onClick = null) {
  const el = document.createElement('div');
  el.classList.add('tile', 'grey');
  el.style.left = `${x * 60}px`;
  el.style.top = `${y * 60}px`;

  const labelEl = document.createElement('div');
  labelEl.classList.add('tile-label');
  labelEl.textContent = label;
  el.appendChild(labelEl);

  if (onClick) {
    el.addEventListener('click', () => onClick(x, y));
  }

  return {
    x,
    y,
    el,
    labelEl,
    state: 'grey',
    setState(state, newLabel = '', forceLabel = false) {
      this.state = state;
      el.className = `tile ${state}`;

      if (state === 'black') {
        if (forceLabel) {
          this.labelEl.textContent = newLabel;
          this.labelEl.style.opacity = '1';
        } else {
          this.labelEl.textContent = '';
          this.labelEl.style.opacity = '0';
        }
      } else {
        this.labelEl.textContent = newLabel;
        this.labelEl.style.opacity = '1';
      }
    }
  };
}


export function clearGrid(container) {
  container.innerHTML = '';
}
