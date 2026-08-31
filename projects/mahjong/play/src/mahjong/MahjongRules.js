// MahjongRules.js — 台灣 16 張麻將的規則常數與靜態工具
// 座位模型：
//   0 下（莊家/東）  1 右（南）  2 上（西）  3 左（北）
//   回合順序 0→1→2→3（逆時針）；上家 = 前一順位。
//   發牌/補花順序同回合順序（數位牌牆模型一致）。

import { keyOf } from './Tile.js';
import { isGang } from './Meld.js';

export const PLAYER_COUNT = 4;
export const HAND_TILES = 16; // 手牌張數
export const WIN_TILES = 17;  // 胡牌張數（5 面子 + 1 將）
export const MELD_SET_COUNT = 5; // 面子數

export const WIND_SEATS = ['東', '南', '西', '北'];

// 上家（餵吃者）
export function prevSeat(seat) {
  return (seat + PLAYER_COUNT - 1) % PLAYER_COUNT;
}

// 下家
export function nextSeat(seat) {
  return (seat + 1) % PLAYER_COUNT;
}

// 對家
export function acrossSeat(seat) {
  return (seat + 2) % PLAYER_COUNT;
}

// 局風（圈風）index：0 東 / 1 南 / 2 西 / 3 北
// 門風 offset：0=東(莊) 1=南 2=西 3=北
export function seatWindIndex(dealerSeat, playerSeat) {
  return ((playerSeat - dealerSeat + PLAYER_COUNT) % PLAYER_COUNT);
}

export function seatWindName(dealerSeat, playerSeat) {
  return WIND_SEATS[seatWindIndex(dealerSeat, playerSeat)];
}

export function roundWindName(roundWind) {
  return WIND_SEATS[roundWind % 4];
}

// 正花：東(春,梅) 南(夏,蘭) 西(秋,竹) 北(冬,菊)
// 花牌 f1..f4 = 春夏秋冬，f5..f8 = 梅蘭竹菊
export function isProperFlower(flowerKey, dealerSeat, playerSeat) {
  const wind = seatWindIndex(dealerSeat, playerSeat); // 0..3
  const f = keyOf(flowerKey);
  if (f.startsWith('f')) {
    const n = Number(f.slice(1));
    // n 1..4 季節, 5..8 花種
    const season = n <= 4 ? n - 1 : n - 5;
    return ((season % 4) + 4) % 4 === wind;
  }
  return false;
}

// 花槓：春夏秋冬（f1-f4）或 梅蘭竹菊（f5-f8）
export function flowerKangCount(flowers) {
  let count = 0;
  const has = (a, b, c, d) => flowers.includes(a) && flowers.includes(b) && flowers.includes(c) && flowers.includes(d);
  if (has('f1', 'f2', 'f3', 'f4')) count += 1;
  if (has('f5', 'f6', 'f7', 'f8')) count += 1;
  return count;
}

// 八仙過海：八張全齊
export function hasAllEightFlowers(flowers) {
  if (flowers.length < 8) return false;
  return ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'].every((k) => flowers.includes(k));
}

// 七搶一候選：七張花，缺一張；回傳缺的那張花 key（可能二擇），否則 null
export function missingFlowerForSeven(flowers) {
  const all = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];
  const missing = all.filter((k) => !flowers.includes(k));
  if (flowers.length !== 7 || missing.length !== 1) return null;
  return missing[0];
}

// 台型的優先權常數（胡 > 槓/碰 > 吃）
export const CLAIM_PRIORITY = {
  win: 3,
  kang: 2,
  peng: 2,
  chi: 1,
  pass: 0
};

// 檢查某一玩家是否為莊家
export function isDealer(dealerSeat, playerSeat) {
  return dealerSeat === playerSeat;
}

// 莊家台：無連莊 1 台；連 n 次 = 2n+1
export function dealerTai(renchanCount) {
  return 2 * (renchanCount || 0) + 1;
}

// 副露總槓數
export function countGangs(melds) {
  return melds.filter(isGang).length;
}

// 是否可以「加槓」：回傳可加槓的 key 列表
export function jiaGangCandidates(handTiles, melds) {
  const result = [];
  const counts = {};
  for (const k of handTiles) counts[keyOf(k)] = (counts[keyOf(k)] || 0) + 1;
  for (const m of melds) {
    if (m.type === 'peng' && counts[m.tiles[0]] >= 1) {
      result.push(m.tiles[0]);
    }
  }
  return result;
}