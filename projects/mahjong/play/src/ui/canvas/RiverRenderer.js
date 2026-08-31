// RiverRenderer.js — Phase 14：四家河牌（公開資訊，皆顯示牌面）＋最後捨牌高亮
export class RiverRenderer {
  constructor({ tileRenderer }) {
    this.tiles = tileRenderer;
  }

  draw(ctx, layout, vm) {
    const river = vm.river && vm.river.tiles ? vm.river.tiles : [];
    const last = river.length ? river[river.length - 1] : null;
    for (const seat of [0, 1, 2, 3]) {
      const rects = layout.seat[seat].river;
      const seatTiles = river.filter((r) => r.seat === seat);
      for (let i = 0; i < rects.length; i++) {
        const tile = seatTiles[i];
        if (!tile) continue;
        const highlighted = last && tile === last;
        this.tiles.drawTile(ctx, tile.tile, rects[i], { highlighted });
      }
    }
  }
}
