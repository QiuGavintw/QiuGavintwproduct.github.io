// CanvasRenderer.js — Phase 14：把 ViewModel 畫上 Canvas（純視覺、無引擎依賴）
// 只接受純資料（vm / layout / uiState）；不得 new GameEngine/TurnManager、不得算胡/向聽。
import { roundedRect } from './TileRenderer.js';

export class CanvasRenderer {
  constructor({ tileRenderer, playerRenderer, riverRenderer, meldRenderer, wallRenderer }) {
    this.tiles = tileRenderer;
    this.players = playerRenderer;
    this.river = riverRenderer;
    this.melds = meldRenderer;
    this.wall = wallRenderer;
  }

  render(ctx, vm, layout, uiState) {
    this._drawTable(ctx, layout);

    for (const seat of [0, 1, 2, 3]) {
      const player = vm.players && vm.players[seat];
      if (player) this.players.draw(ctx, layout, vm, player);
    }
    this.melds.draw(ctx, layout, vm);
    for (const seat of [0, 1, 2, 3]) this._drawFlowers(ctx, layout, vm, seat);
    this._drawHands(ctx, layout, vm, uiState);
    this.river.draw(ctx, layout, vm);
    this.wall.draw(ctx, layout, vm);
  }

  _drawTable(ctx, layout) {
    const t = layout.table;
    ctx.save();
    ctx.fillStyle = '#1b3529';
    roundedRect(ctx, t.x, t.y, t.w, t.h, 16);
    ctx.fill();
    ctx.strokeStyle = '#35594a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  _drawFlowers(ctx, layout, vm, seat) {
    const player = vm.players && vm.players[seat];
    if (!player || !layout.seat[seat].isHuman) return; // AI 花數已顯示於名牌
    const rects = layout.seat[seat].flowers;
    for (let i = 0; i < rects.length; i++) {
      const key = player.flowers[i];
      if (key) this.tiles.drawTile(ctx, key, rects[i], {});
    }
  }

  _drawHands(ctx, layout, vm, uiState) {
    const discardable = vm.prompt === 'discard';
    for (const seat of [0, 1, 2, 3]) {
      const s = layout.seat[seat];
      const player = vm.players && vm.players[seat];
      if (!player) continue;
      const rects = s.hand;
      if (s.isHuman) {
        for (let i = 0; i < rects.length; i++) {
          const key = player.concealedTiles[i];
          if (!key) continue;
          this.tiles.drawTile(ctx, key, rects[i], {
            selected: !!(uiState && uiState.selectedTile === key),
            disabled: !discardable
          });
        }
      } else {
        for (const rect of rects) this.tiles.drawBack(ctx, rect, {});
      }
    }
  }
}
