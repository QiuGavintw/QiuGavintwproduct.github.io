// CanvasTable.js — Phase 14/15：canvas 元素控制（DPR／resize／render／輸入派發／動畫 loop）
// 不做任何規則判定；render 吃純資料，輸入只做 hit-test 後把 tile key 交給外部 onTile。
// Phase 15：掛載 AnimationController + rAF abstraction；動畫只做視覺、不碰遊戲狀態。
import { computeLayout } from './CanvasLayout.js';
import { CanvasRenderer } from './CanvasRenderer.js';
import { TileRenderer } from './TileRenderer.js';
import { PlayerRenderer } from './PlayerRenderer.js';
import { RiverRenderer } from './RiverRenderer.js';
import { MeldRenderer } from './MeldRenderer.js';
import { WallRenderer } from './WallRenderer.js';
import { hitTestClient, tileKeyOf } from './CanvasInput.js';
import { AnimationClock } from './animation/AnimationClock.js';
import { AnimationController } from './animation/AnimationController.js';
import { buildTimelines } from './animation/visualEvents.js';
import { AnimationOverlay } from './animation/AnimationOverlay.js';

// 安全偵測 reduced-motion（window.matchMedia 不存在／拋錯時一律回 false）
export function detectReducedMotion(win) {
  if (!win || typeof win.matchMedia !== 'function') return false;
  try {
    return !!win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function normalizeDpr(dpr) {
  const d = Number(dpr);
  return Number.isFinite(d) && d > 0 ? d : 1;
}

export class CanvasTable {
  constructor({ canvas, doc, dpr, raf, caf, onTile = null, onIdle = null, clock = null, controller = null, reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.doc = doc || (typeof window !== 'undefined' ? window : null);
    this.dpr = normalizeDpr(dpr != null ? dpr : typeof window !== 'undefined' ? window.devicePixelRatio : 1);
    this.onTile = onTile;
    this.onIdle = onIdle;
    this.ctx = canvas.getContext('2d');
    this.viewW = 0;
    this.viewH = 0;
    this.layout = null;

    this.renderer = new CanvasRenderer({
      tileRenderer: new TileRenderer(),
      playerRenderer: new PlayerRenderer(),
      riverRenderer: new RiverRenderer({ tileRenderer: new TileRenderer() }),
      meldRenderer: new MeldRenderer({ tileRenderer: new TileRenderer() }),
      wallRenderer: new WallRenderer()
    });

    // Phase 15：動畫
    this.clock = clock || new AnimationClock();
    this.anim = controller || new AnimationController({ clock: this.clock });
    this.overlay = new AnimationOverlay({ tileRenderer: new TileRenderer() });
    this._rafFn =
      raf ||
      (typeof window !== 'undefined' && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : null);
    this._cafFn =
      caf ||
      (typeof window !== 'undefined' && window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : null);
    this._rafId = null;
    this._lastTs = null;
    this._motionScale = reducedMotion ? 0 : 1;

    this._boundPointer = this._onPointer.bind(this);
    this._boundFrame = this._frame.bind(this);
    this.canvas.addEventListener('pointerdown', this._boundPointer);
  }

  // 依 canvas 實際 CSS 尺寸調整解析度（DPR），回傳新尺寸
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const rawW = Number.isFinite(rect.width) ? rect.width : this.canvas.clientWidth || 0;
    const rawH = Number.isFinite(rect.height) ? rect.height : this.canvas.clientHeight || 0;
    const cssW = Math.max(1, Math.round(rawW || 0));
    const cssH = Math.max(1, Math.round(rawH || 0));
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.viewW = cssW;
    this.viewH = cssH;
    return { width: cssW, height: cssH };
  }

  // 渲染靜態場景 + 依 VM diff 建立動畫佇列 + 畫目前動畫疊層
  render(vm, uiState) {
    if (!vm) return;
    if (this.viewW <= 0 || this.viewH <= 0) this.resize();
    const prev = this._lastVm;
    this.setVm(vm);
    this.layout = computeLayout(vm, this.viewW, this.viewH);

    this._paint(vm, uiState);

    if (prev && vm && this._motionScale > 0) {
      const timelines = buildTimelines(prev, vm, this.layout, {
        humanSeat: this.layout.humanSeat,
        motionScale: this._motionScale
      });
      if (timelines.length) {
        this.anim.enqueueAll(timelines);
        this.anim.play();
      }
    }

    this._paintOverlay();
    this._ensureLoop();
  }

  // 重繪目前 VM（resize 後；不推進引擎）
  redraw(vm, uiState) {
    if (!vm) return;
    if (this.viewW <= 0 || this.viewH <= 0) this.resize();
    this.setVm(vm);
    this.layout = computeLayout(vm, this.viewW, this.viewH);
    this._paint(vm, uiState);
    this._paintOverlay();
  }

  // 立即完成全部動畫：遊戲狀態不變、renderer 顯示 final state
  skipAll() {
    this.anim.skipAll();
    this._cancelFrame();
    this._lastTs = null;
    if (this._lastVm) this.redraw(this._lastVm, this._lastUiState);
    if (this.onIdle) this.onIdle();
    return this;
  }

  isAnimating() {
    return this.anim.isAnimating;
  }

  setReducedMotion(v) {
    this._motionScale = v ? 0 : 1;
    if (v) this.skipAll();
    return this;
  }

  // 外部手動推進一幀（測試用）：ts 為絕對毫秒（或傳 delta 由 clock 處理）
  frame(ts) {
    if (this._lastTs == null) this._lastTs = ts;
    const delta = Math.max(0, ts - this._lastTs);
    this._lastTs = ts;
    this.clock.advance(delta);
    this.anim.update();
    if (this._lastVm) {
      this._paint(this._lastVm, this._lastUiState);
      this._paintOverlay();
    }
    if (this.anim.isAnimating) {
      this._ensureLoop();
    } else {
      this._cancelFrame();
      this._lastTs = null;
      if (this.onIdle) this.onIdle();
    }
    return this.anim.isAnimating;
  }

  dispose() {
    this._cancelFrame();
    this.canvas.removeEventListener('pointerdown', this._boundPointer);
  }

  _paint(vm, uiState) {
    this._lastUiState = uiState;
    const { ox, oy, scale } = this.layout;
    this.ctx.clearRect(0, 0, this.viewW, this.viewH);
    this.ctx.save();
    this.ctx.translate(ox, oy);
    this.ctx.scale(scale, scale);
    this.renderer.render(this.ctx, vm, this.layout, uiState);
    this.ctx.restore();
  }

  _paintOverlay() {
    if (!this.anim.current || !this.layout) return;
    const { ox, oy, scale } = this.layout;
    this.ctx.save();
    this.ctx.translate(ox, oy);
    this.ctx.scale(scale, scale);
    this.overlay.draw(this.ctx, this.layout, this.anim.current);
    this.ctx.restore();
  }

  _ensureLoop() {
    if (!this.anim.isAnimating) return;
    if (!this._rafFn) return; // 無 rAF 環境（測試）→ 由測試手動 frame()
    if (this._rafId != null) return;
    this._rafId = this._rafFn(this._boundFrame);
  }

  _cancelFrame() {
    if (this._rafId != null) {
      if (this._cafFn) this._cafFn(this._rafId);
      this._rafId = null;
    }
  }

  _frame(ts) {
    this._rafId = null;
    this.frame(ts);
  }

  _onPointer(ev) {
    if (!this.layout) return;
    const cssX = ev.offsetX != null ? ev.offsetX : ev.clientX - this.canvas.getBoundingClientRect().left;
    const cssY = ev.offsetY != null ? ev.offsetY : ev.clientY - this.canvas.getBoundingClientRect().top;
    const hit = hitTestClient(this.layout, this._lastVm, cssX, cssY);
    if (hit && this.onTile) {
      const key = tileKeyOf(this._lastVm, hit);
      if (key) this.onTile(key);
    }
  }

  // 記住最近一次 ViewModel 供 hit-test 使用（render 時更新）
  setVm(vm) {
    this._lastVm = vm;
  }
}
