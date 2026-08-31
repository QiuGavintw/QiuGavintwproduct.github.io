// Easing.js — Phase 15：純函式 easing（輸入/輸出皆 0..1，永不 NaN/Infinity）
export function clamp01(p) {
  if (Number.isNaN(p)) return 0;
  if (p === Infinity) return 1;
  if (p === -Infinity) return 0;
  return Math.min(1, Math.max(0, p));
}

export const EASING = Object.freeze({
  linear: (p) => clamp01(p),
  easeOut: (p) => {
    const c = clamp01(p);
    return 1 - Math.pow(1 - c, 2);
  },
  easeInOut: (p) => {
    const c = clamp01(p);
    return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
  }
});
