// ScoringEngine.js — 台數引擎（與 WinChecker 合法性、SpecialWinEngine 特殊事件分離）
// pipeline：buildDerived（情境）→ detectPatterns(rules.detect) → applyExclusions → sumTai → calculatePayment
// 輸入 ctx 的 events 欄位由未來的 SpecialWinEngine 提供；測試可直接注入。

import { RULES, ruleById, isConcealedTriplet, isKnutMeld } from './rules.js';
import { applyExclusions } from './exclusions.js';
import { calculatePayment } from './payment.js';
import { BASE_SCORE } from './RuleDefinition.js';
import { findWinArrangement, winningTiles } from '../WinChecker.js';
import { kindIndex } from '../Tile.js';

function mergeCounts(counts34, melds) {
  const c = counts34.slice();
  for (const m of melds) {
    for (const t of m.tiles) {
      const i = kindIndex(t);
      if (i >= 0) c[i] += 1;
    }
  }
  return c;
}

// 由 WinContext 建立「含衍生欄位」的唯讀情境
export function buildDerived(ctx) {
  const melds = ctx.melds || [];
  const counts34 = ctx.counts34 || new Array(34).fill(0);
  const meldCount = melds.length;
  const arrangement = ctx.arrangement ?? findWinArrangement(counts34, meldCount);
  const fullCounts = mergeCounts(counts34, melds);

  let waits = [];
  if (ctx.winTileIndex != null) {
    const pre = counts34.slice();
    pre[ctx.winTileIndex] -= 1;
    waits = winningTiles(pre, meldCount);
  }

  const keziFromArrangement = arrangement ? arrangement.melds.filter((m) => m.type === 'kezi').length : 0;
  const concealedTriplets = keziFromArrangement + melds.filter(isConcealedTriplet).length;
  const pengpeng = !!(arrangement && arrangement.melds.length > 0
    && arrangement.melds.every((m) => m.type === 'kezi')
    && melds.every(isKnutMeld));

  const suitSet = new Set();
  let honorCount = 0;
  for (let i = 0; i < 34; i++) {
    if (fullCounts[i] > 0) {
      if (i < 27) suitSet.add(Math.floor(i / 9));
      else honorCount += 1;
    }
  }

  return {
    ...ctx,
    melds,
    meldCount,
    fullCounts,
    arrangement,
    waits,
    waitsCount: waits.length,
    singleWait: waits.length === 1,
    concealedTriplets,
    pengpeng,
    suitSet,
    honorCount
  };
}

export function scoreWin(ctx) {
  const d = buildDerived(ctx);
  const eligible = RULES.filter((r) => r.detect(d)).map((r) => r.id);
  const appliedIds = applyExclusions(eligible);
  const rules = appliedIds.map((id) => {
    const r = ruleById(id);
    return { id, name: r.name, value: r.value(d) };
  });
  const tai = rules.reduce((t, r) => t + r.value, 0);
  // 八仙／七搶一：無手牌之特殊胡，視同自摸三家各付
  const winBy = (d.events.baxian || d.events.qiqiangyi) ? 'tsumo' : d.winBy;
  const payment = calculatePayment({
    tai,
    winBy,
    winnerSeat: d.seat,
    dealerSeat: d.dealerSeat,
    discarderSeat: d.discarderSeat,
    base: BASE_SCORE.base,
    perTai: BASE_SCORE.perTai
  });
  return { rules, tai, base: BASE_SCORE.base, perTai: BASE_SCORE.perTai, payment };
}