// WinChecker.js — 台灣 16 張胡牌判定（5 面子 + 1 將）
// 只處理「一般胡」。七對子/國士無雙依使用者確認刪除。
// 輸入以 34-length 計數陣列表示（不含花）。

import { MELD_SET_COUNT } from './MahjongRules.js';

// 數牌 index（0..26）輔助
export function isSuitedIndex(idx) {
  return idx < 27;
}

// 遞迴：counts 是否能恰好分割成 k 組面子 + 1 對將
function partitionable(counts, k, pairUsed, depth = 0) {
  // 找第一個非零
  let i = 0;
  while (i < 34 && counts[i] === 0) i++;
  if (i >= 34) {
    return k === 0 && pairUsed;
  }
  const c = counts[i];

  // 刻子
  if (c >= 3 && k > 0) {
    counts[i] -= 3;
    if (partitionable(counts, k - 1, pairUsed, depth + 1)) {
      counts[i] += 3;
      return true;
    }
    counts[i] += 3;
  }
  // 順子（限數牌）
  if (isSuitedIndex(i)) {
    const suitStart = Math.floor(i / 9) * 9;
    const rank = i - suitStart; // 0..8
    if (rank <= 6 && k > 0) {
      if (counts[i + 1] > 0 && counts[i + 2] > 0) {
        counts[i] -= 1;
        counts[i + 1] -= 1;
        counts[i + 2] -= 1;
        if (partitionable(counts, k - 1, pairUsed, depth + 1)) {
          counts[i] += 1;
          counts[i + 1] += 1;
          counts[i + 2] += 1;
          return true;
        }
        counts[i] += 1;
        counts[i + 1] += 1;
        counts[i + 2] += 1;
      }
    }
  }
  // 對將
  if (c >= 2 && !pairUsed) {
    counts[i] -= 2;
    if (partitionable(counts, k, true, depth + 1)) {
      counts[i] += 2;
      return true;
    }
    counts[i] += 2;
  }
  return false;
}

// 一般胡：concealed（34-count）＋ 已聲明的 M 組面子
export function canFormWin(counts, meldCount = 0) {
  const target = MELD_SET_COUNT - meldCount;
  const copy = counts.slice();
  return partitionable(copy, target, false);
}

// 完整 17 張胡牌判定（手牌 + 副露 + 胡牌的所有牌）
export function canWinWithAll(counts34, meldCount) {
  return canFormWin(counts34, meldCount);
}

// 回傳會胡牌的牌 index 列表（多面聽）
export function winningTiles(counts, meldCount = 0) {
  if (meldCount > MELD_SET_COUNT) return [];
  const result = [];
  // 副露不得超過 4 組時就不具一般胡結構的可能
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 4) continue; // 不可能再摸進第 5 張
    const next = counts.slice();
    next[i] += 1;
    if (canFormWin(next, meldCount)) result.push(i);
  }
  return result;
}

// 找出一個胡牌分解（供顯示／計分檢查）
// 回傳 { pairIndex, melds: [ {type:'shun'|'kezi', indices:[...]} ] } 或 null
export function findWinArrangement(counts, meldCount = 0) {
  const target = MELD_SET_COUNT - meldCount;
  for (let pair = 0; pair < 34; pair++) {
    if (counts[pair] < 2) continue;
    const c = counts.slice();
    c[pair] -= 2;
    const melds = [];
    if (decompose(c, target, melds)) {
      return { pairIndex: pair, melds };
    }
  }
  return null;
}

function decompose(counts, k, out) {
  if (k === 0) {
    return counts.every((x) => x === 0);
  }
  let i = 0;
  while (i < 34 && counts[i] === 0) i++;
  if (i >= 34) return false;
  // 刻子
  if (counts[i] >= 3) {
    counts[i] -= 3;
    out.push({ type: 'kezi', indices: [i, i, i] });
    if (decompose(counts, k - 1, out)) return true;
    out.pop();
    counts[i] += 3;
  }
  if (isSuitedIndex(i)) {
    const rank = i % 9;
    if (rank <= 6 && counts[i + 1] > 0 && counts[i + 2] > 0) {
      counts[i] -= 1;
      counts[i + 1] -= 1;
      counts[i + 2] -= 1;
      out.push({ type: 'shun', indices: [i, i + 1, i + 2] });
      if (decompose(counts, k - 1, out)) return true;
      out.pop();
      counts[i] += 1;
      counts[i + 1] += 1;
      counts[i + 2] += 1;
    }
  }
  return false;
}

// 獨聽：winningTiles 長度 === 1
export function isSingleWait(winTiles) {
  return winTiles.length === 1;
}

// 記分：平胡判斷輔助——排列是否全為順子且將非字
export function arrangementIsPureSequence(arr) {
  if (!arr || arr.melds.length !== MELD_SET_COUNT) return false;
  if (arr.melds.some((m) => m.type !== 'shun')) return false;
  return arr.pairIndex < 27; // 將不得為字
}