// strategies/defensive.js — 保守型（首重不放槍，同層內選最安全張；副露出手極其嚴謹）
export const DEFENSIVE = { name: 'defensive', weights: { danger: 2.2, exposure: 1.4, meldThreshold: 1 } };
export default DEFENSIVE;