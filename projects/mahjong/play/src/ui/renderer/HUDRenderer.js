// HUDRenderer.js — Phase 12：頂部資訊（圈風/莊家/連莊/牌牆/分數），資料全部來自 vm.match/vm.players
// 純顯示：只使用 createElement/textContent/appendChild（安全渲染）。
import { ContainerHelper, textEl } from './dom.js';

export class HUDRenderer {
  constructor({ doc = document } = {}) {
    this.doc = doc;
  }

  render(container, vm) {
    ContainerHelper.clear(this.doc, container);
    const m = vm.match;
    const line = (label, value) => {
      const row = textEl(this.doc, 'span', '', 'hud-item');
      const l = textEl(this.doc, 'span', label, 'hud-label');
      const v = textEl(this.doc, 'span', String(value), 'hud-value');
      row.appendChild(l);
      row.appendChild(v);
      return row;
    };
    const round = `${m.roundWindLabel}${(m.roundIndex % 4) + 1}局`;
    container.appendChild(line('局', round));
    container.appendChild(line('莊家', m.dealerName));
    container.appendChild(line('連莊', m.renchan));
    container.appendChild(line('牌牆', vm.hand && vm.hand.wallRemaining != null ? String(vm.hand.wallRemaining) : '—'));
    const human = vm.players.find((p) => p.isHuman);
    if (human) container.appendChild(line('你的分數', String(human.score)));
  }
}