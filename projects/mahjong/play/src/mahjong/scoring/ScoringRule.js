// ScoringRule.js — 一般台型規則（依手牌結構／情境偵測）
import { defineRule } from './RuleDefinition.js';

export function scoringRule(id, name, value, detect) {
  return defineRule(id, name, value, detect);
}