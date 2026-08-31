// scoring/index.js — 台數引擎公開 API
export { BASE_SCORE, defineRule } from './RuleDefinition.js';
export { scoringRule } from './ScoringRule.js';
export { specialWinRule } from './SpecialWinRule.js';
export { RULES, ruleById } from './rules.js';
export { EXCLUSIONS, applyExclusions } from './exclusions.js';
export { calculatePayment } from './payment.js';
export { scoreWin, buildDerived } from './ScoringEngine.js';