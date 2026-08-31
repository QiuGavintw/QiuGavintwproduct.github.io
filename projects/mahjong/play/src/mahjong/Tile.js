// Tile.js — 台灣麻將牌定義與工具
// 牌型 key 規則：
//   萬 1m..9m、筒 1p..9p、條 1s..9s
//   字 z1(東) z2(南) z3(西) z4(北) z5(中) z6(發) z7(白)
//   花 f1(春) f2(夏) f3(秋) f4(冬) f5(梅) f6(蘭) f7(竹) f8(菊)

export const SUITS = {
  m: '萬',
  p: '筒',
  s: '條',
  z: '字',
  f: '花'
};

export const WIND_TILES = ['z1', 'z2', 'z3', 'z4'];
export const DRAGON_TILES = ['z5', 'z6', 'z7'];

// 34 種基本牌 index（不含花）
export const NUM_KINDS = 34;

// 字牌名稱
const Z_NAMES = ['東', '南', '西', '北', '中', '發', '白'];
// 花牌名稱
const F_NAMES = ['春', '夏', '秋', '冬', '梅', '蘭', '竹', '菊'];

export const NAME_MAP = {
  m: ['一', '二', '三', '四', '五', '六', '七', '八', '九'],
  p: ['一', '二', '三', '四', '五', '六', '七', '八', '九'],
  s: ['一', '二', '三', '四', '五', '六', '七', '八', '九']
};

export function keyOf(tile) {
  if (typeof tile === 'string') return tile;
  if (tile == null) return null;
  const s = tile.suit;
  if (s === 'm' || s === 'p' || s === 's') return `${tile.rank}${s}`;
  if (s === 'z') return `z${tile.rank}`;
  if (s === 'f') return `f${tile.rank}`;
  throw new Error(`unknown tile suit: ${String(s)}`);
}

export function parseKey(key) {
  if (key == null) return null;
  const s = String(key);
  const last = s[s.length - 1];
  if (last === 'm' || last === 'p' || last === 's') {
    return { suit: last, rank: Number(s.slice(0, s.length - 1)) };
  }
  // 字 / 花：花色在前，例如 z1（東） f1（春）
  const first = s[0];
  if (first === 'z' || first === 'f') {
    return { suit: first, rank: Number(s.slice(1)) };
  }
  throw new Error(`unknown tile key: ${s}`);
}

// 34 種基本牌的 index（0..33），花牌回傳 -1
export function kindIndex(key) {
  const t = parseKey(key);
  if (!t) return -1;
  switch (t.suit) {
    case 'm': return t.rank - 1;
    case 'p': return 9 + t.rank - 1;
    case 's': return 18 + t.rank - 1;
    case 'z': return 27 + t.rank - 1;
    default: return -1;
  }
}

export function keyFromIndex(idx) {
  if (idx < 0 || idx >= NUM_KINDS) throw new Error(`bad kind index ${idx}`);
  if (idx < 9) return `${idx + 1}m`;
  if (idx < 18) return `${idx - 8}p`;
  if (idx < 27) return `${idx - 17}s`;
  return `z${idx - 26}`;
}

export function fullName(key) {
  const t = parseKey(key);
  if (!t) return '?';
  if (t.suit === 'z') return Z_NAMES[t.rank - 1];
  if (t.suit === 'f') return F_NAMES[t.rank - 1];
  return `${NAME_MAP[t.suit][t.rank - 1]}${SUITS[t.suit]}`;
}

export function shortName(key) {
  const t = parseKey(key);
  if (!t) return '?';
  if (t.suit === 'z') return Z_NAMES[t.rank - 1];
  if (t.suit === 'f') return F_NAMES[t.rank - 1];
  return `${t.rank}${SUITS[t.suit]}`;
}

export function isFlower(key) {
  const t = parseKey(key);
  return !!t && t.suit === 'f';
}

export function isHonor(key) {
  const t = parseKey(key);
  return !!t && t.suit === 'z';
}

export function isWind(key) {
  const t = parseKey(key);
  return !!t && t.suit === 'z' && t.rank >= 1 && t.rank <= 4;
}

export function isDragon(key) {
  const t = parseKey(key);
  return !!t && t.suit === 'z' && t.rank >= 5 && t.rank <= 7;
}

export function isTerminal(key) {
  const t = parseKey(key);
  return !!t && (t.suit === 'm' || t.suit === 'p' || t.suit === 's') && (t.rank === 1 || t.rank === 9);
}

export function isSuited(key) {
  const t = parseKey(key);
  return !!t && (t.suit === 'm' || t.suit === 'p' || t.suit === 's');
}

// 排序權重：萬 < 筒 < 條 < 字 < 花
export function sortOrder(key) {
  const t = parseKey(key);
  switch (t.suit) {
    case 'm': return t.rank;
    case 'p': return 10 + t.rank;
    case 's': return 20 + t.rank;
    case 'z': return 30 + t.rank;
    case 'f': return 40 + t.rank;
    default: return 99;
  }
}

export function compare(a, b) {
  return sortOrder(keyOf(a)) - sortOrder(keyOf(b));
}

// 風位 index（0=東 1=南 2=西 3=北）對應的字牌 key
export function windKey(seatWindIndex) {
  return WIND_TILES[((seatWindIndex % 4) + 4) % 4];
}

// 單張牌名稱（含數量字，用於提示/日誌）
export function tileLabel(key, count) {
  const name = fullName(key);
  if (count > 1) return `${name}×${count}`;
  return name;
}