// CanvasLayout.js — Phase 14：Canvas 邏輯座標系與版面（只算位置、不含任何規則）
// 邏輯世界：1200 × 900。實際 canvas 依 view 尺寸縮放（letterbox），座標永遠以邏輯單位為準。
// 責任：座位/手牌/副露/花/河/牌牆/玩家名牌的位置。純函式、無引擎依賴。

export const LOGICAL_WIDTH = 1200;
export const LOGICAL_HEIGHT = 900;

export const TILE_W = 44;
export const TILE_H = 56;
export const TILE_GAP = 4;

export const BACK_W = 30;
export const BACK_H = 40;
export const BACK_GAP = 4;

export const MELD_W = 40;
export const MELD_H = 50;
export const MELD_GAP = 3;

export const RIVER_W = 30;
export const RIVER_H = 38;
export const RIVER_GAP = 4;

export const TABLE = { x: 340, y: 230, w: 520, h: 400 };

// 座位錨點（固定：0 下 / 1 右 / 2 上 / 3 左，不依名稱重排）
const PLATE = {
  0: { x: LOGICAL_WIDTH / 2 - 120, y: LOGICAL_HEIGHT - 64, w: 240, h: 48 },
  2: { x: LOGICAL_WIDTH / 2 - 120, y: 16, w: 240, h: 48 },
  1: { x: LOGICAL_WIDTH - 262, y: 92, w: 242, h: 48 },
  3: { x: 20, y: 92, w: 242, h: 48 }
};

const HAND_BASE = {
  0: { y: LOGICAL_HEIGHT - 16 - TILE_H }, // 下：整排牌面
  2: { y: 104 },                          // 上：整排背牌
  1: { x: LOGICAL_WIDTH - 16 - BACK_W },  // 右：直排背牌
  3: { x: 16 }                            // 左：直排背牌
};

function handCount(vm, seat, isHuman) {
  const p = vm.players && vm.players[seat];
  if (!p) return 0;
  return isHuman ? (p.concealedTiles || []).length : p.concealedCount || 0;
}

// 每張牌的矩形
function handRects(seat, n, isHuman) {
  const rects = [];
  if (seat === 0) {
    const step = TILE_W + TILE_GAP;
    const total = n * TILE_W + (n - 1) * TILE_GAP;
    const x0 = (LOGICAL_WIDTH - total) / 2;
    for (let i = 0; i < n; i++) rects.push({ x: x0 + i * step, y: HAND_BASE[0].y, w: TILE_W, h: TILE_H });
  } else if (seat === 2) {
    const step = BACK_W + BACK_GAP;
    const total = n * BACK_W + (n - 1) * BACK_GAP;
    const x0 = (LOGICAL_WIDTH - total) / 2;
    for (let i = 0; i < n; i++) rects.push({ x: x0 + i * step, y: HAND_BASE[2].y, w: BACK_W, h: BACK_H });
  } else if (seat === 1 || seat === 3) {
    const step = BACK_H + BACK_GAP;
    const x = HAND_BASE[seat].x;
    for (let i = 0; i < n; i++) rects.push({ x, y: 160 + i * step, w: BACK_W, h: BACK_H });
  }
  return rects;
}

// 副露：每組各一列（四張最寬 = 4*40+3*3 ≈ 169）；依錨點排成水平列或垂直堆疊
function meldRects(seat, meldCount) {
  const groups = [];
  for (let i = 0; i < meldCount; i++) {
    const tiles = [];
    const count = 4; // 槓 4 張最寬，其餘按實際張數（renderer 以 meld.tiles.length 繪）
    for (let j = 0; j < count; j++) tiles.push(null); // 位置由 renderer 依張數填
    let group = null;
    if (seat === 0) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      group = { labelPos: { x: 40 + col * 180, y: 660 + row * 56, w: 170, h: 14 }, tiles };
    } else if (seat === 2) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      group = { labelPos: { x: 40 + col * 180, y: 168 + row * 56, w: 170, h: 14 }, tiles };
    } else if (seat === 1) {
      group = { labelPos: { x: LOGICAL_WIDTH - 16 - BACK_W - 8 - 170, y: 160 + i * 54, w: 170, h: 14 }, tiles };
    } else {
      group = { labelPos: { x: 16 + BACK_W + 8, y: 160 + i * 54, w: 170, h: 14 }, tiles };
    }
    groups.push(group);
  }
  return groups;
}

function flowerRects(seat, flowerCount, isHuman) {
  const rects = [];
  if (!isHuman) return rects; // AI 花只在名牌顯示數量
  for (let i = 0; i < flowerCount; i++) {
    rects.push({ x: 40 + i * (RIVER_W + RIVER_GAP), y: 786, w: RIVER_W, h: RIVER_H });
  }
  return rects;
}

function riverRects(seat, count) {
  const rects = [];
  for (let i = 0; i < count; i++) {
    if (seat === 0) rects.push({ x: TABLE.x + 16 + i * (RIVER_W + RIVER_GAP), y: TABLE.y + TABLE.h - RIVER_H - 8, w: RIVER_W, h: RIVER_H });
    else if (seat === 2) rects.push({ x: TABLE.x + 16 + i * (RIVER_W + RIVER_GAP), y: TABLE.y + 8, w: RIVER_W, h: RIVER_H });
    else if (seat === 1) rects.push({ x: TABLE.x + TABLE.w - RIVER_W - 8, y: TABLE.y + 16 + i * (RIVER_H + RIVER_GAP), w: RIVER_W, h: RIVER_H });
    else rects.push({ x: TABLE.x + 8, y: TABLE.y + 16 + i * (RIVER_H + RIVER_GAP), w: RIVER_W, h: RIVER_H });
  }
  return rects;
}

// 計算版面；viewW/viewH 為 canvas 的 CSS pixel 尺寸（含 DPR 前的邏輯視窗）
export function computeLayout(vm, viewW, viewH) {
  const W = LOGICAL_WIDTH;
  const H = LOGICAL_HEIGHT;
  const scale = Math.min(viewW / W, viewH / H);
  const ox = (viewW - W * scale) / 2;
  const oy = (viewH - H * scale) / 2;

  const players = vm.players || [];
  const human = players.find((p) => p.isHuman) || players[0] || { seat: 0 };
  const humanSeat = human.seat;

  const out = {
    world: { w: W, h: H },
    view: { w: viewW, h: viewH },
    scale,
    ox,
    oy,
    table: { ...TABLE },
    humanSeat,
    seat: {},
    wall: null
  };

  for (let seat = 0; seat < 4; seat++) {
    const p = players[seat];
    const isHuman = seat === humanSeat;
    const n = handCount(vm, seat, isHuman);
    const meldCount = p ? (p.melds || []).length : 0;
    const flowerCount = p ? (p.flowers || []).length : 0;
    out.seat[seat] = {
      seat,
      isHuman,
      playerPos: { ...PLATE[seat] },
      hand: handRects(seat, n, isHuman),
      melds: meldRects(seat, meldCount).map((g) => ({ ...g, labelPos: { ...g.labelPos } })),
      flowers: flowerRects(seat, flowerCount, isHuman),
      river: riverRects(seat, vm.river && vm.river.tiles ? vm.river.tiles.filter((r) => r.seat === seat).length : 0)
    };
  }

  out.wall = {
    x: LOGICAL_WIDTH / 2 - 90,
    y: LOGICAL_HEIGHT / 2 + 40,
    w: 180,
    h: 80,
    count: vm.hand ? vm.hand.wallRemaining : null
  };

  return out;
}

// 把 canvas 的 CSS 座標轉成邏輯座標（供 hit-test）
export function toLogical(layout, cssX, cssY) {
  return { x: (cssX - layout.ox) / layout.scale, y: (cssY - layout.oy) / layout.scale };
}
