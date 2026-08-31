// SpecialWinRule.js — 特殊胡／特殊事件台型（天胡·地胡·人胡·地聽·海底·河底·搶槓·槓上自摸·七搶一·八仙）
// 由 WinContext.events[eventKey] 觸發（events 由未來的 SpecialWinEngine 產生）。
import { defineRule } from './RuleDefinition.js';

export function specialWinRule(id, name, value, eventKey) {
  return defineRule(id, name, value, (ctx) => !!ctx.events[eventKey]);
}