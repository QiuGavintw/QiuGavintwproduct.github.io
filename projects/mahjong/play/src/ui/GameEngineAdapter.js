// GameEngineAdapter.js — Phase 12/13：把 GameEngine 包成 UI 可安全消費的唯讀 View Model
// 責任：
//   1) UI 只能讀 adapter 的 View Model，不得碰 GameEngine/TurnManager/Session 內部物件。
//   2) UI 只能透過 adapter 發指令（discard/draw/react/pass/...），不可直接呼叫引擎內部。
//   3) adapter 本身不產生亂數（決定性一律來自引擎 seed）；不重現任何規則判定。
// 人類決策注入原理：TM 的決策（捨牌/胡/吃碰槓）都在「引擎一步」內同步詢問各 provider。
//   adapter 用「暫停協定」在需要人類決定時停下來：AI 要捨牌時先以決定性預演取得棄張，
//   若人類可能對此張反應（ron/peng/minggang/chi），則產生 expectation 並暫停，等人類下指令。
//   純規則判定（胡型/吃碰槓合法性）仍全部由核心（TurnManager.canWinOn / discard 內驗證）執行。
import { GameEngine } from '../mahjong/GameEngine.js';
import { ScriptedProvider } from '../mahjong/ai/ScriptedProvider.js';
import { nextSeat } from '../mahjong/MahjongRules.js';
import { kindIndex, parseKey, keyOf } from '../mahjong/Tile.js';

const WIND_LABELS = ['東', '南', '西', '北'];

const MAX_AI_STEPS = 2000;

export class GameEngineAdapter {
  constructor(opts = {}) {
    this.humanSeat = opts.humanSeat ?? 0;
    this.debug = !!opts.debug;
    // 政策性開關：autoTsumo/autoGang=true 時「摸到即自動胡/自動槓」（供自動化測試）；
    // 預設 false → 本 Phase 改成互動確認（win_confirm / gang_confirm）。
    this.autoTsumo = !!opts.autoTsumo;
    this.autoGang = !!opts.autoGang;

    this._pending = { discard: null, reaction: null, win: null, gang: null };
    this._expectation = null; // { fromSeat, tile, options } | null
    this._pause = 'idle';     // 'draw' | 'discard' | 'reaction' | 'win_confirm' | 'gang_confirm' | ...
    this._drawPreview = null; // 真人「下次摸牌」結果（來自引擎 previewDraw，唯讀）
    this._declinedWin = false; // 真人已對下一次摸牌選擇「不胡」，勿再重複問

    this._humanProvider = new ScriptedProvider({
      onDiscard: () => {
        const t = this._pending.discard;
        this._pending.discard = null;
        return t;
      },
      onReaction: (ctx, options) => {
        const it = this._pending.reaction;
        if (!it) return { type: 'pass' };
        if (it.type === 'pass') {
          this._pending.reaction = null;
          return { type: 'pass' };
        }
        const offered = options.find((o) => o.type === it.type);
        if (!offered) return { type: 'pass' }; // 此呼叫未問此型別 → 不消耗，留給同張牌之後的呼叫
        this._pending.reaction = null;
        if (it.type === 'chi') return { type: 'chi', tile: ctx.tile, needKeys: offered.needKeys };
        return { type: it.type, tile: ctx.tile };
      },
      onWin: () => {
        // autoTsumo：自動胡；互動模式：讀真人已下達的胡/不胡決定（只消費一次）
        if (this.autoTsumo) return true;
        const d = this._pending.win;
        this._pending.win = null;
        return d === true;
      },
      onGang: (ctx, options) => {
        // autoGang：自動選第一項；互動模式：讀真人已下達的槓決定（只消費一次）
        if (this.autoGang && options.length > 0) return options[0];
        const g = this._pending.gang;
        if (!g || g === 'pass') return null;
        return options.find((o) => o.type === g.type && o.tile === g.tile) || null;
      }
    });

    const engineOpts = { ...opts };
    delete engineOpts.humanSeat;
    delete engineOpts.debug;
    delete engineOpts.autoTsumo;
    delete engineOpts.autoGang;
    engineOpts.players = this._buildPlayerList(opts.players);
    this.engine = GameEngine.createGame(engineOpts);
  }

  // 使用者可傳 players 清單（fixture/tests)；人類座位若無 provider/AI 則預設採用 adapter 的 provider
  _buildPlayerList(list) {
    const out = new Array(4).fill(null);
    if (Array.isArray(list)) {
      for (let i = 0; i < list.length; i++) {
        const cfg = list[i];
        if (cfg == null) continue;
        const seat = cfg.seat ?? i;
        // provider 實例（含 chooseDiscard 行為者）整包保留，避免展開丟失方法
        const entry =
          cfg && typeof cfg.chooseDiscard === 'function'
            ? { seat, name: cfg.name, provider: cfg }
            : { ...cfg, seat };
        out[seat] = entry;
      }
    }
    const cur = out[this.humanSeat];
    if (cur == null || (!cur.provider && !cur.ai)) {
      out[this.humanSeat] = { seat: this.humanSeat, type: 'human', name: '玩家', provider: this._humanProvider };
    }
    return out;
  }

  // ── 公共 getter ──────────────────────────
  getPhase() {
    return this.engine.phase;
  }

  getPlayers() {
    return this.getViewModel().players;
  }

  getCurrentPlayer() {
    const vm = this.getViewModel();
    return vm.players[vm.turn.currentSeat] || null;
  }

  getHand() {
    return this.getViewModel().hand;
  }

  getRiver() {
    return this.getViewModel().river;
  }

  // 人類目前可做的合法動作（own-turn 直接來自 TurnManager.getLegalActions；確認/非對局各依暫停點）
  getLegalActions() {
    const tm = this.engine.tm;
    if (!tm) return [];
    if (this._pause === 'win_confirm') return [{ type: 'win' }, { type: 'decline' }];
    if (this._pause === 'gang_confirm') {
      const gangs = (this._drawPreview && this._drawPreview.gangs) || [];
      return [...gangs.map((g) => ({ type: g.type, tile: g.tile })), { type: 'pass' }];
    }
    if (this.engine.phase === 'hand_end') return [{ type: 'settle' }];
    if (this.engine.phase === 'next_hand') return [{ type: 'next' }];
    if (this.engine.phase === 'match_end') return [{ type: 'reset' }];
    const ops = [...this._ownTurnActions(tm)];
    if (this._expectation) {
      for (const o of this._expectation.options) {
        if (!ops.some((x) => x.type === o.type)) ops.push({ ...o });
      }
    }
    return ops;
  }

  _ownTurnActions(tm) {
    if (this.engine.phase !== 'playing') return [];
    if (tm.currentSeat !== this.humanSeat) return [];
    return tm.getLegalActions(this.humanSeat).map((a) => ({ ...a }));
  }

  // ── 引擎驅動─────────────────────────────
  // 執行「不需要人類決定」的引擎步數，直到:
  //   1) 人類需要決定（draw / discard / reaction），或
  //   2) 本局完成（phase != playing）
  update() {
    this._advance();
    return this.getViewModel();
  }

  _advance() {
    const eng = this.engine;
    if (eng.phase !== 'playing') {
      // 非對局中：依對局階段給出對應互動指令（hand_end→結算；next_hand→下一局；match_end→重來）
      this._pause = this._pauseFromPhase(eng);
      this._expectation = null;
      return;
    }
    const tm = eng.tm;
    for (let i = 0; i < MAX_AI_STEPS; i++) {
      if (eng.phase !== 'playing') {
        this._pause = this._pauseFromPhase(eng);
        this._expectation = null;
        return;
      }
      const seat = tm.currentSeat;
      if (seat === this.humanSeat) {
        this._expectation = null;
        if (tm.state === 'waiting_draw') {
          // 摸牌前：先向真人預覽自摸／暗槓／加槓（引擎 previewDraw 唯讀、不變狀態）
          this._drawPreview = null;
          this._declinedWin = false;
          const preview = eng.tm.previewDraw(this.humanSeat);
          if (preview) {
            this._drawPreview = preview;
            if (!this.autoTsumo && preview.tsumo) {
              this._pause = 'win_confirm';
              return;
            }
            if (!this.autoGang && !preview.tsumo && preview.gangs.length) {
              this._pause = 'gang_confirm';
              return;
            }
          }
          this._pause = 'draw';
        } else if (tm.state === 'waiting_discard') this._pause = 'discard';
        else this._pause = 'hold';
        return;
      }
      if (tm.state === 'waiting_draw') {
        eng.step();
        continue;
      }
      if (tm.state === 'waiting_discard') {
        const tile = this._peekAiDiscard(seat);
        const opts = this._humanReactionOptions(seat, tile);
        if (opts.length) {
          this._expectation = { fromSeat: seat, tile, options: opts };
          this._pause = 'reaction';
          return;
        }
        eng.step();
        continue;
      }
      this._pause = 'hold';
      this._expectation = null;
      return;
    }
    this._pause = 'hold';
  }

  _pauseFromPhase(eng) {
    if (eng.phase === 'hand_end') return 'hand_end';
    if (eng.phase === 'next_hand') return 'next_hand';
    if (eng.phase === 'match_end') return 'match_end';
    return null; // idle / dealing / initializing
  }

  // 互動確認已全數決定後：真正執行人類摸牌（TM.draw 於同一引擎步內消費已下達之胡/槓決定）
  _commitDraw() {
    this.engine.step();
    this._drawPreview = null;
    return this.update();
  }

  // 決定性預演：對 AI 尚未實行的「即將捨牌」讀取其選擇（chooseDiscard 為純函式、不變動狀態）
  _peekAiDiscard(seat) {
    const eng = this.engine;
    const p = eng.players[seat];
    const hand = eng.tm.hands[seat];
    const ctx = {
      seat,
      river: eng.tm.river.map((e) => e.tile),
      turnNumber: eng.tm.turnNumber,
      dealerSeat: eng.tm.dealerSeat,
      roundWind: eng.tm.roundWind,
      renchan: eng.tm.renchan,
      wallRemaining: eng.tm.wall ? eng.tm.wall.remaining : null,
      discards: eng.tm.river.map((e) => e.tile)
    };
    return p.provider.chooseDiscard(ctx, hand) || null;
  }

  // 人類對某放棄張的反應候選（僅供 UI 顯示與暫停與否；合法性仍由 TM 強制）
  _humanReactionOptions(fromSeat, tile) {
    if (tile == null) return [];
    const eng = this.engine;
    const tm = eng.tm;
    const seat = this.humanSeat;
    const countedOnly = tm.hands[seat].counts();
    const count = countedOnly[kindIndex(tile)] || 0;
    const opts = [];
    if (count >= 2) opts.push({ type: 'peng', tile });
    if (count >= 3) opts.push({ type: 'minggang', tile });
    if (tm.canWinOn(seat, tile)) opts.push({ type: 'ron', tile });
    if (nextSeat(fromSeat) === seat) {
      const pairs = this._chiPairs(tile, countedOnly);
      if (pairs.length) opts.push({ type: 'chi', tile, needKeys: pairs[0] });
    }
    return opts;
  }

  // chi 可能張（以隱牌 counts 計算；核心 _chiPairsFor 於 discard 內做最終驗證）
  _chiPairs(tile, counts) {
    const t = parseKey(tile);
    if (!t || (t.suit !== 'm' && t.suit !== 'p' && t.suit !== 's')) return [];
    const r = t.rank;
    const s = t.suit;
    const idx = (a) => counts[kindIndex(`${a}${s}`)] || 0;
    const out = [];
    if (r >= 3 && idx(r - 2) >= 1 && idx(r - 1) >= 1) out.push([`${r - 2}${s}`, `${r - 1}${s}`]);
    if (r >= 2 && r <= 8 && idx(r - 1) >= 1 && idx(r + 1) >= 1) out.push([`${r - 1}${s}`, `${r + 1}${s}`]);
    if (r <= 7 && idx(r + 1) >= 1 && idx(r + 2) >= 1) out.push([`${r + 1}${s}`, `${r + 2}${s}`]);
    return out;
  }

  // ── 人類指令（command layer）────────────
  startHand() {
    this.engine.startHand();
    return this.update();
  }

  // 人類「摸牌」（waiting_draw 且無未決之自摸/槓確認時）
  draw() {
    if (this.engine.phase !== 'playing') throw new Error('cannot draw outside playing');
    if (this.engine.tm.currentSeat !== this.humanSeat) throw new Error('not human turn');
    if (this.engine.tm.state !== 'waiting_draw') throw new Error(`cannot draw in state ${this.engine.tm.state}`);
    if (this._pause === 'win_confirm' || this._pause === 'gang_confirm') {
      throw new Error('cannot draw: resolve win/gang confirmation first');
    }
    this.engine.step();
    return this.update();
  }

  // 人類捨牌（waiting_discard 時）；非法張由核心 tm.discard 拋錯
  discard(tile) {
    if (this.engine.phase !== 'playing') throw new Error('cannot discard outside playing');
    if (this.engine.tm.currentSeat !== this.humanSeat) throw new Error('not human turn');
    if (this.engine.tm.state !== 'waiting_discard') throw new Error(`cannot discard in state ${this.engine.tm.state}`);
    this._pending.discard = keyOf(tile);
    this.engine.step();
    return this.update();
  }

  // 期待反應（AI 棄張後暫停時）：type ∈ ron|peng|minggang|chi|pass
  react(type) {
    if (!this._expectation) throw new Error('no pending reaction to answer');
    if (type === 'pass') {
      this._pending.reaction = { type: 'pass' };
    } else {
      const offered = this._expectation.options.find((o) => o.type === type);
      if (!offered) throw new Error(`cannot ${type}: not among legal reaction options`);
      this._pending.reaction = { ...offered };
    }
    this._expectation = null;
    this.engine.step(); // 含 AI 捨牌 → TM 同步解析人類 provider 回應
    this._pending.reaction = null; // 清除未被消耗的期待（AI 已先胡/先碰等）
    return this.update();
  }

  pass() {
    return this.react('pass');
  }

  // 自摸確認（win_confirm pause）：ok=true 胡；ok=false 過（可能轉槓確認）
  winConfirm(ok) {
    if (this._pause !== 'win_confirm') throw new Error(`winConfirm only during win_confirm (pause=${this._pause})`);
    this._pending.win = !!ok;
    if (!ok) {
      this._declinedWin = true;
      const gangs = this._drawPreview && this._drawPreview.gangs ? this._drawPreview.gangs : [];
      if (!this.autoGang && gangs.length) {
        this._pause = 'gang_confirm';
        return this.getViewModel();
      }
    }
    return this._commitDraw();
  }

  // 摸後之暗槓/加槓確認（gang_confirm pause）：type=null｜'pass' → 不槓；否則限定於預覽之合法選項
  gangConfirm(type, tile) {
    if (this._pause !== 'gang_confirm') throw new Error(`gangConfirm only during gang_confirm (pause=${this._pause})`);
    if (type == null || type === 'pass') {
      this._pending.gang = null;
    } else {
      const gangs = this._drawPreview ? this._drawPreview.gangs : [];
      const offered = gangs.find((g) => g.type === type && (tile == null || g.tile === tile));
      if (!offered) throw new Error(`cannot gang ${type} ${tile || ''}: not among preview gangs`);
      this._pending.gang = { type: offered.type, tile: offered.tile };
    }
    return this._commitDraw();
  }

  // 結算本局（hand_end phase）→ next_hand | match_end
  settle() {
    if (this.engine.phase !== 'hand_end') throw new Error('settle only after hand ends');
    this.engine.endHand();
    return this.update();
  }

  // 開始下一局（next_hand phase）
  nextHand() {
    if (this.engine.phase !== 'next_hand') throw new Error('nextHand only in next_hand phase');
    this.engine.startHand();
    return this.update();
  }

  step() {
    this.engine.step();
    return this.update();
  }

  runUntilEnd() {
    this.engine.runUntilEnd();
    return this.getViewModel();
  }

  reset() {
    this.engine.reset();
    this._pending = { discard: null, reaction: null, win: null, gang: null };
    this._expectation = null;
    this._drawPreview = null;
    this._declinedWin = false;
    this._pause = 'none';
    return this.getViewModel();
  }

  // ── View Model（只讀、深複製；修改它不會污染引擎）────────────────
  getViewModel() {
    const eng = this.engine;
    const snap = eng.getSnapshot();
    const st = eng.getState();
    const dealerSeat = snap.match.dealerSeat;
    const turn = snap.hand
      ? { currentSeat: snap.hand.currentSeat, state: snap.hand.state, isHumanTurn: snap.hand.currentSeat === this.humanSeat }
      : { currentSeat: dealerSeat, state: null, isHumanTurn: false };
    const match = {
      mode: snap.match.mode,
      roundWind: snap.match.roundWind,
      roundWindLabel: WIND_LABELS[snap.match.roundWind % 4],
      roundIndex: snap.match.roundIndex,
      dealerSeat,
      dealerName: snap.players[dealerSeat] ? snap.players[dealerSeat].name : `P${dealerSeat}`,
      renchan: snap.match.renchan,
      startScore: snap.match.startScore,
      finished: snap.match.finished
    };
    const players = snap.players.map((p, seat) => {
      const s = st.scores[seat];
      const handData = snap.hand;
      const concealed = handData ? handData.concealed[seat] : [];
      const flowers = handData ? handData.flowers[seat] : [];
      const melds = handData ? handData.melds[seat] : [];
      return {
        seat,
        type: p.type,
        name: p.name,
        isHuman: seat === this.humanSeat,
        score: s,
        concealedTiles: seat === this.humanSeat ? concealed.slice() : null,
        concealedCount: concealed.length,
        flowers: flowers.slice(),
        melds: melds.map((m) => ({ type: m.type, tiles: m.tiles.slice(), concealed: !!m.concealed }))
      };
    });
    const river = {
      tiles: (snap.hand && snap.hand.river ? snap.hand.river : []).map((r) => ({
        seat: r.seat,
        tile: r.tile,
        turnNumber: r.turnNumber,
        firstDiscard: !!r.firstDiscard,
        riverBottom: !!r.riverBottom
      }))
    };
    const hr = snap.hand && snap.hand.handResult;
    const hand = snap.hand
      ? {
          wallRemaining: snap.hand.wallRemaining,
          handResult: hr
            ? { winType: hr.winType, winners: hr.winners.slice(), tile: hr.tile, discarderSeat: hr.discarderSeat, specialEvents: { ...hr.specialEvents } }
            : null
        }
      : { wallRemaining: null, handResult: null };
    // 結算資料只在「本局確定結束且未進入下一局」時提供（取自引擎 settlements 最後一筆，深複製）
    const settlements = snap.settlements || [];
    const settlement =
      eng.phase === 'settlement' || eng.phase === 'next_hand' || eng.phase === 'match_end'
        ? settlements.length
          ? settlements[settlements.length - 1]
          : null
        : null;
    const legalActions = this.getLegalActions();
    const promptPauses = ['draw', 'discard', 'reaction', 'win_confirm', 'gang_confirm', 'hand_end', 'next_hand', 'match_end'];
    return {
      version: 1,
      phase: eng.phase,
      turnState: turn.state,
      prompt: promptPauses.includes(this._pause) ? this._pause : null,
      pending:
        this._drawPreview && (this._pause === 'win_confirm' || this._pause === 'gang_confirm')
          ? {
              tile: this._drawPreview.tile,
              tsumo: !!this._drawPreview.tsumo,
              gangs: (this._drawPreview.gangs || []).map((g) => ({ ...g }))
            }
          : null,
      expectation: this._expectation
        ? { fromSeat: this._expectation.fromSeat, tile: this._expectation.tile, options: this._expectation.options.map((o) => ({ ...o })) }
        : null,
      match,
      players,
      turn: { ...turn, legalActions },
      river,
      hand,
      settlement,
      finalRanking: snap.match && snap.match.finalRanking ? snap.match.finalRanking.map((r) => ({ ...r })) : null,
      debug: this.debug ? { ...this._debugInfo() } : null
    };
  }

  _debugInfo() {
    const eng = this.engine;
    return {
      rawPhase: eng.phase,
      tmState: eng.tm ? eng.tm.state : null,
      currentSeat: eng.tm ? eng.tm.currentSeat : null,
      wallRemaining: eng.tm && eng.tm.wall ? eng.tm.wall.remaining : null,
      eventsTail: eng.tm ? eng.tm.events.slice(-5).map((e) => ({ type: e.type, seat: e.seat, tile: e.tile || null })) : [],
      legalActions: this.getLegalActions(),
      renchan: eng.session.renchan,
      seed: eng.seed
    };
  }
}