// AIDecisionEngine.js — 純邏輯決策引擎（Phase 9）
// 完全建立在既有引擎之上：向聽/進張用 EffectiveTileCalculator + TileEfficiencyEvaluator，
// 副露/槓用 ShantenCalculator + EffectiveTileCalculator 模擬。不重寫任何規則。
// 決定性：無 RNG 或同 seed 時，相同輸入必然產生相同決策。
import { kindIndex, keyFromIndex } from '../Tile.js';
import { calculateShanten } from '../ShantenCalculator.js';
import { effectiveTileInfo } from '../EffectiveTileCalculator.js';
import { scoreDiscards } from '../TileEfficiencyEvaluator.js';
import { AIStrategy, strategyFor } from './AIStrategy.js';

// 中張（rank 3~7）在河裡最容易被利用，風險略高
const MIDDLE_RANK_MIN = 2; // index 0-based：rank 3 → 2
const MIDDLE_RANK_MAX = 6; // rank 7 → 6

export class AIDecisionEngine {
  constructor({ strategy = null, strategyName = 'balanced', rng = null } = {}) {
    this.strategy = strategy instanceof AIStrategy ? strategy : strategyFor(strategyName);
    this.rng = rng;
  }

  _handOf(ctx) {
    const hand = ctx && (ctx.hand || (ctx.hands && ctx.hands[ctx.seat]));
    return hand || null;
  }

  // 風險值：剩餘張數愈多愈危險；中張額外 +0.5
  evaluateDanger(key, context) {
    const idx = kindIndex(key);
    const river = (context && context.river) || [];
    let visible = 0;
    for (const e of river) {
      const t = typeof e === 'string' ? e : e.tile;
      if (t === key) visible += 1;
    }
    const own = context && context.hand ? context.hand.counts()[idx] : 1;
    let penalty = 4 - visible - own;
    if (penalty < 0) penalty = 0;
    const rankInSuit = idx % 9;
    if (idx < 27 && rankInSuit >= MIDDLE_RANK_MIN && rankInSuit <= MIDDLE_RANK_MAX) penalty += 0.5;
    return penalty;
  }

  // 捨牌決策：scoreDiscards 基底 ＋ 策略風險權重（bonus hook），決定性排序
  chooseDiscard(context) {
    const hand = this._handOf(context);
    if (!hand) throw new Error('AI chooseDiscard 需要 hand（context.hand 或 hands[seat]）');
    const counts = hand.counts();
    const M = hand.meldCount;
    const w = this.strategy.weights;
    const res = scoreDiscards(counts, M, {
      bonus: (c) => -w.danger * this.evaluateDanger(keyFromIndex(c.index), { river: context.river, hand })
    });
    if (!res.candidates.length) return null;
    if (this.rng) {
      const ids = new Map();
      for (const c of res.candidates) ids.set(c.index, this.rng.int(0, 1e7));
      res.candidates.sort((a, b) => a.score - b.score || ids.get(a.index) - ids.get(b.index) || a.index - b.index);
    }
    return keyFromIndex(res.candidates[0].index);
  }

  // 胡牌政策：可胡即胡（不策略性放棄；過水由 TurnManager 處理）
  chooseWin(context) {
    void context;
    return true;
  }

  // 反應決策：ron > 副露；副露以「向聽改善 − 流出」與策略門檻比較
  chooseReaction(context, options = []) {
    for (const o of options) {
      if (o.type === 'ron') return o;
    }
    const hand = this._handOf(context);
    if (!hand) return { type: 'pass' };
    const counts = hand.counts();
    const M = hand.meldCount;
    const base = calculateShanten(counts, M);
    const w = this.strategy.weights;
    let bestResp = null;
    let bestScore = -Infinity;
    for (const o of options) {
      const evalResult = this._evaluateMelds(o, counts, M, base);
      if (evalResult === null) continue;
      const { gain } = evalResult;
      const score = gain - w.exposure;
      if (score >= w.meldThreshold && score > bestScore) {
        bestResp = o;
        bestScore = score;
      }
    }
    if (!bestResp) return { type: 'pass' };
    const ret = { type: bestResp.type, tile: bestResp.tile };
    if (bestResp.type === 'chi') ret.needKeys = bestResp.needKeys;
    return ret;
  }

  // 槓決策：暗槓移除 4 張 →12 暗＋M+1；加槓移除 1 張 →15 暗＋M
  chooseGang(context, options = []) {
    const hand = this._handOf(context);
    if (!hand) return null;
    const counts = hand.counts();
    const M = hand.meldCount;
    const base = calculateShanten(counts, M);
    const w = this.strategy.weights;
    let best = null;
    let bestScore = -Infinity;
    for (const o of options) {
      const idx = kindIndex(o.tile);
      let post;
      if (o.type === 'angang') {
        if (counts[idx] < 4) continue;
        const c = counts.slice();
        c[idx] -= 4;
        post = calculateShanten(c, M + 1);
      } else if (o.type === 'jiagang') {
        if (counts[idx] < 1) continue;
        const c = counts.slice();
        c[idx] -= 1;
        post = calculateShanten(c, M);
      } else {
        continue;
      }
      const score = (base - post) - w.exposure;
      if (score >= w.meldThreshold && score > bestScore) {
        best = o;
        bestScore = score;
      }
    }
    return best;
  }

  // 評估一組 meld 選項（回傳 {gain} 或 null＝該選項不可行）
  _evaluateMelds(o, counts, M, base) {
    const idx = kindIndex(o.tile);
    let c;
    if (o.type === 'peng') {
      if (counts[idx] < 2) return null;
      c = counts.slice();
      c[idx] -= 2;
      return { gain: base - this._bestAfterDiscard(c, M + 1) };
    }
    if (o.type === 'minggang') {
      if (counts[idx] < 3) return null;
      c = counts.slice();
      c[idx] -= 3;
      return { gain: base - calculateShanten(c, M + 1) };
    }
    if (o.type === 'chi') {
      if (!o.needKeys || o.needKeys.some((k) => counts[kindIndex(k)] < 1)) return null;
      c = counts.slice();
      for (const k of o.needKeys) c[kindIndex(k)] -= 1;
      return { gain: base - this._bestAfterDiscard(c, M + 1) };
    }
    return null;
  }

  // 副露後（14 張）選一張捨，回傳名副露後最小向聽（隨下一次摸牌）
  _bestAfterDiscard(c, MM) {
    const poolIndex = [];
    for (let i = 0; i < 34; i += 1) {
      for (let n = 0; n < c[i]; n += 1) poolIndex.push(i);
    }
    let best = Infinity;
    for (const d of poolIndex) {
      const cd = c.slice();
      cd[d] -= 1;
      const next = effectiveTileInfo(cd, MM).bestShanten;
      if (next < best) best = next;
    }
    return best;
  }
}