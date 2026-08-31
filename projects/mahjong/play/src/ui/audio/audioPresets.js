// audioPresets.js — Phase 16：SFX 音色與 BGM 音軌（程序合成、無外部素材）
// 全部 deterministic；禁止 Math.random 決定音效。
export const SFX_PRESETS = Object.freeze({
  game_start: { frequency: 523, duration: 0.15, type: 'triangle', gain: 0.5 },
  draw: { frequency: 880, duration: 0.06, type: 'sine', gain: 0.3 },
  discard: { frequency: 220, duration: 0.08, type: 'square', gain: 0.25 },
  chi: { frequency: 659, duration: 0.1, type: 'triangle', gain: 0.4 },
  peng: { frequency: 587, duration: 0.12, type: 'triangle', gain: 0.4 },
  minggang: { frequency: 523, duration: 0.14, type: 'sawtooth', gain: 0.35 },
  angang: { frequency: 494, duration: 0.14, type: 'sawtooth', gain: 0.35 },
  jiagang: { frequency: 440, duration: 0.14, type: 'sawtooth', gain: 0.35 },
  flower: { frequency: 988, duration: 0.08, type: 'sine', gain: 0.3 },
  ron: { frequency: 784, duration: 0.25, type: 'triangle', gain: 0.5 },
  tsumo: { frequency: 784, duration: 0.25, type: 'triangle', gain: 0.5 },
  pass: { frequency: 330, duration: 0.06, type: 'sine', gain: 0.2 },
  turn_change: { frequency: 440, duration: 0.05, type: 'sine', gain: 0.15 },
  hand_end: { frequency: 392, duration: 0.2, type: 'triangle', gain: 0.4 },
  settlement: { frequency: 523, duration: 0.2, type: 'triangle', gain: 0.4 },
  next_hand: { frequency: 659, duration: 0.12, type: 'triangle', gain: 0.35 },
  match_end: { frequency: 392, duration: 0.3, type: 'triangle', gain: 0.5 },
  reset: { frequency: 330, duration: 0.1, type: 'sine', gain: 0.2 }
});

export const BGM_TRACKS = Object.freeze({
  idle: { frequencies: [220, 277], type: 'sine', gain: 0.06 },
  gameplay: { frequencies: [196, 247], type: 'sine', gain: 0.06 },
  settlement: { frequencies: [174, 233], type: 'sine', gain: 0.06 }
});

export function sfxPreset(name) {
  return SFX_PRESETS[name] || null;
}

export function bgmTrack(name) {
  return BGM_TRACKS[name] || null;
}
