// AnimationController.js — Phase 15：動畫佇列與播放（sequential）
// 責任：enqueue / play / tick / update / skipAll / cancel / clear / isAnimating。
// 不修改任何遊戲狀態；只是視覺時間軸。
import { ANIM_STATE } from './AnimationTimeline.js';

export class AnimationController {
  constructor({ clock = null, onComplete = null } = {}) {
    this.clock = clock;
    this.onComplete = onComplete;
    this.queue = [];
    this.current = null;
    this._last = this.clock ? this.clock.now() : 0;
  }

  get isAnimating() {
    return !!this.current || this.queue.length > 0;
  }

  get pendingCount() {
    return this.queue.length;
  }

  enqueue(timeline) {
    this.queue.push(timeline);
    return this;
  }

  enqueueAll(list) {
    for (const t of list) this.queue.push(t);
    return this;
  }

  // 把佇列頭提升為 current 並 start
  play() {
    if (!this.current && this.queue.length) {
      this.current = this.queue.shift();
      this.current.start();
    }
    return this.current || null;
  }

  // 以明確 delta 推進（CanvasTable 的 rAF loop 與測試皆可呼叫）
  tick(deltaMs) {
    if (!this.current) this.play();
    if (this.current) {
      const progress = this.current.update(deltaMs);
      if (this.current.onUpdate) this.current.onUpdate(progress, this.current);
      if (this.current.state === ANIM_STATE.COMPLETED) {
        const done = this.current;
        this.current = null;
        if (this.onComplete) this.onComplete(done);
        this.play(); // 接續下一支
      }
    }
    return this.current ? this.current.progress : 1;
  }

  // 以 clock 推進（deterministic：clock.advance(n) 後 update()）
  update() {
    if (!this.clock) throw new Error('AnimationController.update() requires a clock');
    const now = this.clock.now();
    const delta = Math.max(0, now - this._last);
    this._last = now;
    return this.tick(delta);
  }

  // 立即完成全部（含 current 與佇列）；遊戲狀態不變，只更新視覺樣本
  skipAll() {
    while (this.current || this.queue.length) {
      const t = this.current || this.queue.shift();
      if (!t) break;
      if (t.state === ANIM_STATE.RUNNING || t.state === ANIM_STATE.IDLE) t.complete();
      if (t.onUpdate) t.onUpdate(1, t);
      if (this.onComplete) this.onComplete(t);
      this.current = null;
    }
    this.queue.length = 0;
    return this;
  }

  cancel() {
    if (this.current) {
      this.current.cancel();
      this.current = null;
    }
    this.queue.length = 0;
    return this;
  }

  clear() {
    this.queue.length = 0;
    return this;
  }
}
