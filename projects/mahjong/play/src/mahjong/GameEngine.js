// GameEngine.js — Phase 10：對局編排層（orchestration layer）
// 純邏輯、無 UI/Canvas/動畫/音效。整合：
//   TurnManager（規則與手牌流）→ SpecialWinEngine（特殊事件偵測）
//   → ScoringEngine（計分）→ Session（連莊/圈風/局數/分數/終局）。
// GameEngine 本身不重新判定任何規則；只負責驅動與結算（真實引擎全部來自既有模組）。
// 玩家：一律四家；預設 seat0 = human（ScriptedProvider，外部注入），seat1~3 = AI（Phase 9 AIPlayer）。
// 決定性：RNG 一律使用 src/core/RNG（seed 可指定）；同 seed 同初始同決策 → 完全可重現。
// 狀態機：idle → initializing → dealing → playing → (resolving 為捨牌步驟內之瞬態)
//         → hand_end → settlement → next_hand | match_end
//         「resolving」由 TurnManager 於 discard() 內同步處理，GameEngine 對外不殘留該態。
import { createRNG } from '../core/RNG.js';
import { Session } from '../core/Session.js';
import { Wall } from './Wall.js';
import { Hand } from './Hand.js';
import { setupRound } from './Deal.js';
import { Dice } from './Dice.js';
import { TurnManager } from './TurnManager.js';
import { SpecialWinEngine, eventsToMap } from './special/SpecialWinEngine.js';
import { scoreWin } from './scoring/index.js';
import { kindIndex } from './Tile.js';
import { AIPlayer } from './ai/AIPlayer.js';
import { ScriptedProvider } from './ai/ScriptedProvider.js';

export const PHASES = Object.freeze([
  'idle',
  'initializing',
  'dealing',
  'playing',
  'resolving',
  'hand_end',
  'settlement',
  'next_hand',
  'match_end'
]);

// 防呆臨界：正常一局不可能超過此步數（每步＝一次摸牌或一次捨牌）
const MAX_STEPS_PER_HAND = 800;

export class GameEngine {
  constructor(opts = {}) {
    this.options = {
      mode: 'one',
      withFlowers: true,
      startScore: 25000,
      seed: 1,
      dealerSeat: 0,
      ...opts
    };
    // 固定種子供 reset() 還原（不變更時決定性可由 seed 完全重現）
    this.seed = this.options.seed;
    this.players = this._buildPlayers(this.options.players || null);
    this.session = new Session({
      mode: this.options.mode,
      withFlowers: this.options.withFlowers,
      startScore: this.options.startScore,
      dealerSeat: this.options.dealerSeat
    });
    this.rng = createRNG(this.seed);
    this.special = new SpecialWinEngine();

    this.tm = null;
    this.wall = null;
    this.hands = null;
    this.phase = 'idle';
    this.settlements = [];
    this._steps = 0;
    this._firstHand = true;

    // TurnManager 的 provider bridge：按 ctx.seat 派發給該位置之決策 provider
    this._bridge = {
      chooseWin: (ctx) => this._providerFor(ctx.seat).chooseWin(ctx),
      chooseGang: (ctx, options) => this._providerFor(ctx.seat).chooseGang(ctx, options),
      chooseReaction: (ctx, options) => this._providerFor(ctx.seat).chooseReaction(ctx, options),
      chooseDiscard: (ctx, hand) => this._providerFor(ctx.seat).chooseDiscard(ctx, hand)
    };
  }

  static createGame(opts = {}) {
    return new GameEngine(opts);
  }

  // ── 玩家建構 ─────────────────────────────
  _buildPlayers(list) {
    const bySeat = {};
    for (let i = 0; i < (list || []).length; i++) {
      const cfg = list[i];
      if (cfg == null) continue;
      const seat = cfg.seat ?? i; // 未指定座位時依陣列位置
      bySeat[seat] = this._normalizePlayer(cfg, seat);
    }
    const out = [];
    for (let seat = 0; seat < 4; seat++) {
      if (bySeat[seat]) {
        out[seat] = bySeat[seat];
      } else if (seat === 0) {
        // 預設：seat0 = human（ScriptedProvider，可由外部注入不同 provider）
        out[seat] = this._normalizePlayer({ seat, provider: new ScriptedProvider() }, seat);
      } else {
        // 預設：其餘為 Phase 9 AI（決定性，無 RNG）
        out[seat] = this._normalizePlayer({ seat, type: 'ai', strategyName: 'balanced' }, seat);
      }
    }
    return out;
  }

  _normalizePlayer(cfg, seat = cfg.seat ?? 0) {
    if (cfg.ai instanceof AIPlayer) {
      cfg.ai.hands = null;
      return {
        seat,
        type: 'ai',
        name: cfg.name || cfg.ai.name || `AI${seat}`,
        strategyName: cfg.ai.strategy ? cfg.ai.strategy.name : 'balanced',
        ai: cfg.ai,
        provider: cfg.ai.createProvider()
      };
    }
    if (cfg.type === 'ai') {
      const ai = new AIPlayer({
        name: cfg.name || (cfg.strategyName ? `AI-${cfg.strategyName}` : `AI${seat}`),
        strategyName: cfg.strategyName || 'balanced',
        hands: null
      });
      return {
        seat,
        type: 'ai',
        name: ai.name,
        strategyName: ai.strategy ? ai.strategy.name : 'balanced',
        ai,
        provider: ai.createProvider()
      };
    }
    // 直接傳 ScriptedProvider（或任何含 chooseDiscard 的 provider 物件）時，該物件即為 provider
    let provider = cfg.provider;
    if (!provider && cfg instanceof ScriptedProvider) provider = cfg;
    if (!provider && cfg && typeof cfg.chooseDiscard === 'function') provider = cfg;
    return {
      seat,
      type: cfg.type || 'human',
      name: cfg.name || (seat === 0 ? '玩家' : `玩家${seat}`),
      provider: provider || new ScriptedProvider()
    };
  }

  _providerFor(seat) {
    const p = this.players[seat];
    if (!p || !p.provider) throw new Error(`no provider for seat ${seat}`);
    return p.provider;
  }

  // ── 開局 ─────────────────────────────────
  startHand() {
    if (this.session.finished) throw new Error('cannot startHand: match already finished');
    if (this.phase === 'playing' || this.phase === 'resolving' || this.phase === 'hand_end' || this.phase === 'settlement') {
      throw new Error(`cannot startHand in phase ${this.phase}`);
    }
    this.phase = 'initializing';
    this._steps = 0;

    const withFlowers = this.session.withFlowers;
    let wall = null;
    let hands = null;
    const injected = this._firstHand && (this.options.wall || this.options.hands);
    this._firstHand = false; // 注入牌局僅用於第一手（多局時其後走真實洗牌/發牌）

    if (this.options.hands && injected) {
      hands = this.options.hands.map((h, s) => (h instanceof Hand ? h : new Hand(s, h)));
      wall = this.options.wall && injected ? this.options.wall : new Wall(withFlowers);
    } else {
      wall = new Wall(withFlowers);
      hands = [0, 1, 2, 3].map((s) => new Hand(s, []));
      const dice = this.options.dice || new Dice(3, 6, this.rng);
      setupRound(wall, this.rng, this.session.dealerSeat, dice, hands);
    }
    this.wall = wall;
    this.hands = hands;

    // 同步牌牆/手牌至 AI 玩家（decision 以 hands[seat] 查詢）
    for (const p of this.players) {
      if (p.ai) p.ai.hands = hands;
    }

    this.phase = 'dealing';
    this.tm = new TurnManager({
      wall,
      hands,
      dealerSeat: this.session.dealerSeat,
      renchan: this.session.renchan,
      roundWind: this.session.roundWind,
      round: this.session.roundIndex,
      provider: this._bridge
    });

    this.phase = 'playing';
    this.tm.start(); // 莊家 17 張可胡 → 自動天胡（state=hand_end）
    if (this.tm.state === 'hand_end') this.phase = 'hand_end';
    return this;
  }

  // 下一步：一次摸牌或一次捨牌（捨牌含其後之反應解析，由 TurnManager 同步完成）
  step() {
    if (this.phase !== 'playing') {
      throw new Error(`cannot step in phase ${this.phase}`);
    }
    const tm = this.tm;
    this._steps += 1;
    if (this._steps > MAX_STEPS_PER_HAND) throw new Error('hand exceeded step limit (possible stall)');

    if (tm.state === 'hand_end') {
      this.phase = 'hand_end';
      return this;
    }
    if (tm.state === 'waiting_draw') {
      this.phase = 'resolving';
      tm.draw();
      return this._syncPhase();
    }
    if (tm.state === 'waiting_discard') {
      this.phase = 'resolving';
      const seat = tm.currentSeat;
      const hand = tm.hands[seat];
      const ctx = this._discardContext(seat, hand);
      const choice = this._providerFor(seat).chooseDiscard(ctx, hand);
      if (choice == null) {
        // 無可捨張（防呆）：停留本態，交由外部處理
        this.phase = 'playing';
        return this;
      }
      tm.discard(choice); // 非法捨牌會拋錯；反應（胡/吃碰槓/過水）於此同步解析
      return this._syncPhase();
    }
    throw new Error(`step: unexpected TM state ${tm.state}`);
  }

  _discardContext(seat, hand) {
    const tm = this.tm;
    return {
      seat,
      hand,
      river: tm.river,
      turnNumber: tm.turnNumber,
      dealerSeat: tm.dealerSeat,
      roundWind: tm.roundWind,
      renchan: tm.renchan,
      wallRemaining: tm.wall.remaining,
      discards: tm.river.map((e) => e.tile)
    };
  }

  _syncPhase() {
    const s = this.tm.state;
    if (s === 'hand_end') {
      this.phase = 'hand_end';
      return this;
    }
    if (s === 'waiting_draw' || s === 'waiting_discard' || s === 'drawing' || s === 'resolving_reactions' || s === 'resolving_gang') {
      this.phase = 'playing';
      return this;
    }
    throw new Error(`unexpected TM state ${s}`);
  }

  // 跑完整一局（含結算），直到 phase = next_hand | match_end
  runHand() {
    if (!this.tm) throw new Error('no hand started; call startHand() first');
    if (this.phase === 'hand_end') {
      this.endHand();
      return this.getSnapshot();
    }
    let guard = 0;
    while (this.phase === 'playing') {
      this.step();
      guard += 1;
      if (guard > MAX_STEPS_PER_HAND) throw new Error('runHand exceeded step limit');
    }
    if (this.phase === 'hand_end') this.endHand();
    return this.getSnapshot();
  }

  // 結算：snapshot → 特殊事件 → 計分 → 更新 Session 分數 → Session.advance → 下一局/終局
  endHand() {
    if (!this.tm) throw new Error('cannot endHand: no hand started');
    if (this.phase !== 'hand_end') throw new Error(`cannot endHand in phase ${this.phase}`);
    this.phase = 'settlement';

    const tm = this.tm;
    const snapshot = tm.buildSnapshot();
    const det = this.special.detectEvents(snapshot);
    const eventsMap = eventsToMap(det.events);
    const hr = snapshot.handResult;

    const record = {
      handIndex: this.session.roundIndex,
      dealerSeat: tm.dealerSeat,
      renchan: tm.renchan,
      roundWind: tm.roundWind,
      result: hr ? { ...hr, winners: [...hr.winners], specialEvents: { ...hr.specialEvents } } : null,
      wins: [],
      scoreDeltas: [0, 0, 0, 0]
    };

    if (hr && hr.winType !== 'flow') {
      for (const winnerSeat of hr.winners) {
        const hand = tm.hands[winnerSeat];
        const counts = hand.counts();
        let winTileIndex = null;
        if (hr.winType === 'ron' && hr.tile != null) {
          const ki = kindIndex(hr.tile);
          counts[ki] += 1;
          winTileIndex = ki;
        } else if (hr.winType === 'tsumo' && hr.tile != null) {
          winTileIndex = kindIndex(hr.tile);
        }
        const rs = scoreWin({
          counts34: counts,
          melds: hand.melds,
          winTileIndex,
          winBy: hr.winType,
          seat: winnerSeat,
          dealerSeat: tm.dealerSeat,
          roundWind: tm.roundWind,
          renchan: tm.renchan,
          flowers: hand.flowers,
          discarderSeat: hr.discarderSeat,
          events: eventsMap
        });
        record.wins.push({
          seat: winnerSeat,
          winBy: eventsMap.baxian || eventsMap.qiqiangyi ? 'tsumo' : hr.winType,
          tai: rs.tai,
          base: rs.base,
          perTai: rs.perTai,
          rules: rs.rules.map((r) => ({ ...r })),
          payment: { payers: rs.payment.payers.map((p) => ({ ...p })), total: rs.payment.total }
        });
      }
    }

    // 套用分數（零和）：胡家加總額、各家依 payment 扣
    for (const w of record.wins) {
      this.session.scores[w.seat] += w.payment.total;
      record.scoreDeltas[w.seat] += w.payment.total;
      for (const p of w.payment.payers) {
        this.session.scores[p.seat] -= p.amount;
        record.scoreDeltas[p.seat] -= p.amount;
      }
    }

    const adv = this.session.advance({
      winType: hr.winType,
      winners: hr.winners,
      discarderSeat: hr.discarderSeat
    });
    this.settlements.push(record);
    this.phase = adv.next ? 'next_hand' : 'match_end';
    return record;
  }

  // 直接跑完整場對局（與 Session 目標局數一致）
  runUntilEnd() {
    let guard = 0;
    while (!this.session.finished) {
      guard += 1;
      if (guard > 400) throw new Error('match exceeded hand limit');
      if (this.phase === 'idle' || this.phase === 'next_hand') this.startHand();
      this.runHand();
    }
    return this.getSnapshot();
  }

  // 重置至初始狀態（保留 players/options，還原分數與 RNG 種子）
  reset() {
    const opts = this.options;
    this.session = new Session({
      mode: opts.mode,
      withFlowers: opts.withFlowers,
      startScore: opts.startScore,
      dealerSeat: opts.dealerSeat
    });
    this.rng = createRNG(this.seed);
    this.tm = null;
    this.wall = null;
    this.hands = null;
    this.phase = 'idle';
    this.settlements = [];
    this._steps = 0;
    this._firstHand = true;
    for (const p of this.players) {
      if (p.ai) p.ai.hands = null;
    }
    return this;
  }

  // 狀態快照（純資料、無 hidden state）
  getState() {
    const tm = this.tm;
    return {
      phase: this.phase,
      mode: this.options.mode,
      withFlowers: this.options.withFlowers,
      seed: this.seed,
      roundIndex: this.session.roundIndex,
      roundWind: this.session.roundWind,
      dealerSeat: this.session.dealerSeat,
      renchan: this.session.renchan,
      scores: this.session.scores.slice(),
      finished: this.session.finished,
      finalRanking: this.session.finalRanking ? this.session.finalRanking.map((r) => ({ ...r })) : null,
      tmState: tm ? tm.state : null,
      currentSeat: tm ? tm.currentSeat : null,
      turnNumber: tm ? tm.turnNumber : null,
      wallRemaining: tm ? tm.wall.remaining : null,
      settlementsCount: this.settlements.length,
      handResult: tm && tm.handResult
        ? { ...tm.handResult, winners: [...tm.handResult.winners], specialEvents: { ...tm.handResult.specialEvents } }
        : null,
      players: this.players.map((p) => ({ seat: p.seat, type: p.type, name: p.name, score: this.session.scores[p.seat] }))
    };
  }

  // 深度快照：牌局層（TurnManager.buildSnapshot）+ 對局層（Session）+ 玩家 + 結算史
  getSnapshot() {
    return {
      phase: this.phase,
      mode: this.options.mode,
      withFlowers: this.options.withFlowers,
      players: this.players.map((p) => ({ seat: p.seat, type: p.type, name: p.name })),
      match: {
        mode: this.options.mode,
        seed: this.seed,
        startScore: this.session.startScore,
        scores: this.session.scores.slice(),
        dealerSeat: this.session.dealerSeat,
        renchan: this.session.renchan,
        roundIndex: this.session.roundIndex,
        roundWind: this.session.roundWind,
        finished: this.session.finished,
        finalRanking: this.session.finalRanking ? this.session.finalRanking.map((r) => ({ ...r })) : null,
        results: this.session.results.map((r) => ({ ...r }))
      },
      hand: this.tm ? this.tm.buildSnapshot() : null,
      settlements: JSON.parse(JSON.stringify(this.settlements))
    };
  }
}