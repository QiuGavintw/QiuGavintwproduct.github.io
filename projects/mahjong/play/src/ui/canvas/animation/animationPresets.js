// animationPresets.js — Phase 15：固定動畫 preset 與集中管理之 duration
// 所有 duration 集中於 ANIMATION_DURATIONS；可用 motionScale 縮放（reduced motion = 0）。
import { AnimationTimeline } from './AnimationTimeline.js';
import { EASING } from './Easing.js';

export const ANIMATION_DURATIONS = Object.freeze({
  draw: 320,
  discard: 260,
  meld: 300,
  flower: 260,
  turn: 200,
  win: 520,
  highlight: 420,
  wall: 240
});

export function scaleDuration(base, scale = 1) {
  return Math.max(0, Math.round(base * Math.max(0, scale)));
}

export function withMotion(duration, motionScale = 1) {
  return scaleDuration(duration, motionScale);
}

// 牌移動（真人＝牌面；AI／暗槓＝背牌，tileKey 傳 null）
export function tileMove({ from, to, tileKey = null, face = true, duration = ANIMATION_DURATIONS.draw, easing = EASING.easeOut, meta = {} }) {
  return new AnimationTimeline({
    type: 'tile-move',
    duration,
    easing,
    from: { ...from },
    to: { ...to },
    meta: { tileKey, face, ...meta }
  });
}

// 回合切換：目前座位的高亮 pulse（不修改 currentSeat）
export function seatTurn({ seat, fromSeat = seat, duration = ANIMATION_DURATIONS.turn, easing = EASING.easeInOut }) {
  return new AnimationTimeline({ type: 'seat-turn', duration, easing, from: { seat: fromSeat }, to: { seat }, meta: {} });
}

// 胡牌：勝者座位 highlight（一炮多響依 winners 順序）
export function winHighlight({ seats, duration = ANIMATION_DURATIONS.win, easing = EASING.easeOut }) {
  return new AnimationTimeline({ type: 'win', duration, easing, from: { seats: seats.slice() }, to: { seats: seats.slice() }, meta: {} });
}

// 短暫 highlight pulse（最後捨牌／副露）
export function highlightPulse({ rect, color = '#f4c95d', duration = ANIMATION_DURATIONS.highlight, easing = EASING.easeOut, meta = {} }) {
  return new AnimationTimeline({
    type: 'highlight',
    duration,
    easing,
    from: { x: rect.x, y: rect.y, w: rect.w, h: rect.h, alpha: 1 },
    to: { x: rect.x, y: rect.y, w: rect.w + 6, h: rect.h + 6, alpha: 0 },
    meta: { color, ...meta }
  });
}

// 牌牆剩餘更新 flash（數字仍以 ViewModel.wallRemaining 為唯一來源）
export function wallFlash({ duration = ANIMATION_DURATIONS.wall, easing = EASING.easeOut }) {
  return new AnimationTimeline({ type: 'wall', duration, easing, from: { alpha: 1 }, to: { alpha: 0 }, meta: {} });
}
