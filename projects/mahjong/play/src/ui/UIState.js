// UIState.js — Phase 12：純 UI 本地狀態（與牌局真實狀態完全分離）
// 只允許保存：目前選中的牌、提示、modal、UI mode、玩家輸入暫存。
// 禁止保存：牌局真實狀態 / 真實手牌 / AI 手牌 / 分數 / 牌牆資料（這些一律取自 GameEngine）。

export class UIState {
  constructor() {
    this.reset();
  }

  // 統一還原所有 UI 本地狀態
  reset() {
    this.selectedTile = null;   // 目前選中的手牌 key（捨牌確認用）
    this.hint = null;           // 文字提示
    this.modal = null;          // modal 內容（{ title, body } | null）
    this.uiMode = 'idle';       // idle | waiting_draw | waiting_discard | reaction | done
    this.message = null;        // 訊息列文字
    this.pendingInput = null;   // 玩家輸入暫存（command layer 用，phase 12 保留欄位）
    return this;
  }

  selectTile(tileKey) {
    this.selectedTile = tileKey;
    return this;
  }

  clearSelection() {
    this.selectedTile = null;
    return this;
  }

  showMessage(text) {
    this.message = text;
    return this;
  }

  clearMessage() {
    this.message = null;
    return this;
  }

  setHint(text) {
    this.hint = text;
    return this;
  }

  openModal(title, body) {
    this.modal = { title, body };
    this.uiMode = 'modal';
    return this;
  }

  closeModal() {
    this.modal = null;
    this.uiMode = 'idle';
    return this;
  }

  setMode(mode) {
    this.uiMode = mode;
    return this;
  }

  // 可序列化成測試可比對的純資料
  toJSON() {
    return {
      selectedTile: this.selectedTile,
      hint: this.hint,
      modal: this.modal ? { title: this.modal.title, body: this.modal.body } : null,
      uiMode: this.uiMode,
      message: this.message,
      pendingInput: this.pendingInput
    };
  }
}