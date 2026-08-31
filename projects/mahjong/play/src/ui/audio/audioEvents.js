// audioEvents.js — Phase 16：VM diff → 音效事件（唯讀、deterministic）＋事件→聲音 純映射
// 事件名稱只來自公開資料：河牌／副露（meld.type）／真人手牌增減／花／handResult／phase。
// AI 私有牌面（concealed identity）永遠不會出現在事件或 payload 中。
import { bgmTrack } from './audioPresets.js';

// 語意事件 → SFX 名稱（純資料映射）
export const AUDIO_EVENT_MAP = Object.freeze({
  game_start: 'game_start',
  draw: 'draw',
  discard: 'discard',
  chi: 'chi',
  peng: 'peng',
  minggang: 'minggang',
  angang: 'angang',
  jiagang: 'jiagang',
  flower: 'flower',
  ron: 'ron',
  tsumo: 'tsumo',
  pass: 'pass',
  turn_change: 'turn_change',
  hand_end: 'hand_end',
  settlement: 'settlement',
  next_hand: 'next_hand',
  match_end: 'match_end',
  reset: 'reset'
});

export function soundFor(event) {
  return AUDIO_EVENT_MAP[event] || null;
}

// 對局階段 → BGM 音軌（idle/gameplay/settlement）
export function bgmForPhase(phase) {
  if (phase === 'idle') return 'idle';
  if (phase === 'playing' || phase === 'next_hand') return 'gameplay';
  if (phase === 'hand_end' || phase === 'settlement' || phase === 'match_end') return 'settlement';
  return 'idle';
}

function humanMeldCountGrew(prev, next, humanSeat) {
  if (!prev.players || !next.players || !prev.players[humanSeat] || !next.players[humanSeat]) return false;
  return (next.players[humanSeat].melds || []).length > (prev.players[humanSeat].melds || []).length;
}

// 由「前一 VM → 新 VM」推導音效事件序列（與 buildTimelines 同一資料來源）
export function deriveAudioEvents(prev, next, humanSeat = 0) {
  const list = [];
  if (!prev || !next) return list;
  const prevPhase = prev.phase;
  const nextPhase = next.phase;

  // 開始／重來
  if (prevPhase === 'idle' && nextPhase !== 'idle') list.push('game_start');
  if (prevPhase !== 'idle' && nextPhase === 'idle') list.push('reset');

  // 回合切換
  if (prev.turn && next.turn && prev.turn.currentSeat != null && next.turn.currentSeat != null && prev.turn.currentSeat !== next.turn.currentSeat) {
    list.push('turn_change');
  }

  // 摸牌：牌牆減少，或真人手牌變多
  const prevWall = prev.hand ? prev.hand.wallRemaining : null;
  const nextWall = next.hand ? next.hand.wallRemaining : null;
  const wallDropped = prevWall != null && nextWall != null && nextWall < prevWall;
  let humanDrew = false;
  if (next.players && next.players[humanSeat] && prev.players && prev.players[humanSeat]) {
    const pl = prev.players[humanSeat].concealedTiles ? prev.players[humanSeat].concealedTiles.length : 0;
    const nl = next.players[humanSeat].concealedTiles ? next.players[humanSeat].concealedTiles.length : 0;
    humanDrew = nl > pl;
  }
  if (wallDropped) list.push('draw');
  else if (humanDrew) list.push('draw');

  // 捨牌（公開河牌）
  const prevRiver = prev.river && prev.river.tiles ? prev.river.tiles : [];
  const nextRiver = next.river && next.river.tiles ? next.river.tiles : [];
  for (let i = prevRiver.length; i < nextRiver.length; i++) list.push('discard');

  // 副露（meld.type 直接對應）
  if (prev.players && next.players) {
    for (let seat = 0; seat < 4; seat++) {
      const pm = prev.players[seat] ? prev.players[seat].melds || [] : [];
      const nm = next.players[seat] ? next.players[seat].melds || [] : [];
      for (let i = pm.length; i < nm.length; i++) {
        const t = nm[i].type;
        if (t === 'chi' || t === 'peng' || t === 'minggang' || t === 'angang' || t === 'jiagang') list.push(t);
      }
    }
  }

  // 花牌（真人花增加）
  if (next.players && next.players[humanSeat] && prev.players && prev.players[humanSeat]) {
    const pf = prev.players[humanSeat].flowers || [];
    const nf = next.players[humanSeat].flowers || [];
    for (let i = pf.length; i < nf.length; i++) list.push('flower');
  }

  // 過水：反應提示消失、無人類副露、未胡
  if (prev.prompt === 'reaction' && next.prompt !== 'reaction') {
    const won = next.hand && next.hand.handResult;
    if (!won && !humanMeldCountGrew(prev, next, humanSeat)) list.push('pass');
  }

  // 胡牌／流局
  const prevResult = prev.hand ? prev.hand.handResult : null;
  const nextResult = next.hand ? next.hand.handResult : null;
  if (!prevResult && nextResult) {
    if (nextResult.winType === 'ron') list.push('ron');
    else if (nextResult.winType === 'tsumo') list.push('tsumo');
    else list.push('hand_end'); // 流局
  }

  // 局／對局銜接
  if (prevPhase === 'hand_end' && (nextPhase === 'next_hand' || nextPhase === 'match_end')) list.push('settlement');
  if (prevPhase === 'hand_end' && nextPhase === 'match_end') list.push('match_end');
  if (prevPhase === 'next_hand' && nextPhase === 'playing') list.push('next_hand');
  if (prevPhase === 'next_hand' && nextPhase === 'match_end') list.push('match_end');

  return list;
}

// 由 phase 給出要播放的 BGM track（null = 不播）
export function resolveBgm(phase) {
  const name = bgmForPhase(phase);
  return bgmTrack(name) ? name : null;
}
