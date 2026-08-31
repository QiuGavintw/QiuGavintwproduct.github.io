// ai/index.js — Phase 9 AI 決策引擎統一出口
export { AIStrategy, STRATEGIES, strategyFor } from './AIStrategy.js';
export { AIDecisionEngine } from './AIDecisionEngine.js';
export { AIPlayer } from './AIPlayer.js';
export { ScriptedProvider } from './ScriptedProvider.js';
export { default as balanced, BALANCED } from './strategies/balanced.js';
export { default as aggressive, AGGRESSIVE } from './strategies/aggressive.js';
export { default as defensive, DEFENSIVE } from './strategies/defensive.js';