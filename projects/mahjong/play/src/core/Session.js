// Session.js — 一整個對戰的排程：圈風、莊家、連莊、局數、終局
// 局數 / 圈風模型（依使用者規格）：
//   mode: one = 1 局　east = 東圈四局　hanso = 東+南(8局)
//          circle/jiang = 東南西北(16局)
//   每 4 局推進一圈風：東→南→西→北。
//   莊家胡牌或流局 → 連莊（renchan+1）；其他人胡 → 下莊（下家做莊，renchan=0）。

import { nextSeat } from '../mahjong/MahjongRules.js';

export const MODE_ONE = 'one';
export const MODE_EAST = 'east';
export const MODE_HANSO = 'hanso';
export const MODE_CIRCLE = 'circle';
export const MODE_JIANG = 'jiang';

export const MODE_LABELS = {
  [MODE_ONE]: '1 局',
  [MODE_EAST]: '東風',
  [MODE_HANSO]: '半莊',
  [MODE_CIRCLE]: '一圈',
  [MODE_JIANG]: '一將'
};

export function targetRoundsForMode(mode) {
  switch (mode) {
    case MODE_ONE: return 1;
    case MODE_EAST: return 4;
    case MODE_HANSO: return 8;
    case MODE_CIRCLE: return 16;
    case MODE_JIANG: return 16;
    default: throw new Error(`unknown mode: ${mode}`);
  }
}

export class Session {
  constructor(opts = {}) {
    this.mode = opts.mode || MODE_EAST;
    this.withFlowers = opts.withFlowers !== false;
    this.startScore = opts.startScore ?? 25000;
    this.scores = [this.startScore, this.startScore, this.startScore, this.startScore];
    this.dealerSeat = opts.dealerSeat ?? 0;
    this.renchan = 0;
    this.roundIndex = 0; // 總局數（0-based）
    this.results = [];
    this.finished = false;
    this.finalRanking = null;
  }

  get roundWind() {
    return Math.floor(this.roundIndex / 4) % 4;
  }

  get targetRounds() {
    return targetRoundsForMode(this.mode);
  }

  get isLastWind() {
    return this.roundIndex + 4 >= this.targetRounds;
  }

  // 一局結束。result:
  //   { winType: 'tsumo'|'ron'|'flow'|'flowers'|'eight-fairies',
  //     winners?: [seat...], discarderSeat?: number }
  // 回傳：{ next: true } 或 { next: false, done: 'match-end' }
  advance(result) {
    this.results.push({ ...result, roundIndex: this.roundIndex });
    const dealerWon = result.winType === 'tsumo' || result.winType === 'ron' || result.winType === 'eight-fairies'
      ? (result.winners && result.winners.includes(this.dealerSeat))
      : false;

    if (result.winType === 'flow') {
      // 流局：莊家連莊（臭莊）
      this.renchan += 1;
    } else if (dealerWon) {
      this.renchan += 1;
    } else {
      // 莊家被胡 / 非莊家胡牌 → 下莊
      this.dealerSeat = nextSeat(this.dealerSeat);
      this.renchan = 0;
    }

    this.roundIndex += 1;

    if (this.roundIndex >= this.targetRounds) {
      this.finished = true;
      this.finalRanking = this.computeRanking();
      return { next: false, done: 'match-end' };
    }
    return { next: true };
  }

  // 莊家台數（供計分）：2×連莊數 + 1
  dealerTai() {
    return 2 * this.renchan + 1;
  }

  computeRanking() {
    // 依分數排序；同分者並列（以 sortKey 表示）
    const seats = [0, 1, 2, 3].sort((a, b) => this.scores[b] - this.scores[a]);
    const result = [];
    let rank = 1;
    for (let i = 0; i < seats.length; i++) {
      if (i > 0 && this.scores[seats[i]] !== this.scores[seats[i - 1]]) {
        rank = i + 1;
      }
      result.push({ seat: seats[i], score: this.scores[seats[i]], rank });
    }
    return result;
  }

  saveState() {
    return {
      mode: this.mode,
      withFlowers: this.withFlowers,
      startScore: this.startScore,
      scores: this.scores.slice(),
      dealerSeat: this.dealerSeat,
      renchan: this.renchan,
      roundIndex: this.roundIndex,
      finished: this.finished,
      finalRanking: this.finalRanking
    };
  }

  loadState(state) {
    this.mode = state.mode;
    this.withFlowers = state.withFlowers;
    this.startScore = state.startScore;
    this.scores = state.scores.slice();
    this.dealerSeat = state.dealerSeat;
    this.renchan = state.renchan;
    this.roundIndex = state.roundIndex;
    this.finished = state.finished;
    this.finalRanking = state.finalRanking;
    return this;
  }
}