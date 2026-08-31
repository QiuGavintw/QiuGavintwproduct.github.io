// Wall.js — 牌牆：組牌、洗牌、開門、發牌、摸牌、補牌（花/槓）
// 模型：
//   tiles[]   整副牌的發牌順序（由骰子「開門」後決定起點）。
//   pos       正常摸牌的下一步游標（前段）。
//   reserveEnd 王牌區尾端游標：補花/槓補由此向前取。
// 流局條件：pos 推進到 reserveStart（王牌區起點）時無牌可摸。

import { keyOf, parseKey, isFlower } from './Tile.js';

const TILE_KINDS = [];
for (let r = 1; r <= 9; r++) {
  TILE_KINDS.push(`${r}m`, `${r}p`, `${r}s`);
}
TILE_KINDS.push('z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7');
const FLOWER_KINDS = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];

// 產生整副牌（有花 144 / 無花 136）
export function buildTileset(withFlowers = true) {
  const tiles = [];
  let id = 0;
  for (const kind of TILE_KINDS) {
    const t = parseKey(kind);
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ id: id++, suit: t.suit, rank: t.rank });
    }
  }
  if (withFlowers) {
    for (const kind of FLOWER_KINDS) {
      const t = parseKey(kind);
      tiles.push({ id: id++, suit: t.suit, rank: t.rank });
    }
  }
  return tiles;
}

export function countsByKey(tiles) {
  const counts = {};
  for (const t of tiles) counts[keyOf(t)] = (counts[keyOf(t)] || 0) + 1;
  return counts;
}

// 王牌區（補牌區）張數：有花時保留最後 16 張，流局判定的邊界
export function reserveSize(withFlowers) {
  return withFlowers ? 16 : 8;
}

export class Wall {
  constructor(withFlowers = true) {
    this.withFlowers = withFlowers;
    this.tiles = buildTileset(withFlowers);
    this.pos = 0;
    this.reserveStart = this.tiles.length - reserveSize(withFlowers);
    this.reserveEnd = this.tiles.length - 1; // 從唯一尾端向前取補牌
    this.shuffled = false;
  }

  shuffle(rng) {
    this.tiles = rng.shuffle(this.tiles);
    this.pos = 0;
    this.reserveStart = this.tiles.length - reserveSize(this.withFlowers);
    this.reserveEnd = this.tiles.length - 1;
    this.shuffled = true;
    return this;
  }

  // 開門：重新對齊牌牆，使 pos 從「起手叠堆」開始。
  // openingIndex 為骰子決定後的第一叠索引 → 設為起點（正常摸牌方向逆時針往前）。
  openAt(openingOffset) {
    if (!this.shuffled) throw new Error('wall not shuffled yet');
    // openingOffset：從原 tiles[0] 起的偏移。開門後 pos 重設為該偏移。
    const offset = ((openingOffset % this.tiles.length) + this.tiles.length) % this.tiles.length;
    this.tiles = this.tiles.slice(offset).concat(this.tiles.slice(0, offset));
    this.pos = 0;
    this.reserveStart = this.tiles.length - reserveSize(this.withFlowers);
    this.reserveEnd = this.tiles.length - 1;
    return this;
  }

  // 剩餘可正常摸的張數（不含王牌區）
  get remaining() {
    return Math.max(0, this.reserveStart - this.pos);
  }

  get isEmpty() {
    return this.remaining <= 0;
  }

  // 正常摸牌；無牌回傳 null
  draw() {
    if (this.isEmpty) return null;
    const tile = this.tiles[this.pos];
    this.pos += 1;
    return tile;
  }

  // 補牌（花補 / 槓補）：由王牌區尾端向內取；無牌回傳 null
  drawReplacement() {
    if (this.reserveEnd < this.reserveStart) return null;
    const tile = this.tiles[this.reserveEnd];
    this.reserveEnd -= 1;
    return tile;
  }

  // 供存檔序列化
  saveState() {
    return {
      withFlowers: this.withFlowers,
      tiles: this.tiles.map(keyOf),
      pos: this.pos,
      reserveStart: this.reserveStart,
      reserveEnd: this.reserveEnd
    };
  }

  loadState(state) {
    this.withFlowers = state.withFlowers;
    this.tiles = state.tiles.map((k) => parseKey(k));
    this.pos = state.pos;
    this.reserveStart = state.reserveStart;
    this.reserveEnd = state.reserveEnd;
    this.shuffled = true;
    return this;
  }

  peekFront(count = 1) {
    return this.tiles.slice(this.pos, this.pos + count);
  }

  // 唯讀預覽（Phase 13）：下一次 draw()（含補花鏈）實際獲得之「有效牌」；不變動任何狀態。
  // 回傳 { tile, empty, flowers }：flower 鏈中每耗一張花都 +1；牌牆已空或補不到牌時 empty=true。
  peekEffectiveDraw() {
    if (this.isEmpty) return { tile: null, empty: true, flowers: 0 };
    let idx = this.pos;
    let resEnd = this.reserveEnd;
    let flowers = 0;
    let guard = 0;
    while (guard++ < 200) {
      if (idx >= this.tiles.length) return { tile: null, empty: true, flowers };
      const key = keyOf(this.tiles[idx]);
      if (!isFlower(key)) return { tile: key, empty: false, flowers };
      flowers += 1;
      if (resEnd < this.reserveStart) return { tile: null, empty: true, flowers };
      idx = resEnd;
      resEnd -= 1;
    }
    return { tile: null, empty: true, flowers };
  }

  // 檢查 tile 是否為花（補花流程用）
  static isFlowerTile(tile) {
    return isFlower(keyOf(tile));
  }
}