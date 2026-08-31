// ActionRenderer.js — Phase 12/13：動作面板（只顯示目前合法 action，並附 action 名稱供輸入控制器綁定）
// 行動指令：draw / discard / ron / peng / minggang / chi / pass / win / decline / gang /
//           gangPass / settle / next / start / reset
import { shortName } from '../../mahjong/Tile.js';
import { ContainerHelper, textEl } from './dom.js';

const ACTION_LABELS = {
  draw: '摸牌',
  discard: '捨牌',
  ron: '胡',
  peng: '碰',
  minggang: '明槓',
  chi: '吃',
  pass: '過',
  win: '胡',
  decline: '過',
  settle: '結算',
  next: '下一局',
  start: '開始',
  reset: '重來'
};

export class ActionRenderer {
  constructor({ doc = document } = {}) {
    this.doc = doc;
  }

  render(container, vm, uiState) {
    ContainerHelper.clear(this.doc, container);
    const actions = this._collect(vm, uiState);
    if (!actions.length) return;
    for (const a of actions) {
      const btn = this.doc.createElement('button');
      btn.type = 'button';
      btn.className = 'action-btn';
      btn.textContent = a.label;
      btn.setAttribute('data-action', a.action);
      if (a.gangType) btn.setAttribute('data-gang-type', a.gangType);
      if (a.gangTile) btn.setAttribute('data-gang-tile', a.gangTile);
      if (a.disabled) btn.disabled = true;
      container.appendChild(btn);
    }
  }

  _collect(vm, uiState) {
    const list = [];
    if (vm.phase === 'idle') {
      list.push({ action: 'start', label: ACTION_LABELS.start, disabled: false });
      return list;
    }
    if (vm.prompt === 'win_confirm') {
      list.push({ action: 'win', label: ACTION_LABELS.win, disabled: false });
      list.push({ action: 'decline', label: ACTION_LABELS.decline, disabled: false });
      return list;
    }
    if (vm.prompt === 'gang_confirm' && vm.pending) {
      for (const g of vm.pending.gangs || []) {
        list.push({
          action: 'gang',
          label: `${g.type === 'angang' ? '暗槓' : '加槓'} ${shortName(g.tile)}`,
          gangType: g.type,
          gangTile: g.tile,
          disabled: false
        });
      }
      list.push({ action: 'gangPass', label: ACTION_LABELS.pass, disabled: false });
      return list;
    }
    if (vm.prompt === 'hand_end') {
      list.push({ action: 'settle', label: ACTION_LABELS.settle, disabled: false });
      return list;
    }
    if (vm.prompt === 'next_hand') {
      list.push({ action: 'next', label: ACTION_LABELS.next, disabled: false });
      return list;
    }
    if (vm.phase === 'match_end') {
      list.push({ action: 'reset', label: ACTION_LABELS.reset, disabled: false });
      return list;
    }
    if (vm.prompt === 'draw') {
      list.push({ action: 'draw', label: ACTION_LABELS.draw, disabled: false });
      return list;
    }
    if (vm.prompt === 'discard') {
      const selected = uiState && uiState.selectedTile;
      list.push({ action: 'discard', label: ACTION_LABELS.discard, disabled: !selected });
      return list;
    }
    if (vm.prompt === 'reaction' && vm.expectation) {
      for (const o of vm.expectation.options) {
        if (o.type === 'ron' || o.type === 'peng' || o.type === 'minggang' || o.type === 'chi') {
          list.push({ action: o.type, label: ACTION_LABELS[o.type], disabled: false });
        }
      }
      list.push({ action: 'pass', label: ACTION_LABELS.pass, disabled: false });
      return list;
    }
    return list;
  }
}