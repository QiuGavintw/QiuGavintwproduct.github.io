// strategies/aggressive.js — 冒進型（只求前進向聽，不顧放槍風險）
export const AGGRESSIVE = { name: 'aggressive', weights: { danger: 0, exposure: 0.2, meldThreshold: -1 } };
export default AGGRESSIVE;