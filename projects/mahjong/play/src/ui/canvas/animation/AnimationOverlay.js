// AnimationOverlay.js — Phase 15：把「目前進行中的動畫」畫成疊層（在靜態場景之上）
// 只讀 timeline.sample() 的插值資料；不觸碰遊戲狀態。
import { roundedRect } from '../TileRenderer.js';

export class AnimationOverlay {
  constructor({ tileRenderer }) {
    this.tiles = tileRenderer;
  }

  draw(ctx, layout, timeline) {
    const s = timeline.sample();
    const v = s.value;
    switch (timeline.type) {
      case 'tile-move': {
        const { tileKey, face } = timeline.meta;
        const rect = { x: v.x, y: v.y, w: v.w, h: v.h };
        if (face && tileKey) this.tiles.drawTile(ctx, tileKey, rect, {});
        else this.tiles.drawBack(ctx, rect, {});
        break;
      }
      case 'highlight': {
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, v.alpha));
        ctx.strokeStyle = timeline.meta.color || '#f4c95d';
        ctx.lineWidth = 3;
        roundedRect(ctx, v.x, v.y, v.w, v.h, 8);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case 'seat-turn': {
        const seat = timeline.to.seat;
        const pos = layout.seat[seat].playerPos;
        const p = s.eased;
        ctx.save();
        ctx.globalAlpha = 1 - p * 0.6;
        ctx.strokeStyle = '#f4c95d';
        ctx.lineWidth = 3 + 2 * p;
        roundedRect(ctx, pos.x - 4 - 6 * p, pos.y - 4 - 6 * p, pos.w + 8 + 12 * p, pos.h + 8 + 12 * p, 10);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case 'win': {
        const seats = timeline.to.seats || [];
        const p = s.eased;
        for (const seat of seats) {
          const pos = layout.seat[seat].playerPos;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - p);
          ctx.strokeStyle = '#f4c95d';
          ctx.lineWidth = 4;
          roundedRect(ctx, pos.x - 8 - 10 * p, pos.y - 8 - 10 * p, pos.w + 16 + 20 * p, pos.h + 16 + 20 * p, 12);
          ctx.stroke();
          ctx.restore();
        }
        break;
      }
      case 'wall': {
        const w = layout.wall;
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, v.alpha));
        ctx.strokeStyle = '#f4c95d';
        ctx.lineWidth = 3;
        roundedRect(ctx, w.x - 3, w.y - 3, w.w + 6, w.h + 6, 12);
        ctx.stroke();
        ctx.restore();
        break;
      }
      default:
        break;
    }
  }
}
