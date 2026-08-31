// Hand.js — 單一玩家的手牌、副露、花牌管理

import { keyOf, parseKey, kindIndex, compare } from './Tile.js';
import { createMeld } from './Meld.js';

export class Hand {
  constructor(seat, tileKeys = [], melds = [], flowers = []) {
    this.seat = seat;
    this.tiles = tileKeys.map((k) => (typeof k === 'string' ? parseKey(k) : k));
    this.melds = melds.map((m) => ({ ...m, tiles: m.tiles.slice() }));
    this.flowers = flowers.slice();
  }

  get size() {
    return this.tiles.length;
  }

  get meldCount() {
    return this.melds.length;
  }

  // 是否門清（無任何吃碰槓；花牌不破壞門清）
  get isMenqing() {
    return this.melds.length === 0;
  }

  // 手牌 key 陣列（含排序）
  keys() {
    return this.tiles.map(keyOf).sort(compare);
  }

  // 34 kind 計數陣列
  counts() {
    const c = new Array(34).fill(0);
    for (const t of this.tiles) {
      const idx = kindIndex(keyOf(t));
      if (idx >= 0) c[idx] += 1;
    }
    return c;
  }

  // key -> count map（含花）
  keyCounts() {
    const c = {};
    for (const k of this.keys()) c[k] = (c[k] || 0) + 1;
    return c;
  }

  // 含副露後的完整 34-count（胡牌檢查用：手牌+副露）
  totalCounts() {
    const c = this.counts();
    for (const m of this.melds) {
      for (const k of m.tiles) {
        const idx = kindIndex(k);
        if (idx >= 0) c[idx] += 1;
      }
    }
    return c;
  }

  addTile(key) {
    this.tiles.push(parseKey(key));
  }

  // 從手牌移除指定 key（一次性）
  removeTile(key) {
    const k = keyOf(key);
    const i = this.tiles.findIndex((t) => keyOf(t) === k);
    if (i < 0) return null;
    return this.tiles.splice(i, 1)[0];
  }

  hasTile(key, count = 1) {
    const k = keyOf(key);
    return this.tiles.filter((t) => keyOf(t) === k).length >= count;
  }

  resort() {
    this.tiles.sort(compare);
  }

  addFlower(key) {
    this.flowers.push(keyOf(key));
  }

  addMeld(meld) {
    this.melds.push(meld);
  }

  // 吃：從手牌移除兩張形成順子的牌
  doChi(discardKey, needKeys) {
    // needKeys: 吃後與 discardKey 形成順子的另外兩張
    for (const k of needKeys) {
      this.removeTile(k);
    }
    this.addMeld(createMeld('chi', [...needKeys, discardKey].sort(), null));
  }

  // 碰：從手牌移除兩張
  doPeng(discardKey, fromSeat) {
    this.removeTile(discardKey);
    this.removeTile(discardKey);
    this.addMeld(createMeld('peng', [discardKey, discardKey, discardKey], fromSeat));
  }

  // 明槓（他人打出）：手牌三張 + 打出的牌
  doMinggang(discardKey, fromSeat) {
    this.removeTile(discardKey);
    this.removeTile(discardKey);
    this.removeTile(discardKey);
    this.addMeld(createMeld('minggang', [discardKey, discardKey, discardKey, discardKey], fromSeat));
  }

  // 暗槓：手牌四張
  doAngang(key) {
    this.removeTile(key);
    this.removeTile(key);
    this.removeTile(key);
    this.removeTile(key);
    this.addMeld(createMeld('angang', [key, key, key, key], null));
  }

  // 加槓：手牌一張 接到既有碰組
  doJiaGang(key) {
    this.removeTile(key);
    const m = this.melds.find((x) => x.type === 'peng' && x.tiles[0] === keyOf(key));
    if (!m) throw new Error('jiagang requires existing peng meld of same tile');
    m.type = 'jiagang';
    m.tiles.push(keyOf(key));
    m.concealed = false;
    return m;
  }

  // 副露是否包含指定 key 的刻/槓
  meldTripletOf(key) {
    const k = keyOf(key);
    return this.melds.find((m) => m.tiles.length >= 3 && m.tiles[0] === k) || null;
  }

  // 供存檔
  saveState() {
    return {
      seat: this.seat,
      tiles: this.keys(),
      melds: this.melds.map((m) => ({ ...m, tiles: m.tiles.slice() })),
      flowers: this.flowers.slice()
    };
  }

  loadState(state) {
    this.seat = state.seat;
    this.tiles = state.tiles.map((k) => parseKey(k));
    this.melds = state.melds.map((m) => ({ ...m, tiles: m.tiles.slice() }));
    this.flowers = state.flowers.slice();
    return this;
  }
}