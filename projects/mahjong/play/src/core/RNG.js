// RNG.js — 可指定種子的偽隨機數（支援存檔還原、Cheat Mode、測試再現）
// mulberry32 演算法；提供 shuffle 與 int 等工具。

export class RNG {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.a = this.seed;
  }

  // 回傳 [0, 1)
  float() {
    this.a |= 0;
    this.a = (this.a + 0x6d2b79f5) | 0;
    let t = Math.imul(this.a ^ (this.a >>> 15), 1 | this.a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // 回傳 [min, max] 整數（含兩端）
  int(min, max) {
    min = Math.floor(min);
    max = Math.floor(max);
    return min + Math.floor(this.float() * (max - min + 1));
  }

  pick(arr) {
    return arr[Math.floor(this.float() * arr.length)];
  }

  // Fisher-Yates shuffle；回傳新陣列
  shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.float() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  // 目前內部狀態（保存用）
  saveState() {
    return { seed: this.seed, a: this.a };
  }

  // 還原內部狀態
  restoreState(state) {
    this.seed = state.seed >>> 0;
    this.a = state.a >>> 0;
  }
}

export function createRNG(seed) {
  if (seed === undefined) {
    seed = Math.floor(Math.random() * 2 ** 31);
  }
  return new RNG(seed);
}