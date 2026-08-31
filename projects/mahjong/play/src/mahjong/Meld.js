// Meld.js — 副露（吃/碰/明槓/暗槓/加槓）結構與工具

export const MELD_TYPES = ['chi', 'peng', 'minggang', 'angang', 'jiagang'];

// 建立副露
export function createMeld(type, tiles, from = null) {
  const list = tiles.slice();
  return {
    type,
    tiles: list,
    from, // 來源玩家 seat（暗槓為 null）
    concealed: type === 'angang' // 暗槓視為暗刻（計分用）
  };
}

export function isMeldOfType(meld, type) {
  return meld.type === type;
}

export function isPon(meld) {
  return meld.type === 'peng';
}

export function isGang(meld) {
  return meld.type === 'minggang' || meld.type === 'angang' || meld.type === 'jiagang';
}

// 副露是否為刻類（碰/槓）
export function isKnutMeld(meld) {
  return meld.type === 'peng' || isGang(meld);
}

// 副露是否為順類（吃）
export function isChiMeld(meld) {
  return meld.type === 'chi';
}

// 明刻（碰/明槓/加槓 均非暗刻）
export function isConcealedTriplet(meld) {
  return meld.type === 'angang';
}

export function meldKey(meld) {
  if (meld.tiles.length === 0) return '';
  // 排序後以第一張代表
  return [...meld.tiles].sort()[0];
}

export function meldLabel(meld) {
  const names = {
    chi: '吃',
    peng: '碰',
    minggang: '明槓',
    angang: '暗槓',
    jiagang: '加槓'
  };
  return `${names[meld.type] || meld.type}(${meld.tiles.slice().sort().join(',')})`;
}