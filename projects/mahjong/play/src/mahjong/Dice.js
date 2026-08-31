// Dice.js — 骰子（含 Cheat 指定結果）

export class Dice {
  constructor(count = 3, faces = 6, rng = null) {
    this.count = count;
    this.faces = faces;
    this.rng = rng;
    this.lastRoll = [];
    this.lastTotal = 0;
  }

  roll() {
    if (this.rng) {
      this.lastRoll = [];
      for (let i = 0; i < this.count; i++) {
        this.lastRoll.push(this.rng.int(1, this.faces));
      }
    } else {
      this.lastRoll = [];
      for (let i = 0; i < this.count; i++) {
        this.lastRoll.push(1 + Math.floor(Math.random() * this.faces));
      }
    }
    this.lastTotal = this.lastRoll.reduce((a, b) => a + b, 0);
    return this.lastRoll;
  }

  // Cheat：指定每一顆骰子點數
  rollForced(values) {
    if (values.length !== this.count) {
      throw new Error(`dice count mismatch: need ${this.count}, got ${values.length}`);
    }
    this.lastRoll = values.slice();
    this.lastTotal = this.lastRoll.reduce((a, b) => a + b, 0);
    return this.lastRoll;
  }
}