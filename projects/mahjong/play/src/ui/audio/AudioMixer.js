// AudioMixer.js — Phase 16：master / bgm / sfx 三匯流排；mute 與 volume 分離
import { AudioSettings, clampVolume } from './AudioSettings.js';

export class AudioMixer {
  constructor(settings = null) {
    this.settings = settings || new AudioSettings();
    this._master = { gain: { value: 1 } };
    this._bgm = { gain: { value: 0.5 } };
    this._sfx = { gain: { value: 0.8 } };
  }

  // 接上後端匯流排（production = AudioContext buses；fake = 假節點）
  attach({ master, bgm, sfx } = {}) {
    if (master) this._master = master;
    if (bgm) this._bgm = bgm;
    if (sfx) this._sfx = sfx;
    this._apply();
    return this;
  }

  setMaster(v) {
    this.settings.setMaster(v);
    this._apply();
    return this;
  }
  setBgm(v) {
    this.settings.setBgm(v);
    this._apply();
    return this;
  }
  setSfx(v) {
    this.settings.setSfx(v);
    this._apply();
    return this;
  }
  setMuted(m) {
    this.settings.setMuted(m);
    this._apply();
    return this;
  }

  get muted() {
    return this.settings.muted;
  }

  volumes() {
    const s = this.settings;
    return { master: s.master, bgm: s.bgm, sfx: s.sfx };
  }

  _apply() {
    const s = this.settings;
    // mute 只把輸出歸零，不破壞原 volume 設定
    this._master.gain.value = s.muted ? 0 : clampVolume(s.master);
    this._bgm.gain.value = s.muted ? 0 : clampVolume(s.bgm);
    this._sfx.gain.value = s.muted ? 0 : clampVolume(s.sfx);
  }
}
