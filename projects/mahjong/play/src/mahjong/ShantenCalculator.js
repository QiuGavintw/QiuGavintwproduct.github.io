// ShantenCalculator.js — 台灣 16 張向聽數（牌効率定義）
// 向聽數 = (16 − 3×副露數) − maxOverlap
//   maxOverlap：暗牌中最多能放進 (5−M) 面子塊 + 1 將塊 的張數。
//   一張牌可作：完整順/刻（3）、二張搭（同張/相鄰/中張坎，2）、單張（1）或捨棄不計。
// 向聽 0 ＝ 聽牌（摸進一張即胡）；向聽 n ＝ 還需 n 次進牌才聽。

import { MELD_SET_COUNT, HAND_TILES } from './MahjongRules.js';

const KIND_COUNT = 34;

function isSuited(idx) {
  return idx < 27;
}

// 遞迴求最大可打包張數（memoized：狀態由 counts、m、pairUsed 唯一決定）
// counts 可變動（遞迴中只減不增）；m = 剩餘面子塊數；pairUsed = 將塊是否已用
function pack(counts, m, pairUsed, memo) {
  const key = counts.join(',') + '|' + m + '|' + (pairUsed ? 1 : 0);
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  let best = 0;
  if (!(m === 0 && pairUsed)) {
    let i = 0;
    while (i < KIND_COUNT && counts[i] === 0) i++;
    if (i < KIND_COUNT) {
      const c = counts[i];

      // 這張牌不計（跳過此種）
      const skipped = counts.slice();
      skipped[i] = 0;
      best = pack(skipped, m, pairUsed, memo);

      // 將塊：同張兩張（聽對碰時只放 1 張亦可）
      if (!pairUsed) {
        const take = Math.min(2, c);
        const r = counts.slice();
        r[i] = c - take;
        best = Math.max(best, take + pack(r, m, true, memo));
      }

      if (m > 0) {
        // 刻子
        if (c >= 3) {
          const r = counts.slice();
          r[i] = c - 3;
          best = Math.max(best, 3 + pack(r, m - 1, pairUsed, memo));
        }
        // 順子
        if (isSuited(i) && i % 9 <= 6 && counts[i + 1] > 0 && counts[i + 2] > 0) {
          const r = counts.slice();
          r[i] -= 1;
          r[i + 1] -= 1;
          r[i + 2] -= 1;
          best = Math.max(best, 3 + pack(r, m - 1, pairUsed, memo));
        }
        // 二張搭：同張 ×2
        if (c >= 2) {
          const r = counts.slice();
          r[i] = c - 2;
          best = Math.max(best, 2 + pack(r, m - 1, pairUsed, memo));
        }
        // 二張搭：數牌相鄰（i, i+1）
        if (isSuited(i) && i % 9 <= 7 && counts[i + 1] > 0) {
          const r = counts.slice();
          r[i] -= 1;
          r[i + 1] -= 1;
          best = Math.max(best, 2 + pack(r, m - 1, pairUsed, memo));
        }
        // 二張搭：數牌中張坎（i, i+2）
        if (isSuited(i) && i % 9 <= 6 && counts[i + 2] > 0) {
          const r = counts.slice();
          r[i] -= 1;
          r[i + 2] -= 1;
          best = Math.max(best, 2 + pack(r, m - 1, pairUsed, memo));
        }
        // 單張（面子塊的底）
        {
          const r = counts.slice();
          r[i] = c - 1;
          best = Math.max(best, 1 + pack(r, m - 1, pairUsed, memo));
        }
      }
    }
  }

  memo.set(key, best);
  return best;
}

function runPack(counts, m, memo) {
  return pack(counts.slice(), m, false, memo || new Map());
}

// 暗牌（34-count）最大可打包張數
export function maxOverlap(counts, meldCount = 0, memo) {
  const m = MELD_SET_COUNT - meldCount;
  if (m < 0) return 0;
  return runPack(counts, m, memo);
}

// 向聽數；melds 的副露組數（包含暗槓）
// memo 為選擇性共用快取（同一手牌的大量計算可大幅加速，見 EffectiveTileCalculator）
export function calculateShanten(counts, meldCount = 0, memo) {
  const m = MELD_SET_COUNT - meldCount;
  if (m < 0) return HAND_TILES;
  const concealed = HAND_TILES - 3 * meldCount;
  const overlap = runPack(counts, m, memo);
  return Math.max(0, concealed - overlap);
}

// 是否聽牌
export function isTenpai(counts, meldCount = 0) {
  return calculateShanten(counts, meldCount) === 0;
}