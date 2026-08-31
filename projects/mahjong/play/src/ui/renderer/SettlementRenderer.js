// SettlementRenderer.js — Phase 13：結算面板（next_hand/match_end 顯示該局結算；match_end 另列最終排名）
// 純 textContent 渲染；資料全部來自 adapter View Model（vm.settlement / vm.finalRanking / vm.players）。
import { shortName } from '../../mahjong/Tile.js';
import { ContainerHelper, textEl } from './dom.js';

export class SettlementRenderer {
  constructor({ doc = document } = {}) {
    this.doc = doc;
  }

  render(container, vm) {
    ContainerHelper.clear(this.doc, container);
    if (vm.phase !== 'next_hand' && vm.phase !== 'match_end') return;
    const s = vm.settlement;
    if (!s) return;

    container.appendChild(textEl(this.doc, 'div', `第 ${s.handIndex + 1} 局結算`, 'settle-title'));
    container.appendChild(textEl(this.doc, 'div', this._resultLine(vm, s), 'settle-result'));

    for (const w of s.wins || []) {
      container.appendChild(textEl(this.doc, 'div', this._winLine(vm, w), 'settle-win'));
    }

    for (const p of vm.players) {
      const delta = s.scoreDeltas && s.scoreDeltas[p.seat] != null ? s.scoreDeltas[p.seat] : 0;
      const sign = delta > 0 ? '+' : delta < 0 ? '' : '±';
      container.appendChild(textEl(this.doc, 'div', `${p.name}：${sign}${delta}（目前 ${p.score}）`, 'settle-score'));
    }

    if (vm.phase === 'match_end' && vm.finalRanking) {
      container.appendChild(textEl(this.doc, 'div', '最終排名', 'settle-final-title'));
      for (const r of vm.finalRanking) {
        const name = vm.players[r.seat] ? vm.players[r.seat].name : `P${r.seat}`;
        container.appendChild(textEl(this.doc, 'div', `第 ${r.rank} 名：${name}（${r.score}）`, 'settle-rank'));
      }
    }
  }

  _resultLine(vm, s) {
    const r = s.result;
    if (!r) return '結果：未知';
    if (r.winType === 'flow') return '結果：流局（莊家連莊）';
    const names = r.winners.map((w) => (vm.players[w] ? vm.players[w].name : `P${w}`)).join('、');
    const kind = r.winType === 'tsumo' ? '自摸' : '榮胡';
    return `結果：${names} ${kind}${r.tile ? `（抓 ${shortName(r.tile)}）` : ''}`;
  }

  _winLine(vm, w) {
    const name = vm.players[w.seat] ? vm.players[w.seat].name : `P${w.seat}`;
    const who = w.winBy === 'tsumo' ? '自摸' : '榮胡';
    const ruleNames = (w.rules || []).length ? (w.rules || []).map((r) => r.name).join('、') : '無番',
      payers = (w.payment.payers || []).map((p) => `${vm.players[p.seat] ? vm.players[p.seat].name : `P${p.seat}`} −${p.amount}`).join('，');
    return `${name} ${who}（${ruleNames}）｜台 ${w.tai}｜底 ${w.base}＋${w.perTai}/台｜收 ${w.payment.total}（${payers}）`;
  }
}