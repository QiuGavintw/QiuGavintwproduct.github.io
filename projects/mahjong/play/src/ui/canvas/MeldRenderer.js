// MeldRenderer.js — Phase 14：副露（吃/碰/明槓/暗槓/加槓）
// 一律以 ViewModel 的 meld.type 當標籤，不自行判斷種類。
import { shortName } from '../../mahjong/Tile.js';
import { roundedRect } from './TileRenderer.js';

const TYPE_LABELS = {
  chi: '吃',
  peng: '碰',
  minggang: '明槓',
  angang: '暗槓',
  jiagang: '加槓'
};

export class MeldRenderer {
  constructor({ tileRenderer }) {
    this.tiles = tileRenderer;
  }

  draw(ctx, layout, vm) {
    for (const seat of [0, 1, 2, 3]) {
      const player = vm.players && vm.players[seat];
      if (!player) continue;
      const melds = player.melds || [];
      const groups = layout.seat[seat].melds;
      for (let i = 0; i < groups.length; i++) {
        const meld = melds[i];
        if (!meld) continue;
        this._drawGroup(ctx, groups[i], meld);
      }
    }
  }

  _drawGroup(ctx, group, meld) {
    const label = TYPE_LABELS[meld.type] || meld.type;
    const lp = group.labelPos;
    ctx.save();
    ctx.fillStyle = '#9fb8ad';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lp.x, lp.y + 6);

    // 每張牌的矩形依 meld.tiles.length 往右排
    const count = meld.tiles.length;
    for (let j = 0; j < count; j++) {
      const rect = { x: lp.x + j * 43, y: lp.y + 18, w: 40, h: 50 };
      this.tiles.drawTile(ctx, meld.tiles[j], rect, {});
    }
    ctx.restore();
  }
}
