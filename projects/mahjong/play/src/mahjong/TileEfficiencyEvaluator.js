// TileEfficiencyEvaluator.js — 牌効評估（AI 捨牌建議的核心）
// 以「捨牌後向聽數 → 進張數」為主，若有副露則以基本盤面為準。
// 之後可再疊加安全性、役之目、性格權重（見 Phase 9）。

import { effectiveTileInfo } from './EffectiveTileCalculator.js';
import { keyFromIndex } from './Tile.js';

// 每位候選：{ index, minNextShanten, effectiveCount, effectiveTiles, score }
// score 越低越好：minNextShanten × 1000 + (100 − effectiveCount)（基本無 bonus 版本）
export function scoreDiscards(counts, meldCount = 0, options = {}) {
  const { bonus = null } = options;
  const info = effectiveTileInfo(counts, meldCount);
  const scored = info.candidates.map((c) => {
    let score = c.minNextShanten * 1000 + (100 - c.effectiveCount);
    if (bonus && typeof bonus === 'function') {
      score -= bonus(c, info);
    }
    return { ...c, score };
  });
  scored.sort((a, b) => a.score - b.score || a.index - b.index);
  return { baseShanten: info.baseShanten, bestShanten: info.bestShanten, candidates: scored };
}

// 建議捨牌（回傳候選物件；可選 options.bonus 讓 AI 加入個性化權重）
export function suggestDiscard(counts, meldCount = 0, options = {}) {
  const result = scoreDiscards(counts, meldCount, options);
  return result.candidates.length > 0 ? result.candidates[0] : null;
}

// 給 UI/AI 的易讀格式
export function discardLabel(candidate) {
  const name = keyFromIndex(candidate.index);
  return {
    key: name,
    minNextShanten: candidate.minNextShanten,
    effectiveCount: candidate.effectiveCount,
    score: candidate.score
  };
}