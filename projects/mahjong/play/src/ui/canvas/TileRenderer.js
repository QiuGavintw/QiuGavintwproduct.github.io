// TileRenderer.js — Phase 14：單張牌面／牌背／選取／停用 的繪圖（純視覺、無規則）
// 牌面文字重用 Tile.shortName（1萬／2筒／東／春），不建立第二套 mapping。
import { shortName } from '../../mahjong/Tile.js';

const FACE_BG = '#fdfde4';
const FACE_BORDER = '#b9c4a8';
const FACE_TEXT = '#22303a';
const BACK_BG = '#2f6f5e';
const BACK_EDGE = '#173b31';
const SELECT = '#f4c95d';
const DISABLED_ALPHA = 0.35;

export function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class TileRenderer {
  constructor({ doc } = {}) {
    this.doc = doc || null;
  }

  // 畫牌面（人類手牌／公開河牌／副露共用）
  drawTile(ctx, key, rect, opts = {}) {
    const { selected = false, disabled = false, highlighted = false } = opts;
    ctx.save();
    if (disabled) ctx.globalAlpha = DISABLED_ALPHA;

    const lift = selected ? -8 : 0;
    const x = rect.x;
    const y = rect.y + lift;
    const w = rect.w;
    const h = rect.h;

    roundedRect(ctx, x, y, w, h, 6);
    ctx.fillStyle = FACE_BG;
    ctx.fill();
    ctx.lineWidth = selected ? 3 : 1;
    ctx.strokeStyle = selected ? SELECT : FACE_BORDER;
    ctx.stroke();

    const label = shortName(key);
    ctx.fillStyle = FACE_TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = label.length >= 2 ? `bold ${Math.floor(h * 0.34)}px sans-serif` : `bold ${Math.floor(h * 0.44)}px sans-serif`;
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);

    if (highlighted && !selected) {
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3;
      roundedRect(ctx, x - 2, y - 2, w + 4, h + 4, 7);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 畫牌背（AI 手牌）
  drawBack(ctx, rect, opts = {}) {
    const { disabled = false } = opts;
    ctx.save();
    if (disabled) ctx.globalAlpha = DISABLED_ALPHA;
    roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 5);
    ctx.fillStyle = BACK_BG;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = BACK_EDGE;
    ctx.stroke();
    // 簡單花紋：兩條對角線
    ctx.strokeStyle = BACK_EDGE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.25, rect.y + rect.h * 0.25);
    ctx.lineTo(rect.x + rect.w * 0.75, rect.y + rect.h * 0.75);
    ctx.moveTo(rect.x + rect.w * 0.75, rect.y + rect.h * 0.25);
    ctx.lineTo(rect.x + rect.w * 0.25, rect.y + rect.h * 0.75);
    ctx.stroke();
    ctx.restore();
  }

  // 選取框（若需要獨立覆蓋層）
  drawSelected(ctx, rect) {
    ctx.save();
    ctx.strokeStyle = SELECT;
    ctx.lineWidth = 3;
    roundedRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 8);
    ctx.stroke();
    ctx.restore();
  }

  // 停用遮罩（僅視覺）
  drawDisabled(ctx, rect) {
    ctx.save();
    ctx.globalAlpha = DISABLED_ALPHA;
    ctx.fillStyle = '#000';
    roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 5);
    ctx.fill();
    ctx.restore();
  }
}
