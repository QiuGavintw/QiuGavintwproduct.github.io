// TurnManager.js — Phase 4：玩家回合狀態機＋吃碰槓流程（純流程規則引擎）
// 負責：摸牌（花自動補、連續補到非花）、出牌、吃(僅上家)/碰/明槓/暗槓/加槓、
//       胡牌（自摸/放槍/一炮多響/搶槓）、海底河底、流局、過水整合、特殊事件旗標。
// 不依賴任何 AI／UI；動作選擇一律透過 decisionProvider 介面。
// 座位模型沿用 MahjongRules：0→1→2→3 逆時針。

import { keyOf, parseKey, isFlower, kindIndex, keyFromIndex } from './Tile.js';
import { nextSeat, PLAYER_COUNT } from './MahjongRules.js';
import { canFormWin } from './WinChecker.js';
import { SpecialWinEngine } from './special/SpecialWinEngine.js';

// 單一字串狀態（不使用 boolean 組合）
export const TURN_STATES = Object.freeze([
  'waiting',
  'waiting_draw',        // 輪到此玩家摸牌
  'drawing',             // 摸牌流程進行中
  'waiting_discard',     // 輪到此玩家出牌（莊家首打/摸牌後/吃碰槓後）
  'resolving_reactions', // 出牌後解析其他人反應（胡/碰/槓/吃）
  'resolving_gang',      // 暗槓/加槓流程進行中
  'hand_end'             // 一局結束（胡牌/流局）
]);

// 預設 provider：只回應目前合理可選的動作，否則 pass（最保守的「純規則」行為）
export const DEFAULT_PROVIDER = Object.freeze({
  chooseWin: () => false,
  chooseDiscard: (ctx, hand) => hand.keys()[0],
  chooseGang: () => null,
  chooseReaction: (ctx, options) =>
    options.find((o) => o.type === 'ron') ||
    options.find((o) => o.type === 'minggang') ||
    options.find((o) => o.type === 'peng') ||
    options.find((o) => o.type === 'chi') ||
    { type: 'pass' }
});

export class TurnManager {
  constructor({ wall, hands, dealerSeat = 0, renchan = 0, roundWind = 0, round = 0, provider = DEFAULT_PROVIDER } = {}) {
    this.wall = wall;
    this.hands = hands;
    this.dealerSeat = dealerSeat;
    this.renchan = renchan;
    this.roundWind = roundWind;
    this.round = round;
    // 合併後不得凍結：外部（AI/測試）可能於 run 之間更換 provider 的行為
    this.provider = { ...DEFAULT_PROVIDER, ...provider };
    this.state = 'waiting';
    this.currentSeat = dealerSeat;
    this.turnNumber = 0;
    this.events = [];
    this.river = [];
    // Phase 8：特殊事件引擎統一管理全桌過水；passing 即引擎內部狀態（相容既有 tm.passing API）
    this.special = new SpecialWinEngine();
    this.passing = this.special.passing;
    this.declaredDiting = [false, false, false, false];
    this.ditingLockedHand = [null, null, null, null];
    this.ditingDrewCount = [0, 0, 0, 0];
    this.ditingMeldCount = [0, 0, 0, 0];
    this.handResult = null;
    this.seaBottom = false;
    this._pendingRiverBottomSeat = null;
    this.drewCount = [0, 0, 0, 0];
    this._justGangDrew = false;
  }

  // 開始一局：莊家先檢查「天胡」（配牌 17 張即胡，規則自動成立）
  start() {
    if (this.state !== 'waiting') throw new Error(`game already started (state: ${this.state})`);
    this.events.push({
      type: 'deal',
      dealerSeat: this.dealerSeat,
      renchan: this.renchan,
      roundWind: this.roundWind,
      round: this.round
    });
    this.currentSeat = this.dealerSeat;
    this.turnNumber = 1;
    this.state = 'waiting_discard';
    const dealerHand = this.hands[this.dealerSeat];
    if (canFormWin(dealerHand.counts(), dealerHand.melds.length)) {
      this._finishWin({
        winType: 'tsumo',
        winners: [this.dealerSeat],
        tile: null,
        discarderSeat: null,
        flags: { tianhu: true }
      });
    }
    return this;
  }

  flowerCounts(seat) {
    return this.hands[seat].flowers.length;
  }

  // 手牌已含該張（摸牌後／槓後補牌）是否自模成立
  _wonInHand(seat) {
    const hand = this.hands[seat];
    return canFormWin(hand.counts(), hand.melds.length);
  }

  // 手牌（隱牌）＋某張牌是否形胡
  _canWinWith(seat, tileKey) {
    const hand = this.hands[seat];
    const counts = hand.counts();
    const ki = kindIndex(tileKey);
    if (ki < 0 || counts[ki] >= 4) return false;
    counts[ki] += 1;
    return canFormWin(counts, hand.melds.length);
  }

  // 公開 API：判斷某玩家可否胡某張（含過水限制）
  canWinOn(seat, tileKey) {
    if (!this.special.canWin(seat, tileKey)) return false;
    return this._canWinWith(seat, tileKey);
  }

  // 摸牌＋補花＋自摸／暗槓／加槓判定
  draw() {
    if (this.state === 'hand_end') {
      throw new Error('cannot draw after hand ended (state=hand_end)');
    }
    if (this.state !== 'waiting_draw') {
      throw new Error(`cannot draw in state ${this.state} (seat ${this.currentSeat} does not draw yet)`);
    }
    const seat = this.currentSeat;
    this.state = 'drawing';
    const first = this.wall.draw();
    if (first == null) {
      this._flow();
      return;
    }
    let tile = first;
    let source = 'normal';
    while (isFlower(keyOf(tile))) {
      this.events.push({ type: 'draw', seat, tile: keyOf(tile), source, turnNumber: this.turnNumber });
      this.hands[seat].addFlower(keyOf(tile));
      this.events.push({ type: 'flower', seat, tile: keyOf(tile), turnNumber: this.turnNumber });
      const rep = this.wall.drawReplacement();
      if (rep == null) {
        this._flow();
        return;
      }
      tile = rep;
      source = 'flower-replacement';
    }
    this.events.push({ type: 'draw', seat, tile: keyOf(tile), source, turnNumber: this.turnNumber });
    this.hands[seat].addTile(keyOf(tile));
    this.drewCount[seat] += 1;
    this._justGangDrew = false;
    this.special.onDraw(seat); // 過水解除：再次摸牌
    this._markSeaBottom(seat);
    if (this._wonInHand(seat)) {
      const yes = this.provider.chooseWin({ seat, tile: keyOf(tile), winType: 'tsumo', turnNumber: this.turnNumber });
      if (yes) {
        this._finishWin({
          winType: 'tsumo',
          winners: [seat],
          tile: keyOf(tile),
          discarderSeat: null,
          flags: {
            // 海底僅限「最後一張由正常摸牌摸到」之自摸；槓後/補花替代之有效摸牌另計槓上自摸
            haidi: this.seaBottom && source === 'normal',
            dihu: seat !== this.dealerSeat && this.drewCount[seat] === 1 && !this._justGangDrew,
            diting: this._ditingIntact(seat)
          }
        });
        return;
      }
    }
    this._gangLoop(seat);
    if (this.state !== 'hand_end') this.state = 'waiting_discard';
  }

  // 出牌；若有合適吃碰槓則先解析，胡者（可能多響）直接結束本局
  discard(tile) {
    if (this.state === 'hand_end') {
      throw new Error('cannot discard after hand ended (state=hand_end)');
    }
    if (this.state !== 'waiting_discard') {
      throw new Error(`cannot discard in state ${this.state}: seat ${this.currentSeat} must draw a tile first`);
    }
    const seat = this.currentSeat;
    const hand = this.hands[seat];
    if (!hand.hasTile(tile, 1)) {
      throw new Error(`cannot discard: seat ${seat} does not hold ${keyOf(tile)}`);
    }
    hand.removeTile(tile);
    this.special.onDiscard(seat); // 過水解除：自己捨牌
    const entry = {
      seat,
      riverIndex: this.river.length,
      turnNumber: this.turnNumber,
      tile: keyOf(tile),
      firstDiscard: this.turnNumber === 1 && seat === this.dealerSeat,
      riverBottom: this._pendingRiverBottomSeat === seat
    };
    this.events.push({
      type: 'discard',
      seat,
      tile: entry.tile,
      turnNumber: entry.turnNumber,
      riverIndex: entry.riverIndex,
      firstDiscard: entry.firstDiscard,
      riverBottom: entry.riverBottom
    });
    this.river.push(entry);
    this.state = 'resolving_reactions';
    this._resolveReactions(seat, entry);
    if (this.state === 'hand_end') return;
    if (this.state === 'waiting_discard') return; // 吃碰槓已成立，控制權交給槓/碰者
    if (entry.riverBottom) {
      this._flow(); // 河底無人胡 → 流局
      return;
    }
    this._advanceTurn();
  }

  // 宣告地聽：鎖定此刻手牌；之後再摸牌或副露即破聽（失去旗標）
  declareDiting(seat) {
    if (this.turnNumber > 8) throw new Error('declareDiting: only within the first 8 turns');
    if (this.hands[seat].melds.length > 0) throw new Error('declareDiting: player already has melds');
    if (this.declaredDiting[seat]) throw new Error('declareDiting: already declared');
    this.declaredDiting[seat] = true;
    this.ditingLockedHand[seat] = this.hands[seat].keys();
    this.ditingDrewCount[seat] = this.drewCount[seat];
    this.ditingMeldCount[seat] = this.hands[seat].melds.length;
    this.events.push({ type: 'diting', seat, turnNumber: this.turnNumber });
    return this.ditingLockedHand[seat];
  }

  // 目前狀態下某玩家可做的合法動作（供 UI/AI 提示用）
  getLegalActions(seat) {
    if (seat !== this.currentSeat || this.state === 'hand_end') return [];
    if (this.state === 'waiting_draw') return [{ type: 'draw' }];
    if (this.state === 'waiting_discard') {
      const actions = this.hands[seat].keys().map((k) => ({ type: 'discard', tile: k }));
      for (const g of this._selfGangOptions(seat)) actions.push({ type: g.type, tile: g.tile });
      return actions;
    }
    return [];
  }

  // ── 內部：優先權解析（胡 > 槓/碰 > 吃；同層以離放槍者近者先）──
  _resolveReactions(discarderSeat, entry) {
    const tile = entry.tile;
    const order = this._orderFrom(discarderSeat);

    // ① 胡：詢問所有可胡者（支援一炮多響）
    const winners = [];
    for (const s of order) {
      if (!this.canWinOn(s, tile)) continue;
      const resp = this.provider.chooseReaction(
        { seat: s, discarderSeat, tile, turnNumber: this.turnNumber },
        [{ type: 'ron', tile }]
      );
      if (resp && resp.type === 'ron') {
        winners.push(s);
      } else {
        this.special.passWin(s, tile); // 過水：同一張暫時不能胡
      }
    }
    if (winners.length) {
      this._finishWin({
        winType: 'ron',
        winners,
        tile,
        discarderSeat,
        flags: {
          renhu: entry.firstDiscard,
          hedi: entry.riverBottom,
          diting: winners.some((w) => this._ditingIntact(w))
        }
      });
      return;
    }

    // ② 碰/明槓（優先於吃；依座位序詢問，直到有人執行）
    for (const s of order) {
      const opts = [];
      if (this._canMinggang(s, tile)) opts.push({ type: 'minggang', tile });
      if (this._canPeng(s, tile)) opts.push({ type: 'peng', tile });
      const resp = this.provider.chooseReaction(
        { seat: s, discarderSeat, tile, turnNumber: this.turnNumber },
        opts
      );
      if (!resp || resp.type === 'pass') continue;
      if (!opts.some((o) => o.type === resp.type)) {
        throw new Error(`cannot ${resp.type}: seat ${s} has no ${resp.type} option for ${tile}`);
      }
      if (resp.type === 'minggang') {
        this.hands[s].doMinggang(tile, discarderSeat);
        const meld = this.hands[s].melds[this.hands[s].melds.length - 1];
        this._removeFromRiver(entry);
        this.events.push({ type: 'minggang', seat: s, tile, from: discarderSeat, meld, turnNumber: this.turnNumber });
        this._claimTurn(s);
        this._afterGang(s); // 明槓後補牌，可能槓上自摸／連槓
      } else {
        this.hands[s].doPeng(tile, discarderSeat);
        const meld = this.hands[s].melds[this.hands[s].melds.length - 1];
        this._removeFromRiver(entry);
        this.events.push({ type: 'peng', seat: s, tile, from: discarderSeat, meld, turnNumber: this.turnNumber });
        this._claimTurn(s);
      }
      return;
    }

    // ③ 吃：僅上家（餵牌者的下家）
    const chiSeat = nextSeat(discarderSeat);
    const chiPairs = this._chiPairsFor(chiSeat, tile);
    if (chiPairs.length) {
      const needKeys = chiPairs[0];
      const resp = this.provider.chooseReaction(
        { seat: chiSeat, discarderSeat, tile, turnNumber: this.turnNumber },
        [{ type: 'chi', tile, needKeys }]
      );
      if (resp && resp.type === 'chi') {
        this.hands[chiSeat].doChi(tile, needKeys);
        const meld = this.hands[chiSeat].melds[this.hands[chiSeat].melds.length - 1];
        this._removeFromRiver(entry);
        this.events.push({ type: 'chi', seat: chiSeat, fromSeat: discarderSeat, tile, meld, turnNumber: this.turnNumber });
        this._claimTurn(chiSeat);
        return;
      }
      if (resp && resp.type !== 'pass') {
        throw new Error(`cannot ${resp.type}: seat ${chiSeat} has no ${resp.type} option for ${tile}`);
      }
    }
  }

  // 暗槓／加槓流程（摸牌後）：確認選項 → 槓後補牌 → 可能連槓／槓上自摸／搶槓
  _gangLoop(seat) {
    while (true) {
      const choice = this._askGang(seat);
      if (!choice) break;
      if (choice.type === 'angang') {
        this.hands[seat].doAngang(choice.tile);
        this._pendingRiverBottomSeat = null; // 槓牌後遊戲繼續，非河底
        // 暗槓資訊隱藏：事件不揭露牌面
        this.events.push({ type: 'angang', seat, concealed: true, turnNumber: this.turnNumber });
      } else if (choice.type === 'jiagang') {
        const robbed = this._attemptJiaGang(seat, choice.tile);
        if (robbed === 'robbed') return; // 已被搶槓 → 進入 hand_end
      } else {
        throw new Error(`cannot ${choice.type || 'gang'}: unknown gang type for seat ${seat}`);
      }
      this._gangReplacement(seat);
      if (this.state === 'hand_end') return;
    }
  }

  // 槓已成立（明槓反應）後：補牌 → 自摸判定 → 可能再連槓
  _afterGang(seat) {
    this._gangReplacement(seat);
    if (this.state === 'hand_end') return;
    this._gangLoop(seat);
  }

  _askGang(seat) {
    const opts = this._selfGangOptions(seat);
    const choice = this.provider.chooseGang({ seat, turnNumber: this.turnNumber }, opts);
    if (choice == null) return null;
    if (!opts.some((o) => o.type === choice.type && o.tile === choice.tile)) {
      throw new Error(`cannot ${choice.type}: seat ${seat} has no such gang option (tile ${choice.tile})`);
    }
    return choice;
  }

  _selfGangOptions(seat, counts = null) {
    const hand = this.hands[seat];
    const c = counts || hand.counts();
    const opts = [];
    for (let i = 0; i < 34; i++) {
      if (c[i] >= 4) opts.push({ type: 'angang', tile: keyFromIndex(i) });
    }
    for (const m of hand.melds) {
      if (m.type === 'peng' && c[kindIndex(m.tiles[0])] >= 1) {
        opts.push({ type: 'jiagang', tile: keyOf(m.tiles[0]) });
      }
    }
    return opts;
  }

  // 唯讀預覽（Phase 13）：seat 於 waiting_draw 時「下一次 draw() 的結果」；不變動任何狀態。
  // 回傳 { tile, tsumo, gangs:[{type,tile}] }；牌牆已空（會流局）時回傳 null。
  // 供 UI 在「真正摸牌前」向真人確認自摸／暗槓／加槓（合法性判定仍留在本引擎）。
  previewDraw(seat) {
    const p = this.wall.peekEffectiveDraw();
    if (!p || p.empty || p.tile == null) return null;
    const hand = this.hands[seat];
    const counts = hand.counts();
    const ki = kindIndex(p.tile);
    if (counts[ki] < 4) counts[ki] += 1; // 摸到即加回手牌（副本，不影響真實手牌）
    return {
      tile: p.tile,
      tsumo: canFormWin(counts, hand.melds.length),
      gangs: this._selfGangOptions(seat, counts)
    };
  }

  // 加槓：先檢查有無人可搶（GANG_WIN_ROBBABLE 含 jiagang）；被搶則回滾並視為放槍
  _attemptJiaGang(seat, key) {
    const hand = this.hands[seat];
    const meld = hand.meldTripletOf(key);
    if (!meld || meld.type !== 'peng') {
      throw new Error(`cannot jiagang: seat ${seat} has no peng meld of ${key}`);
    }
    const robbers = this._orderFrom(seat).filter((s) => this.canWinOn(s, key));
    if (robbers.length) {
      this._finishWin({
        winType: 'ron',
        winners: [robbers[0]],
        tile: key,
        discarderSeat: seat,
        flags: { qianggang: true }
      });
      return 'robbed';
    }
    // 無人搶槓 → 正式加槓（碰組升格，第四張離手）
    this._pendingRiverBottomSeat = null; // 加槓後遊戲繼續，非河底
    hand.removeTile(key);
    meld.type = 'jiagang';
    meld.tiles.push(key);
    meld.concealed = false;
    this.events.push({ type: 'jiagang', seat, tile: key, meld, turnNumber: this.turnNumber });
    return 'ok';
  }

  // 槓後補牌：由王牌區補一張，遇花繼續補，並檢查槓上自摸
  _gangReplacement(seat) {
    const first = this.wall.drawReplacement();
    if (first == null) {
      this._flow();
      return;
    }
    let tile = first;
    let source = 'gang-replacement';
    while (isFlower(keyOf(tile))) {
      this.events.push({ type: 'draw', seat, tile: keyOf(tile), source, turnNumber: this.turnNumber });
      this.hands[seat].addFlower(keyOf(tile));
      this.events.push({ type: 'flower', seat, tile: keyOf(tile), turnNumber: this.turnNumber });
      const rep = this.wall.drawReplacement();
      if (rep == null) {
        this._flow();
        return;
      }
      tile = rep;
      source = 'flower-replacement';
    }
    this.events.push({ type: 'draw', seat, tile: keyOf(tile), source, turnNumber: this.turnNumber });
    this.hands[seat].addTile(keyOf(tile));
    this.drewCount[seat] += 1;
    this._justGangDrew = true;
    this.special.onDraw(seat);
    this._markSeaBottom(seat);
    if (this._wonInHand(seat)) {
      const yes = this.provider.chooseWin({ seat, tile: keyOf(tile), winType: 'tsumo', turnNumber: this.turnNumber });
      if (yes) {
        this._finishWin({
          winType: 'tsumo',
          winners: [seat],
          tile: keyOf(tile),
          discarderSeat: null,
          // 槓後補牌自摸一律計「槓上自摸」，不計海底（Q8 互斥由 ScoringEngine 處理）
          flags: { gangshangZimo: true, haidi: false, diting: this._ditingIntact(seat) }
        });
      }
    }
  }

  _chiPairsFor(seat, tile) {
    const t = parseKey(tile);
    if (!t || (t.suit !== 'm' && t.suit !== 'p' && t.suit !== 's')) return [];
    const r = t.rank;
    const s = t.suit;
    const hand = this.hands[seat];
    const has = (a, b) => hand.hasTile(a, 1) && hand.hasTile(b, 1);
    const pairs = [];
    if (r >= 3 && has(`${r - 2}${s}`, `${r - 1}${s}`)) pairs.push([`${r - 2}${s}`, `${r - 1}${s}`]);
    if (r >= 2 && r <= 8 && has(`${r - 1}${s}`, `${r + 1}${s}`)) pairs.push([`${r - 1}${s}`, `${r + 1}${s}`]);
    if (r <= 7 && has(`${r + 1}${s}`, `${r + 2}${s}`)) pairs.push([`${r + 1}${s}`, `${r + 2}${s}`]);
    return pairs;
  }

  _canPeng(seat, tile) {
    return this.hands[seat].hasTile(tile, 2);
  }

  _canMinggang(seat, tile) {
    return this.hands[seat].hasTile(tile, 3);
  }

  _orderFrom(seat) {
    return [1, 2, 3].map((k) => (seat + k) % PLAYER_COUNT);
  }

  _claimTurn(seat) {
    this._pendingRiverBottomSeat = null; // 吃碰槓成立 → 該捨牌不為河底
    this.currentSeat = seat;
    this.turnNumber += 1;
    this.state = 'waiting_discard';
  }

  _advanceTurn() {
    this.currentSeat = nextSeat(this.currentSeat);
    this.turnNumber += 1;
    this.state = 'waiting_draw';
  }

  _removeFromRiver(entry) {
    const idx = this.river.indexOf(entry);
    if (idx >= 0) this.river.splice(idx, 1);
  }

  _markSeaBottom(seat) {
    if (this.wall.isEmpty && !this.seaBottom) {
      this.seaBottom = true;
      this._pendingRiverBottomSeat = seat;
      this.events.push({ type: 'seaBottom', turnNumber: this.turnNumber });
    }
  }

  _ditingIntact(seat) {
    if (!this.declaredDiting[seat]) return false;
    return this.drewCount[seat] === this.ditingDrewCount[seat]
      && this.hands[seat].melds.length === this.ditingMeldCount[seat];
  }

  _finishWin({ winType, winners, tile, discarderSeat, flags = {} }) {
    this.state = 'hand_end';
    const specialEvents = {
      tianhu: !!flags.tianhu,
      dihu: !!flags.dihu,
      renhu: !!flags.renhu,
      gangshangZimo: !!flags.gangshangZimo,
      qianggang: !!flags.qianggang,
      haidi: !!flags.haidi,
      hedi: !!flags.hedi,
      diting: !!flags.diting
    };
    this.handResult = {
      winType,
      winners: [...winners].sort(),
      tile: tile == null ? null : keyOf(tile),
      discarderSeat: discarderSeat == null ? null : discarderSeat,
      specialEvents
    };
    this.events.push({ type: 'handEnd', result: 'win', handResult: this.handResult });
  }

  _flow() {
    this.state = 'hand_end';
    this.handResult = { winType: 'flow', winners: [], tile: null, discarderSeat: null, specialEvents: {} };
    this.events.push({ type: 'handEnd', result: 'draw', handResult: this.handResult });
  }

  // Phase 8：提供 SpecialWinEngine.detectEvents 所需的完整牌局快照（唯讀資料）
  buildSnapshot() {
    return {
      events: this.events.map((e) => ({ ...e })),
      river: this.river.map((r) => ({ ...r })),
      dealerSeat: this.dealerSeat,
      currentSeat: this.currentSeat,
      turnNumber: this.turnNumber,
      state: this.state,
      round: this.round,
      roundWind: this.roundWind,
      renchan: this.renchan,
      handResult: this.handResult
        ? { ...this.handResult, specialEvents: { ...this.handResult.specialEvents } }
        : null,
      drewCount: [...this.drewCount],
      declaredDiting: [...this.declaredDiting],
      ditingDrewCount: [...this.ditingDrewCount],
      ditingMeldCount: [...this.ditingMeldCount],
      flowers: this.hands.map((h) => h.flowers.slice()),
      melds: this.hands.map((h) => h.melds.map((m) => ({ ...m, tiles: m.tiles.slice() }))),
      concealed: this.hands.map((h) => h.keys()),
      wallRemaining: this.wall.remaining
    };
  }
}