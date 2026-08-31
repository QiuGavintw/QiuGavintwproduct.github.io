// Deal.js — 開門決定、發牌、補花
// 開門模型（數位一致化）：
//   第一次擲骰 決 定「開門位置」＝由哪一位玩家面前的牆開門。
//   第二次擲骰 決定「牌牆起點」＝從該牆右端跳過的疊數。
//   牆的線性序 = 回合順序（發牌沿 0→1→2→3）。
//   開門起點 index = (owner*塊大小 + 2*第二次骰總) % 全牆張數。

import { keyOf, isFlower } from './Tile.js';

// 開門牆主：從莊家起逆時針數（餘 1 莊家、2 下家、3 對家、0 上家）
export function computeWallOwner(dealerSeat, firstDiceTotal) {
  return (dealerSeat + ((firstDiceTotal - 1) % 4)) % 4;
}

export function tilesPerPlayer(withFlowers) {
  return withFlowers ? 36 : 34;
}

// 開門起點 index；total1 決定牆主，total2 決定跳過疊數
export function computeOpeningIndex(dealerSeat, firstTotal, secondTotal, totalTiles, withFlowers) {
  const owner = computeWallOwner(dealerSeat, firstTotal);
  const block = tilesPerPlayer(withFlowers);
  return ((owner * block + 2 * secondTotal) % totalTiles + totalTiles) % totalTiles;
}

// 依回合順序從莊家開始發牌：每家 16 張，莊家多 1 張開門
export function dealTiles(wall, dealerSeat, hands) {
  const order = [];
  for (let i = 0; i < 4; i++) order.push((dealerSeat + i) % 4);
  for (let round2 = 0; round2 < 16; round2++) {
    for (let i = 0; i < 4; i++) {
      const t = wall.draw();
      if (!t) throw new Error('wall exhausted during deal');
      hands[order[i]].addTile(keyOf(t));
    }
  }
  // 莊家開門牌（第 17 張）
  const t = wall.draw();
  if (!t) throw new Error('wall exhausted for dealer open');
  hands[dealerSeat].addTile(keyOf(t));
  return order;
}

// 補花：來回多輪，每輪每家最多補 1 張，直到無人持有花牌
export function replaceFlowers(wall, dealerSeat, hands) {
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (let i = 0; i < 4; i++) {
      const seat = (dealerSeat + i) % 4;
      const hand = hands[seat];
      const idx = hand.tiles.findIndex((t) => isFlower(keyOf(t)));
      if (idx >= 0) {
        const removed = hand.tiles.splice(idx, 1)[0];
        hand.flowers.push(keyOf(removed));
        const rep = wall.drawReplacement();
        if (!rep) throw new Error('wall exhausted for flower replacement');
        hand.addTile(keyOf(rep));
        hasMore = true;
      }
    }
  }
  return { flowsOrder: Array.from({ length: 4 }, (_, i) => (dealerSeat + i) % 4) };
}

// 方便的完整開局工具：洗牌→開門→發牌→補花
export function setupRound(wall, rng, dealerSeat, dice, hands) {
  wall.shuffle(rng);
  // 第一次擲骰：開門位置
  const first = dice.roll();
  const firstTotal = first.reduce((a, b) => a + b, 0);
  // 第二次擲骰：牌牆起點
  const second = dice.roll();
  const secondTotal = second.reduce((a, b) => a + b, 0);
  const openIndex = computeOpeningIndex(
    dealerSeat, firstTotal, secondTotal,
    wall.tiles.length,
    wall.withFlowers
  );
  wall.openAt(openIndex);
  dealTiles(wall, dealerSeat, hands);
  replaceFlowers(wall, dealerSeat, hands);
  return {
    firstRoll: first,
    secondRoll: second,
    wallOwner: computeWallOwner(dealerSeat, firstTotal),
    openIndex
  };
}