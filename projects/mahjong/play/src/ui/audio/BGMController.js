// BGMController.js — Phase 16：BGM 播放（play/pause/resume/stop/loop/track switch）
// 只管理 pad handle 與目前 track；不影響任何遊戲狀態。
export class BGMController {
  constructor({ adapter = null } = {}) {
    this.adapter = adapter;
    this.currentTrack = null;
    this._pad = null;
    this.paused = false;
  }

  play(track) {
    if (!track) return this;
    if (this.currentTrack && this.currentTrack.name === track.name && this._pad) {
      if (this.paused) return this.resume();
      return this;
    }
    this.stop();
    this.currentTrack = track;
    this.paused = false;
    const pad = this.adapter ? this.adapter.startPad({ name: track.name, ...track }) : null;
    if (pad) this._pad = pad;
    return this;
  }

  pause() {
    if (this._pad) {
      this._pad.stop();
      this._pad = null;
    }
    this.paused = true;
    return this;
  }

  resume() {
    if (!this.currentTrack) return this;
    if (this._pad) return this;
    const pad = this.adapter ? this.adapter.startPad(this.currentTrack) : null;
    if (pad) this._pad = pad;
    this.paused = false;
    return this;
  }

  stop() {
    if (this._pad) {
      this._pad.stop();
      this._pad = null;
    }
    this.currentTrack = null;
    this.paused = false;
    return this;
  }

  dispose() {
    this.stop();
    return this;
  }
}
