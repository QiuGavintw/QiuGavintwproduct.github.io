// RuleDefinition.js — 台型定義基底（ScoringRule / SpecialWinRule 共用）
export const BASE_SCORE = { base: 500, perTai: 200 };

export function defineRule(id, name, value, detect) {
  return {
    id,
    name,
    value: typeof value === 'function' ? value : () => value,
    detect
  };
}