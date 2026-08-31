// index.js — Phase 15：動畫層統一匯出
export { AnimationClock } from './AnimationClock.js';
export { EASING, clamp01 } from './Easing.js';
export { AnimationTimeline, ANIM_STATE, lerpValue } from './AnimationTimeline.js';
export { AnimationController } from './AnimationController.js';
export { ANIMATION_DURATIONS, scaleDuration, withMotion, tileMove, seatTurn, winHighlight, highlightPulse, wallFlash } from './animationPresets.js';
export { buildTimelines } from './visualEvents.js';
export { AnimationOverlay } from './AnimationOverlay.js';
