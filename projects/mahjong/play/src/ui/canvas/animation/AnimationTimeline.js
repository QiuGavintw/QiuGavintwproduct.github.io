// AnimationTimeline.js — Phase 15：單一動畫（時間／進度／easing／完成／取消）
// 純資料＋樣本；不觸碰遊戲狀態。
import { EASING } from './Easing.js';

export const ANIM_STATE = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

function lerpNumber(a, b, p) {
  return a + (b - a) * p;
}

// 泛用插值：數字逐欄 lerp；陣列/非數字直接取 to（或 fallback from）
export function lerpValue(from, to, p) {
  if (typeof to === 'number' && typeof from === 'number') return lerpNumber(from, to, p);
  const out = {};
  for (const k of Object.keys(to)) {
    const a = from == null ? undefined : from[k];
    const b = to[k];
    if (typeof a === 'number' && typeof b === 'number') out[k] = lerpNumber(a, b, p);
    else out[k] = b != null ? b : a;
  }
  return out;
}

export class AnimationTimeline {
  constructor({ type, duration = 0, easing = EASING.linear, from = {}, to = {}, meta = {}, onUpdate = null } = {}) {
    this.type = type;
    this.duration = Math.max(0, Number(duration) || 0);
    this.easing = easing || EASING.linear;
    this.from = from;
    this.to = to;
    this.meta = meta;
    this.onUpdate = onUpdate;
    this.state = ANIM_STATE.IDLE;
    this.elapsed = 0;
    this.progress = 0;
  }

  start() {
    this.state = ANIM_STATE.RUNNING;
    this.elapsed = 0;
    this.progress = 0;
    if (this.duration <= 0) this.complete();
    return this;
  }

  update(deltaMs) {
    if (this.state !== ANIM_STATE.RUNNING) return this.progress;
    this.elapsed += Math.max(0, Number(deltaMs) || 0);
    this.progress = this.duration > 0 ? Math.min(1, this.elapsed / this.duration) : 1;
    if (this.progress >= 1) this.complete();
    return this.progress;
  }

  complete() {
    this.progress = 1;
    this.state = ANIM_STATE.COMPLETED;
    return this;
  }

  cancel() {
    this.state = ANIM_STATE.CANCELLED;
    return this;
  }

  // 目前樣本：{ progress, eased, value }
  sample() {
    const p = Math.min(1, Math.max(0, this.progress));
    const eased = this.easing(p);
    return { progress: p, eased, value: lerpValue(this.from, this.to, eased) };
  }
}
