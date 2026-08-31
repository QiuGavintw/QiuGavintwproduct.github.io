// CanvasInput.js — Phase 14：Canvas 座標 → hit-test → { seat, tileIndex } | null
// 只做座標判定，不修改任何引擎狀態；點擊後的動作交由 UIInputController / Adapter。
import { toLogical } from './CanvasLayout.js';

export function hitTest(layout, vm, lx, ly) {
  if (lx < 0 || ly < 0 || lx > layout.world.w || ly > layout.world.h) return null;
  const humanSeat = layout.humanSeat;
  const s = layout.seat[humanSeat];
  if (!s || !s.isHuman) return null;
  const rects = s.hand;
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h) {
      return { seat: humanSeat, tileIndex: i };
    }
  }
  return null;
}

// 命中人類手牌後：由 ViewModel 取得該張牌 key（人類自己的手牌，允許）。
export function tileKeyOf(vm, hit) {
  const p = vm.players && vm.players[hit.seat];
  if (!p || !p.concealedTiles) return null;
  return p.concealedTiles[hit.tileIndex] || null;
}

// client（CSS pixel，相對於 canvas）→ 邏輯座標
export function clientToLogical(layout, cssX, cssY) {
  return toLogical(layout, cssX, cssY);
}

// 組合式：CSS pixel → hit-test 一次完成（CanvasTable 使用）
export function hitTestClient(layout, vm, cssX, cssY) {
  const { x, y } = toLogical(layout, cssX, cssY);
  return hitTest(layout, vm, x, y);
}
