// WallRenderer.js — Phase 14：牌牆視覺化（縮略呈現）＋剩餘張數（數字來自 ViewModel）
import { roundedRect } from './TileRenderer.js';

export class WallRenderer {
  draw(ctx, layout, vm) {
    const wall = layout.wall;
    ctx.save();
    ctx.fillStyle = '#17352a';
    roundedRect(ctx, wall.x, wall.y, wall.w, wall.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#2f5243';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 縮略牌牆：幾疊小方塊示意
    const stackW = 14;
    const stackH = 22;
    const gap = 4;
    const cols = 6;
    const rows = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = wall.x + 12 + c * (stackW + gap);
        const y = wall.y + 12 + r * (stackH + gap) + (r === 0 ? 6 : 0);
        ctx.fillStyle = '#2f6f5e';
        ctx.fillRect(x, y, stackW, stackH);
      }
    }

    const count = wall.count == null ? '—' : String(wall.count);
    ctx.fillStyle = '#f4c95d';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`剩 ${count} 張`, wall.x + 16, wall.y + wall.h - 16);
    ctx.restore();
  }
}
