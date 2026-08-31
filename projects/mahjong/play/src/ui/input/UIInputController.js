// UIInputController.js — Phase 12：DOM 點擊 → action → GameEngineAdapter → GameEngine
// 不含任何牌局狀態；只負責把 DOM 事件翻譯成指令名稱（data-action / data-tile）。
export class UIInputController {
  constructor({ doc = document, root = null }) {
    this.doc = doc;
    this.root = root || doc;
    this._handlers = { onAction: null, onTile: null };
    this._bound = this._onClick.bind(this);
  }

  wire({ onAction, onTile } = {}) {
    this._handlers = { onAction, onTile };
    if (this.root && this.root.addEventListener) this.root.addEventListener('click', this._bound);
    return this;
  }

  dispose() {
    if (this.root && this.root.removeEventListener) this.root.removeEventListener('click', this._bound);
    return this;
  }

  _onClick(ev) {
    const node = ev && ev.target;
    if (!node) return;
    const actionEl = this._closest(node, '[data-action]');
    if (actionEl) {
      const action = actionEl.getAttribute('data-action');
      if (!actionEl.disabled && this._handlers.onAction) this._handlers.onAction(action, actionEl);
      return;
    }
    const tileEl = this._closest(node, '[data-tile]');
    if (tileEl) {
      const tile = tileEl.getAttribute('data-tile');
      if (this._handlers.onTile) this._handlers.onTile(tile);
    }
  }

  _closest(el, selector) {
    let cur = el;
    while (cur) {
      if (cur.matches && cur.matches(selector)) return cur;
      cur = cur.parentNode || null;
    }
    return null;
  }
}