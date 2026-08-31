// visualEvents.js — Phase 15：以「前一 VM vs 新 VM」差異產生視覺動畫事件
// 動畫事件來源 = 既有 ViewModel 資料（新增為唯讀 additive：不動核心語意）。
// AI 真牌絕不進入 timeline：AI 摸牌/暗槓一律 tileKey=null（背牌）。
import { tileMove, seatTurn, winHighlight, highlightPulse, wallFlash, ANIMATION_DURATIONS, withMotion } from './animationPresets.js';

const D = ANIMATION_DURATIONS;

function fallbackRect() {
  return { x: 40, y: 40, w: 30, h: 40 };
}

function wallSourceRect(layout) {
  const w = layout.wall;
  return { x: w.x + w.w - 54, y: w.y + w.h - 56, w: 44, h: 56 };
}

function handStartRect(layout, seat) {
  const rects = layout.seat[seat].hand;
  return rects && rects.length ? { ...rects[0] } : fallbackRect();
}

function handEndRect(layout, seat) {
  const rects = layout.seat[seat].hand;
  if (rects && rects.length) return { ...rects[rects.length - 1] };
  return fallbackRect();
}

function riverRectAt(layout, seat, indexWithinSeat) {
  const rects = layout.seat[seat].river;
  return rects && rects[indexWithinSeat] ? { ...rects[indexWithinSeat] } : fallbackRect();
}

function meldGroupRect(layout, seat, meldIndex) {
  const g = layout.seat[seat].melds[meldIndex];
  const lp = g ? g.labelPos : fallbackRect();
  return { x: lp.x, y: lp.y + 18, w: 170, h: 50 };
}

function meldTileRect(layout, seat, meldIndex, tileIndex) {
  const g = layout.seat[seat].melds[meldIndex];
  const lp = g ? g.labelPos : fallbackRect();
  return { x: lp.x + tileIndex * 43, y: lp.y + 18, w: 40, h: 50 };
}

function flowerRectAt(layout, seat, index) {
  const rects = layout.seat[seat].flowers;
  return rects && rects[index] ? { ...rects[index] } : fallbackRect();
}

function seatPlateRect(layout, seat) {
  return { ...layout.seat[seat].playerPos };
}

// 產生 timeline 佇列（sequential）。opts: { humanSeat, motionScale }
export function buildTimelines(prev, next, layout, opts = {}) {
  const { humanSeat = 0, motionScale = 1 } = opts;
  const list = [];
  if (!prev || !next) return list;
  const sc = (base) => withMotion(base, motionScale);

  const prevHand = prev.hand;
  const nextHand = next.hand;
  const playing = next.phase === 'playing';

  // 1) 回合切換
  if (prev.turn && next.turn && next.turn.currentSeat != null && prev.turn.currentSeat !== next.turn.currentSeat) {
    list.push(seatTurn({ seat: next.turn.currentSeat, fromSeat: prev.turn.currentSeat, duration: sc(D.turn) }));
  }

  // 2) 河牌新增（公開資訊）：AI 先背牌摸入，再捨牌移動；最後一張 highlight
  const prevRiver = prev.river && prev.river.tiles ? prev.river.tiles : [];
  const nextRiver = next.river && next.river.tiles ? next.river.tiles : [];
  const seatCounters = {};
  let lastDiscard = null;
  for (let i = prevRiver.length; i < nextRiver.length; i++) {
    const r = nextRiver[i];
    const idx = seatCounters[r.seat] || 0;
    seatCounters[r.seat] = idx + 1;
    if (r.seat !== humanSeat) {
      // AI 摸牌（背牌）：牌牆 → AI 手牌區
      list.push(tileMove({ from: wallSourceRect(layout), to: handEndRect(layout, r.seat), tileKey: null, face: false, duration: sc(D.draw) }));
    }
    const fromHand = handStartRect(layout, r.seat);
    const toRiver = riverRectAt(layout, r.seat, idx);
    list.push(tileMove({ from: fromHand, to: toRiver, tileKey: r.tile, face: true, duration: sc(D.discard) }));
    lastDiscard = { rect: toRiver };
  }
  if (lastDiscard) list.push(highlightPulse({ rect: lastDiscard.rect, duration: sc(D.highlight) }));

  // 3) 真人摸牌（手牌變多 → 牌面由牌牆移入手牌尾端）
  if (playing && prevHand && nextHand && next.players && next.players[humanSeat]) {
    const prevLen = prev.players[humanSeat].concealedTiles ? prev.players[humanSeat].concealedTiles.length : 0;
    const nextTiles = next.players[humanSeat].concealedTiles || [];
    if (nextTiles.length > prevLen) {
      list.push(
        tileMove({
          from: wallSourceRect(layout),
          to: handEndRect(layout, humanSeat),
          tileKey: nextTiles[nextTiles.length - 1],
          face: true,
          duration: sc(D.draw)
        })
      );
    }
  }

  // 4) 副露新增（type 由 VM meld.type；暗槓一律背牌）
  if (prev.players && next.players) {
    for (let seat = 0; seat < 4; seat++) {
      const pm = prev.players[seat] ? prev.players[seat].melds || [] : [];
      const nm = next.players[seat] ? next.players[seat].melds || [] : [];
      if (nm.length > pm.length) {
        for (let i = pm.length; i < nm.length; i++) {
          const meld = nm[i];
          const concealed = meld.type === 'angang';
          const from = handStartRect(layout, seat);
          for (let t = 0; t < meld.tiles.length; t++) {
            list.push(
              tileMove({
                from,
                to: meldTileRect(layout, seat, i, t),
                tileKey: concealed ? null : meld.tiles[t],
                face: !concealed,
                duration: sc(D.meld)
              })
            );
          }
          list.push(highlightPulse({ rect: meldGroupRect(layout, seat, i), duration: sc(D.highlight) }));
        }
      }
    }
  }

  // 5) 花牌（真人）：手牌 → 花區，接著補牌動畫
  if (prev.players && next.players && next.players[humanSeat] && prev.players[humanSeat]) {
    const pf = prev.players[humanSeat].flowers || [];
    const nf = next.players[humanSeat].flowers || [];
    for (let i = pf.length; i < nf.length; i++) {
      const key = nf[i];
      list.push(tileMove({ from: handStartRect(layout, humanSeat), to: flowerRectAt(layout, humanSeat, i), tileKey: key, face: true, duration: sc(D.flower) }));
      // 補牌
      const tiles = next.players[humanSeat].concealedTiles || [];
      if (tiles.length) {
        list.push(tileMove({ from: wallSourceRect(layout), to: handEndRect(layout, humanSeat), tileKey: tiles[tiles.length - 1], face: true, duration: sc(D.draw) }));
      }
    }
  }

  // 6) 胡牌：勝者 highlight（一炮多響依 winners）
  const prevResult = prevHand && prevHand.handResult;
  const nextResult = nextHand && nextHand.handResult;
  if (!prevResult && nextResult && nextResult.winners && nextResult.winners.length) {
    list.push(winHighlight({ seats: nextResult.winners, duration: sc(D.win) }));
    if (nextResult.winType === 'ron' && nextResult.tile) {
      // 榮胡：在河中找到該張做 highlight
      const river = next.river && next.river.tiles ? next.river.tiles : [];
      const entry = river.filter((r) => r.tile === nextResult.tile).pop();
      if (entry) {
        const seatIdx = river.filter((r) => r.seat === entry.seat).indexOf(entry);
        list.push(highlightPulse({ rect: riverRectAt(layout, entry.seat, seatIdx), duration: sc(D.highlight) }));
      }
    }
  }

  // 7) 牌牆剩餘更新
  if (prevHand && nextHand && prevHand.wallRemaining != null && nextHand.wallRemaining != null && prevHand.wallRemaining !== nextHand.wallRemaining) {
    list.push(wallFlash({ duration: sc(D.wall) }));
  }

  return list;
}
