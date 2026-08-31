// AIPlayer.js — AI 玩家包裝：把 AIDecisionEngine 包成 TurnManager 可用的 provider
// provider only needs { chooseWin, chooseGang, chooseReaction }；chooseDiscard 供外部驅動（未來 GameEngine）呼叫。
import { AIDecisionEngine } from './AIDecisionEngine.js';
import { AIStrategy, strategyFor } from './AIStrategy.js';

export class AIPlayer {
  constructor({ name = 'AI', strategyName = 'balanced', strategy = null, hands = null, rng = null } = {}) {
    this.name = name;
    this.hands = hands;
    this.strategy = strategy instanceof AIStrategy ? strategy : strategyFor(strategyName);
    this.engine = new AIDecisionEngine({ strategy: this.strategy, rng });
  }

  // 把 context 補上手牌（ctx.hand 優先，其次 hands[seat]）
  _withHand(ctx, fallbackHand = null) {
    const hand = (ctx && (ctx.hand || (this.hands && this.hands[ctx.seat]))) || fallbackHand;
    return { ...ctx, hand };
  }

  createProvider() {
    const self = this;
    return {
      chooseReaction: (ctx, options) => self.engine.chooseReaction(self._withHand(ctx), options),
      chooseWin: (ctx) => self.engine.chooseWin(ctx),
      chooseGang: (ctx, options) => self.engine.chooseGang(self._withHand(ctx), options),
      chooseDiscard: (ctx, hand) => self.engine.chooseDiscard(self._withHand(ctx, hand))
    };
  }

  chooseDiscard(context, hand = null) {
    return this.engine.chooseDiscard(this._withHand(context, hand));
  }
}