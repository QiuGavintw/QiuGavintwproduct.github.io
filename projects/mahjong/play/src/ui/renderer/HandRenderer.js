// HandRenderer.js — Phase 12：人類玩家自己的手牌（文字牌）+ 花 + 副露
// AI 手牌一律不在此呈現（由 PlayerRenderer 顯示張數即可）。
import { shortName, fullName } from '../../mahjong/Tile.js';
import { ContainerHelper } from './dom.js';

export class HandRenderer {
  constructor({ doc = document } = {}) {
    this.doc = doc;
  }

  render(container, vm, uiState) {
    ContainerHelper.clear(this.doc, container);
    const human = vm.players.find((p) => p.isHuman);
    if (!human) return;

    const hidden = textHint(this.doc, `你（${human.name}）的手牌`);
    container.appendChild(hidden);

    const tiles = this.doc.createElement('div');
    tiles.className = 'hand-tiles';
    for (const k of human.concealedTiles) {
      tiles.appendChild(this._tile(k, uiState));
    }
    container.appendChild(tiles);

    if (human.flowers.length) {
      const f = this.doc.createElement('div');
      f.className = 'row flowers';
      f.textContent = `花：${human.flowers.map((k) => fullName(k)).join(' ')}`;
      container.appendChild(f);
    }
    for (const m of human.melds) {
      const e = this.doc.createElement('div');
      e.className = 'row meld';
      e.textContent = `${m.type}：${m.tiles.map((k) => shortName(k)).join(' ')}${m.tiles[0] ? '' : ''}`;
      container.appendChild(e);
    }
  }

  _tile(key, uiState) {
    const t = this.doc.createElement('button');
    t.type = 'button';
    t.className = 'tile';
    t.textContent = shortName(key);
    t.setAttribute('data-tile', key);
    if (uiState && uiState.selectedTile === key) t.classList.add('selected');
    return t;
  }
}

function textHint(doc, text) {
  const e = doc.createElement('div');
  e.className = 'hand-title';
  e.textContent = text;
  return e;
}