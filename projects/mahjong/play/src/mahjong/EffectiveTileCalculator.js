// EffectiveTileCalculator.js — 捨牌候選與有效進張（ukeire）
// 每個候選：捨牌後「最佳的下一手向聽」以及「達到該向聽的進張張數」。
// 排序：向聽小的在前，同向聽進張多的在前（tenhou 式）。

import { calculateShanten } from './ShantenCalculator.js';

const KIND_COUNT = 34;

function analyze(counts, meldCount, discardIndex, memo) {
  const after = counts.slice();
  after[discardIndex] -= 1;
  let minNext = Infinity;
  let ukeire = [];
  for (let w = 0; w < KIND_COUNT; w++) {
    if (after[w] >= 4) continue; // 第 5 張不存在
    const target = after.slice();
    target[w] += 1;
    const s = calculateShanten(target, meldCount, memo);
    if (s < minNext) {
      minNext = s;
      ukeire = [w];
    } else if (s === minNext) {
      ukeire.push(w);
    }
  }
  if (minNext === Infinity) minNext = calculateShanten(after, meldCount, memo);
  ukeire.sort((a, b) => a - b);
  return {
    index: discardIndex,
    minNextShanten: minNext,
    effectiveTiles: ukeire,
    effectiveCount: ukeire.length
  };
}

// 回傳全部捨牌候選 + 基礎向聽 + 最佳可達向聽
export function effectiveTileInfo(counts, meldCount = 0) {
  const baseShanten = calculateShanten(counts, meldCount);
  // 共享快取：所有候選都源自同一手牌的子集合
  const memo = new Map();
  const candidates = [];
  for (let d = 0; d < KIND_COUNT; d++) {
    if (counts[d] === 0) continue;
    candidates.push(analyze(counts, meldCount, d, memo));
  }
  const bestShanten = candidates.reduce((min, c) => Math.min(min, c.minNextShanten), baseShanten);
  candidates.sort(
    (a, b) =>
      a.minNextShanten - b.minNextShanten ||
      b.effectiveCount - a.effectiveCount ||
      a.index - b.index
  );
  return { baseShanten, bestShanten, candidates };
}

// 最佳捨牌（僅依「下一手向聽 + 進張數」）
export function bestDiscard(counts, meldCount = 0) {
  const info = effectiveTileInfo(counts, meldCount);
  return info.candidates.length > 0 ? info.candidates[0] : null;
}