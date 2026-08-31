// MessageRenderer.js — Phase 12：訊息列（含根據 vm 自動生成的操作提示）
import { shortName } from '../../mahjong/Tile.js';
import { ContainerHelper, textEl } from './dom.js';

export class MessageRenderer {
  constructor({ doc = document } = {}) {
    this.doc = doc;
  }

  render(container, vm, uiState) {
    ContainerHelper.clear(this.doc, container);
    const msg = uiState && uiState.message ? uiState.message : this._autoMessage(vm);
    const box = textEl(this.doc, 'div', msg || '', 'message-line');
    if (uiState && uiState.message) box.classList.add('user-message');
    container.appendChild(box);
  }

  _autoMessage(vm) {
    if (vm.prompt === 'draw') return '輪到你摸牌（按「摸牌」）';
    if (vm.prompt === 'discard') return '請點選手牌，再按「捨牌」';
    if (vm.prompt === 'reaction' && vm.expectation) {
      const options = vm.expectation.options.map((o) => o.type).join('／');
      return `可反應（${options}）：${shortName(vm.expectation.tile)}`;
    }
    if (vm.prompt === 'win_confirm' && vm.pending) {
      return `摸到 ${shortName(vm.pending.tile)} 可自摸。胡或過？`;
    }
    if (vm.prompt === 'gang_confirm' && vm.pending) {
      const gangLabels = (vm.pending.gangs || [])
        .map((g) => `${g.type === 'angang' ? '暗槓' : '加槓'} ${shortName(g.tile)}`)
        .join(' 或 ');
      return `可${gangLabels}。要槓嗎？`;
    }
    if (vm.prompt === 'hand_end') return '本局結束，請按「結算」';
    if (vm.prompt === 'next_hand') return '請按「下一局」';
    if (vm.prompt === 'match_end') return '對局結束，請按「重來」';
    if (vm.hand && vm.hand.handResult) return vm.hand.handResult.winType === 'flow' ? '本局流局' : '本局結束';
    return '';
  }
}