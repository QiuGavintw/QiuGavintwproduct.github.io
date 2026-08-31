// ScriptedProvider.js — 人機／測試用的腳本化決策 provider（決定性、不依賴 console）
// 與 AIPlayer.createProvider() 同一契約：{ chooseDiscard, chooseReaction, chooseWin, chooseGang }
// 預設行為＝最保守純規則：一律 pass、不胡、不槓、捨第一張；行為可由建構參數覆寫。
export class ScriptedProvider {
  constructor({
    name = '玩家',
    onDiscard = null,   // (ctx, hand) => tileKey
    onReaction = null,  // (ctx, options) => option | { type: 'pass' }
    onWin = null,       // (ctx) => boolean
    onGang = null       // (ctx, options) => option | null
  } = {}) {
    this.name = name;
    this._discard = onDiscard;
    this._reaction = onReaction;
    this._win = onWin;
    this._gang = onGang;
  }

  chooseDiscard(ctx, hand) {
    if (this._discard) return this._discard(ctx, hand);
    return (hand && hand.keys()[0]) || null;
  }

  chooseReaction(ctx, options = []) {
    if (this._reaction) return this._reaction(ctx, options);
    return { type: 'pass' };
  }

  chooseWin(ctx) {
    return this._win ? !!this._win(ctx) : false;
  }

  chooseGang(ctx, options = []) {
    if (this._gang) return this._gang(ctx, options);
    return null;
  }
}