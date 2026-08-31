// AudioContextAdapter.js — Phase 16：唯一觸碰瀏覽器 Audio API 的邊界
// 封裝 AudioContext / GainNode / OscillatorNode；其餘模組不得直接 new AudioContext()。
// 無 AudioContext（測試／無音環境）→ isAvailable=false，全部 no-op，不 throw。
import { clampVolume } from './AudioSettings.js';

function defaultCtxFactory() {
  if (typeof AudioContext !== 'undefined') return new AudioContext();
  if (typeof webkitAudioContext !== 'undefined') return new webkitAudioContext();
  return null;
}

export class AudioContextAdapter {
  constructor({ ctxFactory = null } = {}) {
    this._factory = ctxFactory || defaultCtxFactory;
    this.ctx = null;
    this.masterBus = null;
    this.bgmBus = null;
    this.sfxBus = null;
    this.available = false;
    this.state = 'unavailable';
    this._tones = new Set();
    this._pads = new Set();
  }

  init() {
    if (this.available) return this;
    try {
      const ctx = this._factory();
      if (!ctx) {
        this.state = 'unavailable';
        return this;
      }
      this.ctx = ctx;
      this.masterBus = ctx.createGain();
      this.bgmBus = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.sfxBus.connect(this.masterBus);
      this.bgmBus.connect(this.masterBus);
      this.masterBus.connect(ctx.destination);
      this.state = ctx.state || 'suspended';
      this.available = true;
    } catch {
      this.available = false;
      this.state = 'unavailable';
    }
    return this;
  }

  async resume() {
    if (!this.available || !this.ctx) return false;
    if (this.ctx.state === 'running') {
      this.state = 'running';
      return true;
    }
    try {
      await this.ctx.resume();
      this.state = this.ctx.state || 'running';
      return this.state === 'running';
    } catch {
      return false;
    }
  }

  createBuses() {
    return { master: this.masterBus, bgm: this.bgmBus, sfx: this.sfxBus };
  }

  // 單發短音（SFX）
  playTone({ frequency = 440, duration = 0.1, type = 'sine', gain = 0.3, when = 0 } = {}) {
    if (!this.available || !this.ctx) return null;
    try {
      const t0 = this.ctx.currentTime + Math.max(0, when);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, clampVolume(gain)), t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.01, duration));
      osc.connect(g);
      g.connect(this.sfxBus || this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + Math.max(0.02, duration + 0.02));
      const handle = { stop: () => { try { osc.stop(); } catch { /* already stopped */ } } };
      this._tones.add(handle);
      return handle;
    } catch {
      return null;
    }
  }

  // 持續 pad（BGM；sustain 直到 stop）
  startPad({ frequencies = [220], type = 'sine', gain = 0.05 } = {}) {
    if (!this.available || !this.ctx) return null;
    try {
      const now = this.ctx.currentTime;
      const parts = frequencies.map((freq) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(Math.max(1, freq), now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0001, clampVolume(gain)), now + 0.15);
        osc.connect(g);
        g.connect(this.bgmBus || this.ctx.destination);
        osc.start(now);
        return { osc, g };
      });
      const handle = {
        stop: () => {
          const t = this.ctx.currentTime;
          for (const { osc, g } of parts) {
            try {
              g.gain.setTargetAtTime(0.0001, t, 0.05);
              osc.stop(t + 0.3);
            } catch { /* already stopped */ }
          }
        }
      };
      this._pads.add(handle);
      return handle;
    } catch {
      return null;
    }
  }

  dispose() {
    for (const p of this._pads) p.stop();
    for (const t of this._tones) t.stop();
    this._pads.clear();
    this._tones.clear();
    if (this.ctx && typeof this.ctx.close === 'function') {
      try {
        this.ctx.close();
      } catch { /* ignore */ }
    }
    this.ctx = null;
    this.available = false;
    this.state = 'unavailable';
    return this;
  }
}
