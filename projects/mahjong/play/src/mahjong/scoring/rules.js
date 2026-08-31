// rules.js — 台灣 16 張麻將台數表（docs/規則來源與決策.md B 節；E 節 Q1-Q13 已確認）
// 每個規則可獨立測試。

import { isChiMeld, isKnutMeld, isConcealedTriplet } from '../Meld.js';
import { seatWindIndex, flowerKangCount, isProperFlower } from '../MahjongRules.js';
import { scoringRule } from './ScoringRule.js';
import { specialWinRule } from './SpecialWinRule.js';

const at = (d, i) => d.fullCounts[i] || 0;

// 字牌 idx：27=東 28=南 29=西 30=北 31=中 32=發 33=白
const windAt = (d, w) => at(d, 27 + w);   // w 0..3
const dragonAt = (d, k) => at(d, 30 + k); // k 1..3（1=中 2=發 3=白）

function dragonTripletKinds(d) {
  let n = 0;
  for (let k = 1; k <= 3; k++) if (dragonAt(d, k) >= 3) n += 1;
  return n;
}

function dragonPairKinds(d) {
  let n = 0;
  for (let k = 1; k <= 3; k++) if (dragonAt(d, k) >= 2) n += 1;
  return n;
}

function windTripletKinds(d) {
  let n = 0;
  for (let w = 0; w < 4; w++) if (windAt(d, w) >= 3) n += 1;
  return n;
}

function windPairKinds(d) {
  let n = 0;
  for (let w = 0; w < 4; w++) if (windAt(d, w) >= 2) n += 1;
  return n;
}

function countProperFlowers(d) {
  return d.flowers.filter((k) => isProperFlower(k, d.dealerSeat, d.seat)).length;
}

// 平胡：全順子、將非字、無刻（副露皆吃）、無花、非自摸、非獨聽
function isPinghu(d) {
  if (!d.arrangement) return false;
  if (!d.arrangement.melds.every((m) => m.type === 'shun')) return false;
  if (d.arrangement.pairIndex >= 27) return false;
  if (d.melds.some((m) => !isChiMeld(m))) return false;
  if (d.winBy !== 'ron') return false;
  if (d.singleWait) return false;
  if (d.flowers.length > 0) return false;
  return true;
}

export const RULES = [
  scoringRule('dealer', '莊家', (d) => 2 * (d.renchan || 0) + 1, (d) => d.seat === d.dealerSeat),
  scoringRule('quanfeng', '圈風牌', 1, (d) => windAt(d, d.roundWind) >= 2),
  scoringRule('menfeng', '風位牌', 1, (d) => windAt(d, seatWindIndex(d.dealerSeat, d.seat)) >= 2),
  scoringRule('zhenghua', '正花', (d) => countProperFlowers(d), (d) => countProperFlowers(d) > 0),
  scoringRule('huagang', '花槓', (d) => flowerKangCount(d.flowers), (d) => flowerKangCount(d.flowers) > 0),
  scoringRule('zimo', '自摸', 1, (d) => d.winBy === 'tsumo'),
  scoringRule('menqing', '門清', 1, (d) => d.meldCount === 0),
  scoringRule('menqing_zimo', '門清自摸', 3, (d) => d.winBy === 'tsumo' && d.meldCount === 0),
  scoringRule('pinghu', '平胡', 2, isPinghu),
  scoringRule('sanyuan', '三元牌', (d) => dragonTripletKinds(d), (d) => dragonTripletKinds(d) > 0), // 已確認 Q1：僅刻/槓，中發白每種各 1 台
  scoringRule('san_anke', '三暗刻', 2, (d) => d.concealedTriplets >= 3),
  scoringRule('si_anke', '四暗刻', 5, (d) => d.concealedTriplets >= 4),
  scoringRule('wu_anke', '五暗刻', 8, (d) => d.concealedTriplets >= 5),
  scoringRule('pengpeng_hu', '碰碰胡', 4, (d) => d.pengpeng),
  scoringRule('hun_yise', '混一色', 4, (d) => d.suitSet.size === 1 && d.honorCount > 0),
  scoringRule('qing_yise', '清一色', 8, (d) => d.suitSet.size === 1 && d.honorCount === 0),
  scoringRule('zi_yise', '字一色', 8, (d) => d.suitSet.size === 0 && d.honorCount > 0),
  scoringRule('xiao_sanyuan', '小三元', 4, (d) => dragonTripletKinds(d) >= 2 && dragonPairKinds(d) >= 3),
  scoringRule('da_sanyuan', '大三元', 8, (d) => dragonTripletKinds(d) === 3),
  scoringRule('xiao_sixi', '小四喜', 8, (d) => windTripletKinds(d) >= 3 && windPairKinds(d) >= 4), // 已確認 Q9：不疊圈/門風
  scoringRule('da_sixi', '大四喜', 16, (d) => windTripletKinds(d) === 4),
  scoringRule('duiting', '獨聽', 1, (d) => d.singleWait),
  scoringRule('quanqiuren', '全求人', 1, (d) => d.meldCount === 4 && d.singleWait && d.winBy === 'ron'), // 已確認 Q7：4 副露＋單吊＋非自摸
  scoringRule('hedi', '河底撈魚', 1, (d) => !!d.events.hedi),
  scoringRule('haidi', '海底撈月', 1, (d) => !!d.events.haidi),
  scoringRule('qianggang', '搶槓', 1, (d) => !!d.events.qianggang),
  scoringRule('gangshang_zimo', '槓上自摸', 2, (d) => !!d.events.gangshangZimo),
  specialWinRule('qiqiangyi', '七搶一', 8, 'qiqiangyi'),
  specialWinRule('baxian', '八仙過海', 8, 'baxian'),
  specialWinRule('diting', '地聽', 8, 'diting'),
  specialWinRule('dihu', '地胡', 16, 'dihu'),
  specialWinRule('renhu', '人胡', 8, 'renhu'),
  specialWinRule('tianhu', '天胡', 24, 'tianhu')
];

export function ruleById(id) {
  return RULES.find((r) => r.id === id) || null;
}

// 供 ScoringEngine 共用（避免重複 import）
export { isConcealedTriplet, isKnutMeld };