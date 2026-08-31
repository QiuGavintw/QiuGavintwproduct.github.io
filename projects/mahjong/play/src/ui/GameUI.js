// GameUI.js — Phase 12：把 Adapter / UIState / Renderer / Input 串起來的協調層
// 更新循環：Action → GameEngine → Adapter.update() → getViewModel() → Renderer.render()
// UI 完全不直接觸碰核心物件。
import { UIState } from './UIState.js';
import { HUDRenderer } from './renderer/HUDRenderer.js';
import { PlayerRenderer } from './renderer/PlayerRenderer.js';
import { HandRenderer } from './renderer/HandRenderer.js';
import { TableRenderer } from './renderer/TableRenderer.js';
import { MessageRenderer } from './renderer/MessageRenderer.js';
import { ActionRenderer } from './renderer/ActionRenderer.js';
import { SettlementRenderer } from './renderer/SettlementRenderer.js';
import { UIInputController } from './input/UIInputController.js';
import { deriveAudioEvents } from './audio/audioEvents.js';

export const UI_REGIONS = ['hud', 'players', 'table', 'hand', 'message', 'actions', 'settlement'];

export class GameUI {
  constructor({ container, adapter, doc = document, canvasTable = null, audio = null }) {
    this.doc = doc;
    this.container = container;
    this.adapter = adapter;
    this.uiState = new UIState();
    this.canvasTable = canvasTable; // Phase 14：選擇性掛上 Canvas 視覺層
    this.audio = audio; // Phase 16：選擇性掛上 Audio 系統（副作用，非邏輯）
    this._lastVm = null;
    this._audioPrevVm = null;
    this.renderers = {
      hud: new HUDRenderer({ doc }),
      players: new PlayerRenderer({ doc }),
      table: new TableRenderer({ doc }),
      hand: new HandRenderer({ doc }),
      message: new MessageRenderer({ doc }),
      actions: new ActionRenderer({ doc }),
      settlement: new SettlementRenderer({ doc })
    };
    this.input = new UIInputController({ doc, root: container });
  }

  el(selector) {
    return this.container && this.container.querySelector ? this.container.querySelector(selector) : null;
  }

  // 1) 推進引擎直到需要人類決定 / 本局完成；2) 產生 View Model；3) 重新渲染
  update() {
    const prev = this._audioPrevVm;
    const vm = this.adapter.update();
    this._syncMode(vm);
    this._lastVm = vm;
    this.render(vm);
    if (this.canvasTable && this.canvasTable.render) this.canvasTable.render(vm, this.uiState);
    // Phase 16：Audio 是同一狀態轉換的副作用（僅在前一→新 VM 真正轉換時觸發）
    if (this.audio) {
      const humanSeat = (vm.players.find((p) => p.isHuman) || { seat: 0 }).seat;
      const events = deriveAudioEvents(prev, vm, humanSeat);
      this.audio.onGameState(events, vm.phase);
    }
    this._audioPrevVm = vm;
    return vm;
  }

  // 不推進引擎、只重繪目前 ViewModel（resize 後使用）
  refresh() {
    if (!this._lastVm) return null;
    this.render(this._lastVm);
    if (this.canvasTable && this.canvasTable.render) this.canvasTable.render(this._lastVm, this.uiState);
    return this._lastVm;
  }

  // 動畫進行中 → UI 暫停接受操作（僅 UI interaction lock，非遊戲規則）
  _animating() {
    return !!(this.canvasTable && typeof this.canvasTable.isAnimating === 'function' && this.canvasTable.isAnimating());
  }

  // Canvas hit-test 命中的手牌 → 走既有 select 流程（與 DOM 手牌點擊同一路徑）
  selectTile(tileKey) {
    if (this._animating()) return false;
    const cmd = this._command ? this._command.select : null;
    if (!cmd) return false;
    cmd(tileKey);
    return true;
  }

  _syncMode(vm) {
    const s = this.uiState;
    if (vm.prompt === 'draw') s.setMode('waiting_draw');
    else if (vm.prompt === 'discard') s.setMode('waiting_discard');
    else if (vm.prompt === 'reaction') s.setMode('reaction');
    else if (vm.prompt === 'win_confirm') s.setMode('waiting_win_confirmation');
    else if (vm.prompt === 'gang_confirm') s.setMode('waiting_gang_confirmation');
    else if (vm.prompt === 'hand_end') s.setMode('hand_end');
    else if (vm.prompt === 'next_hand') s.setMode('next_hand');
    else if (vm.prompt === 'match_end') s.setMode('done');
    else if (vm.phase === 'idle') s.setMode('idle');
    else s.setMode('busy');
  }

  render(vm) {
    for (const key of UI_REGIONS) {
      const node =
        key === 'hud' ? this.el('#hud') : key === 'players' ? this.el('#players') : key === 'table' ? this.el('#table') : key === 'hand' ? this.el('#hand') : key === 'message' ? this.el('#message') : key === 'actions' ? this.el('#actions') : this.el('#settlement');
      if (node) this.renderers[key].render(node, vm, this.uiState);
    }
  }

  // 啟動：初始渲染 + 綁定輸入（內建指令 map）
  start() {
    this.bindCommands(this._defaultCommands());
    this.update();
    return this;
  }

  _defaultCommands() {
    const self = this;
    return {
      draw: () => self.adapter.draw(),
      discard: () => {
        const t = self.uiState.selectedTile;
        if (t == null) return null;
        const vm = self.adapter.discard(t);
        self.uiState.clearSelection();
        return vm;
      },
      ron: () => self.adapter.react('ron'),
      peng: () => self.adapter.react('peng'),
      minggang: () => self.adapter.react('minggang'),
      chi: () => self.adapter.react('chi'),
      pass: () => self.adapter.pass(),
      win: () => self.adapter.winConfirm(true),
      decline: () => self.adapter.winConfirm(false),
      gang: (choice) => {
        if (!choice || !choice.type) return null;
        return self.adapter.gangConfirm(choice.type, choice.tile || null);
      },
      gangPass: () => self.adapter.gangConfirm(null, null),
      settle: () => self.adapter.settle(),
      next: () => self.adapter.nextHand(),
      start: () => self.adapter.startHand(),
      reset: () => {
        self.uiState.reset();
        return self.adapter.reset();
      },
      select: (tileKey) => {
        if (self.uiState.selectedTile === tileKey) self.uiState.clearSelection();
        else self.uiState.selectTile(tileKey);
        return self.update();
      }
    };
  }

  // 指令分派：包 try/catch 做錯誤防護（非法操作不會令整個 UI 崩潰，只顯示訊息）
  handleAction(action, el) {
    if (this._animating()) return false; // 動畫期間不接受操作
    const cmd = this._command ? this._command[action] : null;
    if (!cmd) return false;
    try {
      if (action === 'gang' && el) {
        cmd({ type: el.getAttribute('data-gang-type'), tile: el.getAttribute('data-gang-tile') });
      } else {
        cmd();
      }
      if (action !== 'select') this.update();
      return true;
    } catch (err) {
      this.uiState.showMessage(`操作失敗：${err && err.message ? err.message : String(err)}`);
      this.update();
      return false;
    }
  }

  // 由 UIInputController 綁定 DOM 事件
  wire() {
    this.input.wire({
      onAction: (action, el) => this.handleAction(action, el),
      onTile: (tileKey) => this.selectTile(tileKey)
    });
    return this;
  }

  bindCommands(cmds) {
    this._command = cmds;
    return this;
  }
}