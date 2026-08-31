// strategies/balanced.js — 平衡型（中庸：重視向聽與進張，但仍考慮放槍風險）
export const BALANCED = { name: 'balanced', weights: { danger: 0.6, exposure: 0.5, meldThreshold: 0 } };
export default BALANCED;