// AudioManager.js — Phase 16：音效/BGM 總管（facade）
// 一切方法可重複呼叫、AudioContext 不存在或音效不存在都不 crash、不影響 GameEngine。
import { AudioContextAdapter } from './AudioContextAdapter.js';
import { AudioMixer } from './AudioMixer.js';
import { BGMController } from './BGMController.js';
import { sfxPreset, bgmTrack } from './audioPresets.js';
import { soundFor, resolveBgm } from './audioEvents.js';

export class AudioManager {
  constructor({ contextAdapter = null, mixer = null, bgm = null } = {}) {
    this.context = contextAdapter || new AudioContextAdapter();
    this.mixer = mixer || new AudioMixer();
    this.bgm = bgm || new BGMController({ adapter: this.context });
    this.initialized = false;
    this.locked = true; // autoplay restriction
    this._pendingBgm = null;
    this._disposed = false;
  }

  init() {
    if (this.initialized) return this;
    this.context.init();
    const buses = this.context.createBuses();
    if (buses) this.mixer.attach(buses);
    this.initialized = true;
    return this;
  }

  get available() {
    return this.initialized && this.context.available;
  }

  // user gesture 後呼叫；失敗不能阻止遊戲
  async unlock() {
    if (!this.initialized) this.init();
    if (!this.context.available) return this;
    try {
      const ok = await this.context.resume();
      this.locked = !ok;
    } catch {
      this.locked = true;
    }
    if (!this.locked && this._pendingBgm) {
      const name = this._pendingBgm;
      this._pendingBgm = null;
      this.playBGM(name);
    }
    return this;
  }

  playSFX(name) {
    if (this._disposed) return this;
    if (!this.initialized) this.init();
    if (!this.context.available || this.mixer.muted) return this;
    const preset = sfxPreset(name);
    if (!preset) return this; // 不存在音效 → 安靜略過
    this.context.playTone({ name, ...preset });
    return this;
  }

  playBGM(name) {
    if (this._disposed) return this;
    if (!this.initialized) this.init();
    const track = bgmTrack(name);
    if (!track) return this; // 不存在的音軌 → 安靜略過
    if (this.locked || !this.context.available) {
      this._pendingBgm = name; // 解鎖後播放
      return this;
    }
    this._pendingBgm = null;
    this.bgm.play({ name, ...track });
    return this;
  }

  stopBGM() {
    this._pendingBgm = null;
    this.bgm.stop();
    return this;
  }

  pauseBGM() {
    this.bgm.pause();
    return this;
  }

  resumeBGM() {
    if (this.locked || !this.context.available) return this;
    this.bgm.resume();
    return this;
  }

  setMasterVolume(v) {
    this.mixer.setMaster(v);
    return this;
  }
  setBgmVolume(v) {
    this.mixer.setBgm(v);
    return this;
  }
  setSfxVolume(v) {
    this.mixer.setSfx(v);
    return this;
  }
  setMuted(m) {
    this.mixer.setMuted(m);
    return this;
  }
  toggleMute() {
    this.mixer.setMuted(!this.mixer.muted);
    return this.mixer.muted;
  }

  getState() {
    return {
      initialized: this.initialized,
      available: this.available,
      locked: this.locked,
      muted: this.mixer.muted,
      volumes: this.mixer.volumes(),
      bgm: this.bgm.currentTrack ? this.bgm.currentTrack.name : null,
      disposed: this._disposed
    };
  }

  // 由 UI 餵入「音效事件序列 ＋ 對局階段」；映射集中在 audioEvents（不含播放邏輯）
  onGameState(events, phase) {
    for (const e of events || []) {
      const sound = soundFor(e);
      if (sound) this.playSFX(sound);
    }
    const track = resolveBgm(phase);
    if (track) this.playBGM(track);
    else this.stopBGM();
    return this;
  }

  dispose() {
    this.bgm.dispose();
    this.context.dispose();
    this._pendingBgm = null;
    this._disposed = true;
    return this;
  }
}
