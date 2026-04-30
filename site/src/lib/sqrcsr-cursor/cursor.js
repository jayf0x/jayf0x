// Square Cursor v2 - modern, scoped, dependency-free
class SquareCursorCore {
  constructor(rootEl, options = {}) {
    if (!rootEl) throw new Error("SquareCursor: root element is required");
    this.root = rootEl;
    // Always create a fresh `.sqrcsr-inner` inside the root so the element is self-contained
    const existingInner = this.root.querySelector(".sqrcsr-inner");
    if (existingInner) existingInner.remove();
    this.inner = document.createElement("div");
    this.inner.className = "sqrcsr-inner";
    this.root.appendChild(this.inner);

    this.settings = Object.assign(
      {
        columns: 16,
        ttl: 200, // milliseconds
        colors: [],
      },
      options || {},
    );

    this.root.style.setProperty("--sqrcsr-columns", this.settings.columns);

    this.rect = this.root.getBoundingClientRect();
    this.columns = Number(this.settings.columns) || 16;
    this.cellSize = 0;
    this.rows = 0;
    this.cellsTotal = 0;
    this.cells = [];
    this.cachedCell = null;

    this._timeouts = new WeakMap();

    setTimeout(() => {
      this.layout();

      this._onMove = this._onMove.bind(this);
      this._onResize = this._onResize.bind(this);

      window.addEventListener("pointermove", this._onMove, { passive: true });
      window.addEventListener("resize", this._onResize);
    // wait on possible ref
    }, 500);
  }
  layout() {
    this.rect = this.root.getBoundingClientRect();
    this.columns = Number(this.settings.columns) || 16;
    this.root.style.setProperty("--sqrcsr-columns", this.columns);

    this.cellSize = this.rect.width / this.columns;
    this.rows = Math.max(1, Math.ceil(this.rect.height / (this.cellSize || 1)));
    this.cellsTotal = this.rows * this.columns;

    const colors = Array.isArray(this.settings.colors)
      ? this.settings.colors
      : [];
    let html = "";
    for (let i = 0; i < this.cellsTotal; ++i) {
      if (colors.length === 0) {
        html += '<div class="sqrcsr-inner-box"></div>';
      } else {
        const color = colors[i % colors.length];
        html += `<div class="sqrcsr-inner-box" style="background:${color}"></div>`;
      }
    }

    this.inner.innerHTML = html;
    this.cells = Array.from(this.inner.children);
  }

  _onResize() {
    this.layout();
  }

  _onMove(e) {
    // compute position relative to root element
    const x = e.clientX - this.rect.left;
    const y = e.clientY - this.rect.top;
    if (x < 0 || y < 0 || x > this.rect.width || y > this.rect.height) return;

    const col = Math.floor(x / (this.cellSize || 1));
    const row = Math.floor(y / (this.cellSize || 1));
    const idx = row * this.columns + col;
    if (idx < 0 || idx >= this.cellsTotal) return;

    const cell = this.cells[idx];
    if (!cell) return;
    if (cell === this.cachedCell) return;
    this.cachedCell = cell;

    this._showCell(cell);
  }

  _showCell(cell) {
    cell.classList.add("visible");
    if (this._timeouts.has(cell)) {
      clearTimeout(this._timeouts.get(cell));
    }
    const id = setTimeout(
      () => {
        cell.classList.remove("visible");
        this._timeouts.delete(cell);
      },
      Number(this.settings.ttl) || 200,
    );
    this._timeouts.set(cell, id);
  }

  destroy() {
    window.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("resize", this._onResize);
    this.inner.innerHTML = "";
  }
}

export { SquareCursorCore };
