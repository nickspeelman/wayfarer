// js/tiles.js

export function createTile(x, y, label = '', onClick = null) {
  const el = document.createElement('div');
  el.classList.add('tile', 'grey');
  el.style.left = `${x * 60}px`;
  el.style.top = `${y * 60}px`;

  if (label) {
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    el.appendChild(labelEl);
  }

  const tile = {
    x,
    y,
    state: 'grey',
    el,
    labelEl: label ? el.querySelector('span') : null,

    setState(newState, labelText = null) {
      el.classList.remove(this.state);
      el.classList.add(newState);
      this.state = newState;

      if (labelText !== null) {
        if (!this.labelEl) {
          this.labelEl = document.createElement('span');
          el.appendChild(this.labelEl);
        }
        this.labelEl.textContent = labelText;
      }
    }
  };

  if (onClick) {
    el.addEventListener('click', () => {
      onClick(x, y);
    });
  }

  return tile;
}

export function clearGrid(container) {
  container.innerHTML = '';
}
