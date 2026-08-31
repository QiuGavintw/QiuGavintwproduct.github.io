// SpecialWinEngine.js — 特殊事件引擎
// 供應 ScoringEngine 的 ctx.events（天胡/地胡/人胡/地聽/海底/河底/搶槓/槓上自摸/七搶一/八仙），
// 並管理「過水」狀態。
// Phase 8：detectEvents(snapshot) 依 TurnManager.buildSnapshot() 的快照（事件日誌＋河流＋花牌＋手牌結果）
// 推導本局出現的特殊事件，為「不重複計台」的單一事實來源；本引擎不負責計台（那屬 ScoringEngine）。
// 偵測規則（含決策）：
//   - 天胡：莊家配牌即胡（handResult 為 tsumo、贏家=莊家、且無任何抽牌 event）
//   - 人胡：莊家首打即被榮胡（被胡捨牌 firstDiscard 且放槍者=莊家）〔沿用 TurnManager 語意〕
//   - 地胡：閒家「首摸自摸」（tsumo、非莊家、drewCount=1、且非槓後補牌）〔沿用 TurnManager 語意，
//        大重開発紀錄：L2 測試已固定此語意；§八之「首打即胡」不採納以免與人胡測試衝突〕
//   - 地聽：贏家已宣告地聽且未破聽（drewCount 與副露數皆未變動）
//   - 海底：贏家以「正常摸牌」（source='normal'）摸到最後一張而自摸（seaBottom 記號已觸發）
//        → 槓後補牌/補花替代之有效摸牌不算海底（避免與槓上自摸雙計；亦符合「補花後不錯判」）
//   - 河底：榮胡且被胡捨牌為河底（riverBottom）
//   - 搶槓：榮胡但被胡張從未進入河流（加槓牌未入河）→ 依 TurnManager 真實事件判斷
//   - 槓上自摸：贏家最後一次有效摸牌來源為 'gang-replacement'，
//       或為 'flower-replacement' 且其前一張抽牌（當次槓補到花）來源為 'gang-replacement'
//   - 七搶一：有玩家持 7 花、缺的那張在他家（missingFlowerForSeven）
//   - 八仙：有玩家持滿 8 花（hasAllEightFlowers）
//   - 無 天聽（Q13 已確認不設此台型）
//   七搶一/八仙 由花牌狀態直接判定（花不入手；特殊胡以花牌為準，與 handResult 無關）。
// 事件只回傳「出現」的事件；永不重複（單一 seat 一種 type 至多一個）。

import { hasAllEightFlowers, missingFlowerForSeven } from '../MahjongRules.js';

// ---- 搶槓範圍（已確認 Q11）：僅明槓／加槓可搶，暗槓不得搶 ----
export const GANG_WIN_ROBBABLE = Object.freeze(['minggang', 'jiagang']);

export function canRobGang(meld) {
  if (!meld) return false;
  return GANG_WIN_ROBBABLE.includes(meld.type);
}

// ---- 過水（已確認 Q10）：宣布不放胡後，在「再次摸牌」或「自己捨牌」前不得胡同一張 ----
// pass(tile)/passWin(tile)：記錄對某張（key）過水；canWin(tile)：該張當下可否胡（其他張不受影響）。
// onDraw()（再次摸牌）或 onDiscard()（自己捨牌）任一發生即解除全部過水限制。
export class PassingState {
  constructor() {
    this._blocked = new Set();
  }

  pass(tile) {
    this._blocked.add(tile);
  }

  // §19 別名：pass 與 passWin 等效
  passWin(tile) {
    this.pass(tile);
  }

  canWin(tile) {
    return !this._blocked.has(tile);
  }

  onDraw() {
    this._blocked.clear();
  }

  onDiscard() {
    this._blocked.clear();
  }

  get hasPass() {
    return this._blocked.size > 0;
  }
}

// ---- Phase 8：特殊事件引擎（管理全桌過水＋由快照偵測特殊事件）----
export class SpecialWinEngine {
  constructor() {
    // 每位玩家一個過水狀態；TurnManager 直接引用 passing（相容既有 tm.passing API）
    this.passing = [0, 1, 2, 3].map(() => new PassingState());
  }

  // 過水對某張宣告不放胡（§19：passWin）
  passWin(seat, tile) {
    this.passing[seat].passWin(tile);
  }

  canWin(seat, tile) {
    return this.passing[seat].canWin(tile);
  }

  // 該玩家再次摸牌 → 解除過水
  onDraw(seat) {
    this.passing[seat].onDraw();
  }

  // 該玩家自己捨牌 → 解除過水
  onDiscard(seat) {
    this.passing[seat].onDiscard();
  }

  // 重置該玩家過水（新局開始/測試用）
  resetPassing(seat) {
    this.passing[seat] = new PassingState();
  }

  canRobGang(meld) {
    return canRobGang(meld);
  }

  // 依 TurnManager.buildSnapshot() 快照推導本局特殊事件（已確認 Q1–Q13，不含天聽）
  detectEvents(snapshot) {
    const events = [];
    const log = snapshot.events || [];
    const river = snapshot.river || [];
    const hr = snapshot.handResult || {};
    const winners = hr.winners || [];
    const dealerSeat = snapshot.dealerSeat;
    const drewCount = snapshot.drewCount || [];
    const declared = snapshot.declaredDiting || [];
    const ditingDrew = snapshot.ditingDrewCount || [];
    const ditingMeld = snapshot.ditingMeldCount || [];
    const melds = snapshot.melds || [];
    const flowers = snapshot.flowers || [];

    const drawEvents = log.filter((e) => e.type === 'draw');
    const hasSeaBottom = log.some((e) => e.type === 'seaBottom');

    // 贏家最後一次「有效摸牌」的 draw event
    const lastDrawBy = (seat) => {
      let last = null;
      for (const e of log) {
        if (e.type === 'draw' && e.seat === seat) last = e;
      }
      return last;
    };

    // 該 seat 最近連續抽牌事件（含補花過程的抽出）；用於判斷「槓後補牌 → 再補花」鏈
    const drawsOf = (seat) => drawEvents.filter((e) => e.seat === seat);

    // 是否為槓後補牌（最終有效摸牌來自 gang-replacement，或花替代但緊接前張來自槓）
    const isGangFlow = (seat) => {
      const ds = drawsOf(seat);
      const last = ds[ds.length - 1];
      if (!last) return false;
      if (last.source === 'gang-replacement') return true;
      if (last.source === 'flower-replacement' && ds.length >= 2) {
        return ds[ds.length - 2].source === 'gang-replacement';
      }
      return false;
    };

    // 被胡的捨牌記錄（榮胡且入河）
    const winDiscard = hr.winType === 'ron' && hr.tile != null
      ? river.find((r) => r.seat === hr.discarderSeat && String(r.tile) === String(hr.tile)) || null
      : null;

    for (const w of winners) {
      if (hr.winType === 'tsumo') {
        // 天胡：莊家配牌即胡（整局無任何抽牌）
        if (w === dealerSeat && drawEvents.length === 0) {
          events.push({ type: 'tianhu', seat: w });
          continue;
        }
        // 地胡：閒家首摸自摸（第一張有效摸牌，非槓後）
        if (w !== dealerSeat && drewCount[w] === 1 && !isGangFlow(w)) {
          events.push({ type: 'dihu', seat: w });
        }
        // 海底：最後一張由「正常摸牌」摸到而自摸
        const lastDraw = lastDrawBy(w);
        if (hasSeaBottom && lastDraw && lastDraw.source === 'normal') {
          events.push({ type: 'haidi', seat: w });
        }
        // 槓上自摸：最終有效摸牌來自槓後補牌
        if (isGangFlow(w)) {
          events.push({ type: 'gangshangZimo', seat: w });
        }
      } else if (hr.winType === 'ron') {
        // 人胡：莊家首打即被榮胡
        if (winDiscard && winDiscard.firstDiscard && hr.discarderSeat === dealerSeat) {
          events.push({ type: 'renhu', seat: w });
        }
        // 河底：榮胡的是河底捨牌
        if (winDiscard && winDiscard.riverBottom) {
          events.push({ type: 'hedi', seat: w });
        }
        // 搶槓：榮胡但被胡張從未入河（被搶的加槓牌不產生 discard event）
        if (!winDiscard) {
          events.push({ type: 'qianggang', seat: w });
        }
      }
      // 地聽：已宣告且未破聽（摸牌數與副露數皆與宣告時相同）
      if (declared[w] && drewCount[w] === ditingDrew[w] && (melds[w] || []).length === ditingMeld[w]) {
        events.push({ type: 'diting', seat: w });
      }
    }

    // 花牌特殊胡（與胡牌結果無關，以全桌花牌狀態判定）
    for (let p = 0; p < 4; p++) {
      const f = flowers[p] || [];
      if (hasAllEightFlowers(f)) {
        events.push({ type: 'baxian', seat: p });
        continue;
      }
      const missing = missingFlowerForSeven(f);
      if (missing && flowers.some((ff, q) => q !== p && ff.includes(missing))) {
        events.push({ type: 'qiqiangyi', seat: p });
      }
    }

    return { events };
  }
}

// 事件清單 → ScoringEngine ctx.events 用的 map（type → {seat}）
export function eventsToMap(events) {
  const m = {};
  for (const ev of events) {
    m[ev.type] = { seat: ev.seat };
  }
  return m;
}