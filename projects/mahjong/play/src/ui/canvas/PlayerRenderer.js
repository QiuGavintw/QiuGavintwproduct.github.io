// PlayerRenderer.js — Phase 14：玩家名牌（座位／名稱／分數／目前玩家／莊家／花數）
import { roundedRect } from './TileRenderer.js';

const SEAT_LABELS = ['下', '右', '上', '左'];

export class PlayerRenderer {
  draw(ctx, layout, vm, player) {
    const pos = layout.seat[player.seat].playerPos;
    ctx.save();

    // 目前玩家：靜態高亮框（無動畫）
    if (vm.turn && vm.turn.currentSeat === player.seat) {
      ctx.strokeStyle = '#f4c95d';
      ctx.lineWidth = 4;
      roundedRect(ctx, pos.x - 4, pos.y - 4, pos.w + 8, pos.h + 8, 10);
      ctx.stroke();
    }

    // 名牌底
    roundedRect(ctx, pos.x, pos.y, pos.w, pos.h, 8);
    ctx.fillStyle = player.isHuman ? '#2f5243' : '#244638';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#35594a';
    ctx.stroke();

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f4f1e6';
    ctx.font = `bold 18px sans-serif`;
    const name = `${SEAT_LABELS[player.seat]}位 ${player.name}${player.isHuman ? '（你）' : ''}`;
    ctx.fillText(name, pos.x + 10, pos.y + 14);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#c6d6cf';
    let meta = `分數 ${player.score}`;
    if (player.flowers && player.flowers.length) meta += ` 花 ${player.flowers.length}`;
    ctx.fillText(meta, pos.x + 10, pos.y + 34);

    // 莊家標記（依 dealerSeat）
    if (vm.match && vm.match.dealerSeat === player.seat) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f4c95d';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('莊', pos.x + pos.w - 10, pos.y + pos.h / 2);
    }
    ctx.restore();
  }
}
