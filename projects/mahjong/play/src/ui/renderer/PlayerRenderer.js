// PlayerRenderer.js — Phase 12：四位玩家資訊列（座位/名稱/分數/是否輪到/手牌張數或背面）
// AI 不顯示牌面：只顯示張數；人類的手牌交由 HandRenderer 顯示。純 textContent 渲染。
import { ContainerHelper, textEl } from './dom.js';

const SEAT_LABELS = ['下', '右', '上', '左'];

export class PlayerRenderer {
  constructor({ doc = document } = {}) {
    this.doc = doc;
  }

  render(container, vm) {
    ContainerHelper.clear(this.doc, container);
    for (const p of vm.players) {
      container.appendChild(this._card(vm, p));
    }
  }

  _card(vm, p) {
    const card = this.doc.createElement('div');
    card.className = 'player player-seat-' + p.seat;
    card.setAttribute('data-seat', String(p.seat));
    if (vm.turn.currentSeat === p.seat) card.classList.add('current');

    const name = this.doc.createElement('div');
    name.className = 'player-name';
    name.textContent = `${SEAT_LABELS[p.seat]}位 ${p.name}${p.isHuman ? '（你）' : ''}`;
    card.appendChild(name);

    const meta = this.doc.createElement('div');
    meta.className = 'player-meta';
    const parts = [];
    parts.push(`分數 ${p.score}`);
    if (p.concealedTiles) parts.push(`手牌 ${p.concealedTiles.length} 張`);
    else parts.push(`背牌 ${p.concealedCount} 張`);
    if (p.flowers.length) parts.push(`花 ${p.flowers.length}`);
    parts.push(`副露 ${p.melds.length}`);
    meta.textContent = parts.join('｜');
    card.appendChild(meta);

    for (const m of p.melds) {
      const meld = this.doc.createElement('div');
      meld.className = 'meld-tag';
      meld.textContent = `${m.type}（${m.tiles.length} 張）`;
      card.appendChild(meld);
    }
    return card;
  }
}