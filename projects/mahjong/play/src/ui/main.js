// main.js — Phase 12/14 瀏覽器入口：建立 adapter + GameUI + Canvas 視覺層並啟動
// 決定性：不做任何 Math.random；引擎 seed 固定可重現。DEBUG_UI 預設 false。
import { GameEngineAdapter } from './GameEngineAdapter.js';
import { GameUI } from './GameUI.js';
import { CanvasTable, detectReducedMotion } from './canvas/CanvasTable.js';
import { AudioManager } from './audio/AudioManager.js';

const DEBUG_UI = false; // 調整為 true 可顯示 phase/currentSeat/wallRemaining/events 等調試資訊

function wireAudioSettings(audio) {
  const sfx = document.querySelector('#sfx-volume');
  const bgm = document.querySelector('#bgm-volume');
  const mute = document.querySelector('#mute-toggle');
  if (sfx) sfx.addEventListener('input', () => audio.setSfxVolume(parseFloat(sfx.value)));
  if (bgm) bgm.addEventListener('input', () => audio.setBgmVolume(parseFloat(bgm.value)));
  if (mute) {
    const refreshMute = () => {
      const m = audio.getState().muted;
      mute.setAttribute('aria-pressed', String(m));
      mute.textContent = m ? '🔇 靜音（開）' : '🔇 靜音（關）';
    };
    mute.addEventListener('click', () => {
      audio.toggleMute();
      refreshMute();
    });
    refreshMute();
  }
}

export function boot(root = document.querySelector('#app')) {
  const adapter = new GameEngineAdapter({ seed: 1, mode: 'one', debug: DEBUG_UI });
  const audio = new AudioManager();
  audio.init();
  const ui = new GameUI({ container: root, adapter, doc: document, audio });
  ui.bindCommands(ui._defaultCommands());
  ui.wire();

  // Autoplay：首次 user gesture 解鎖；失敗不影響遊戲
  const unlockOnce = () => {
    audio.unlock();
    document.removeEventListener('pointerdown', unlockOnce);
  };
  document.addEventListener('pointerdown', unlockOnce);
  wireAudioSettings(audio);

  // Phase 14/15：Canvas 視覺層＋動畫（牌桌視覺；操作按鈕/HUD/訊息/結算仍在 DOM）
  const canvas = document.querySelector('#mahjong-table');
  let table = null;
  if (canvas) {
    table = new CanvasTable({
      canvas,
      onTile: (key) => ui.selectTile(key),
      onIdle: () => ui.refresh(), // 動畫完成 → 重繪（解除輸入鎖後更新按鈕）
      reducedMotion: detectReducedMotion(window) // matchMedia 不存在時安全回 false
    });
    table.resize();
    ui.canvasTable = table;
    document.body.classList.add('canvas-mode');
    const onResize = () => {
      table.resize();
      ui.refresh(); // 只重繪，不推進引擎
    };
    window.addEventListener('resize', onResize);
    table.disposeResize = () => window.removeEventListener('resize', onResize);
  }

  ui.update();
  return { adapter, ui, table };
}
