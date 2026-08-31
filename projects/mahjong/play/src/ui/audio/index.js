// index.js — Phase 16：Audio 層統一匯出
export { AudioManager } from './AudioManager.js';
export { AudioContextAdapter } from './AudioContextAdapter.js';
export { AudioMixer } from './AudioMixer.js';
export { BGMController } from './BGMController.js';
export { SFX_PRESETS, BGM_TRACKS, sfxPreset, bgmTrack } from './audioPresets.js';
export { deriveAudioEvents, soundFor, resolveBgm, AUDIO_EVENT_MAP, bgmForPhase } from './audioEvents.js';
export { AudioSettings, clampVolume, DEFAULT_VOLUMES } from './AudioSettings.js';
