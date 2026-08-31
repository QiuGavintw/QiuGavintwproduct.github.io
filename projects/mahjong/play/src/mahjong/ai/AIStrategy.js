// AIStrategy.js — AI 人格策略：向聽/進張為決策基底，性格只在同層內調整權重
// danger：風險權重（河中剩餘張數＋中張懲罰），0=完全無視
// exposure：副露/槓的流出懲罰（影響其他玩家讀牌）
// meldThreshold：副露接受門檻（gain − exposure ≥ threshold 才執行）
export const STRATEGIES = Object.freeze({
  balanced: Object.freeze({
    name: 'balanced',
    weights: Object.freeze({ danger: 0.6, exposure: 0.5, meldThreshold: 0 })
  }),
  aggressive: Object.freeze({
    name: 'aggressive',
    weights: Object.freeze({ danger: 0.0, exposure: 0.2, meldThreshold: -1 })
  }),
  defensive: Object.freeze({
    name: 'defensive',
    weights: Object.freeze({ danger: 2.2, exposure: 1.4, meldThreshold: 1 })
  })
});

export class AIStrategy {
  constructor(name, weights) {
    this.name = name;
    this.weights = { ...weights };
  }

  get danger() {
    return this.weights.danger;
  }

  get exposure() {
    return this.weights.exposure;
  }

  get meldThreshold() {
    return this.weights.meldThreshold;
  }
}

// 依名稱取策略；未知名稱回退 balanced
export function strategyFor(name) {
  if (!name || !STRATEGIES[name]) return new AIStrategy(STRATEGIES.balanced.name, STRATEGIES.balanced.weights);
  const def = STRATEGIES[name];
  return new AIStrategy(def.name, def.weights);
}