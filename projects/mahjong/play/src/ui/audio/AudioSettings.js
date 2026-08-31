// AudioSettings.js — Phase 16：音量規格（0..1，clamp、NaN 歸零）與預設
export const DEFAULT_VOLUMES = Object.freeze({
  master: 1,
  bgm: 0.5,
  sfx: 0.8
});

export function clampVolume(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return 0;
  if (v === Infinity) return 1;
  if (v === -Infinity) return 0;
  return Math.min(1, Math.max(0, v));
}

export class AudioSettings {
  constructor({ master, bgm, sfx, muted = false } = {}) {
    this.master = clampVolume(master != null ? master : DEFAULT_VOLUMES.master);
    this.bgm = clampVolume(bgm != null ? bgm : DEFAULT_VOLUMES.bgm);
    this.sfx = clampVolume(sfx != null ? sfx : DEFAULT_VOLUMES.sfx);
    this.muted = !!muted;
  }

  setMaster(v) {
    this.master = clampVolume(v);
    return this;
  }
  setBgm(v) {
    this.bgm = clampVolume(v);
    return this;
  }
  setSfx(v) {
    this.sfx = clampVolume(v);
    return this;
  }
  setMuted(m) {
    this.muted = !!m;
    return this;
  }

  toJSON() {
    return { master: this.master, bgm: this.bgm, sfx: this.sfx, muted: this.muted };
  }
}
