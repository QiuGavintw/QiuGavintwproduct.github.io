// TableRenderer.js — Phase 12：中央桌面（河）── 四家捨牌流 + 輪到誰
import { shortName } from '../../mahjong/Tile.js';
import { ContainerHelper, textEl } from './dom.js';

export class TableRenderer {
  constructor({ doc = document } = {}) {
    this.doc = doc;
  }

  render(container, vm) {
    ContainerHelper.clear(this.doc, container);
    const header = textEl(this.doc, 'div', '', 'table-header');

    let statusText = '牌局尚未開始';
    if (vm.phase === 'match_end') statusText = '對局結束';
    else if (vm.hand && vm.hand.handResult) {
      const hr = vm.hand.handResult;
      if (hr.winType === 'flow') statusText = `流局（第 ${(vm.match.roundIndex % 4) + 1} 局）`;
      else {
        const names = hr.winners.map((s) => (vm.players[s] ? vm.players[s].name : `P${s}`)).join('、');
        statusText = `${names} 胡牌（${hr.winType}${hr.tile ? `：${shortName(hr.tile)}` : ''}）`;
      }
    } else if (vm.turn.currentSeat != null) {
      statusText = `輪到：${vm.players[vm.turn.currentSeat] ? vm.players[vm.turn.currentSeat].name : `P${vm.turn.currentSeat}`}`;
    }
    header.textContent = statusText;
    container.appendChild(header);

    const riverBox = this.doc.createElement('div');
    riverBox.className = 'river';
    for (const r of vm.river.tiles) {
      const cell = textEl(this.doc, 'span', shortName(r.tile), 'river-tile');
      cell.setAttribute('data-seat', String(r.seat));
      cell.title = `${vm.players[r.seat] ? vm.players[r.seat].name : `P${r.seat}`} 打出${shortName(r.tile)}`;
      riverBox.appendChild(cell);
    }
    if (!vm.river.tiles.length) {
      const empty = textEl(this.doc, 'span', '（河面尚空）', 'river-empty');
      riverBox.appendChild(empty);
    }
    container.appendChild(riverBox);
  }
}