// AnimationClock.js — Phase 15：可注定的動畫時鐘（production 用 rAF delta；test 用 advance()）
// 不使用 Math.random / Date.now（除非由外部注入時間）。
export class AnimationClock {
  constructor(startTime = 0) {
    this._t = Math.max(0, startTime);
  }

  now() {
    return this._t;
  }

  // 推進（deterministic；test 環境使用）
  advance(ms) {
    this._t += Math.max(0, Number(ms) || 0);
    return this._t;
  }

  // 直接設絕對時間（production rAF 可用）
  setTime(ms) {
    this._t = Math.max(0, ms);
    return this._t;
  }
}
