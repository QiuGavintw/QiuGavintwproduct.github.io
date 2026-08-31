/* ============================================================
   作品集 × 台灣麻將 整合驗收（P1–P8）
   以 node:test 執行（零第三方框架），與 deploy.yml 的品質檢查一致。
   執行：node --test tests/
   使用 vm 沙箱載入首頁／詳細頁腳本，驗證卡片與詳細頁可實際 render，
   並確認台灣麻將作品資料不含任何 AI 手牌資訊。
   ============================================================ */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

// ---------- 最小 DOM / window 沙箱（不引入 jsdom） ----------
function makeEl(attrs) {
  return {
    innerHTML: '',
    attrs: attrs || {},
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    classList: { add() {}, toggle() {}, remove() {}, contains() { return false; } },
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    appendChild() {},
    removeChild() {}
  };
}

function buildSandbox() {
  const gridEl = makeEl();
  const emptyEl = makeEl();
  const detailEl = makeEl({ 'data-detail': 'mahjong' });
  const document = {
    readyState: 'complete',
    documentElement: { setAttribute() {}, getAttribute() { return 'light'; } },
    querySelector(sel) {
      if (sel === '[data-works-grid]') return gridEl;
      if (sel === '[data-works-empty]') return emptyEl;
      if (sel === '[data-detail]') return detailEl;
      return null;
    },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  const sandbox = {
    console,
    Promise,
    setTimeout: (fn) => { try { fn(); } catch (e) { /* 測試環境：立即觸發 */ } return 0; },
    clearTimeout: () => {},
    document,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    IntersectionObserver: class {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    gridEl,
    emptyEl,
    detailEl
  };
  sandbox.window = sandbox; // main/detail 以 window.PROJECTS / window.matchMedia 讀取
  sandbox.matchMedia = () => ({ matches: false, addEventListener() {} });
  sandbox.PROJECTS = require(path.join(ROOT, 'js/projects.js'));
  return sandbox;
}

function loadInSandbox(sandbox, relPaths) {
  const context = vm.createContext(sandbox);
  for (const rel of relPaths) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, context, { filename: rel });
  }
  return context;
}

const mahjong = require(path.join(ROOT, 'js/projects.js')).find((p) => p.slug === 'mahjong');

// ---------- P1–P5：作品資料 ----------
test('P1. 台灣麻將作品資料存在（PROJECTS 內有 mahjong）', () => {
  const projects = require(path.join(ROOT, 'js/projects.js'));
  assert.ok(Array.isArray(projects));
  assert.ok(mahjong, 'PROJECTS 應包含 mahjong');
});

test('P2. title 正確', () => {
  assert.equal(mahjong.title, '台灣麻將');
});

test('P3. 作品 URL 正確：detailPage 與 demoUrl 對應的 index.html 皆存在', () => {
  assert.equal(mahjong.detailPage, 'projects/mahjong/');
  assert.equal(mahjong.demoUrl, 'projects/mahjong/play/');
  assert.ok(fs.existsSync(path.join(ROOT, mahjong.detailPage, 'index.html')), '詳細頁應存在');
  assert.ok(fs.existsSync(path.join(ROOT, mahjong.demoUrl, 'index.html')), '遊戲入口應存在');
  // 遊戲入口需為可載入的 ES Module
  assert.ok(fs.existsSync(path.join(ROOT, mahjong.demoUrl, 'src/ui/main.js')), '遊戲 main.js 應存在');
  assert.ok(fs.existsSync(path.join(ROOT, mahjong.demoUrl, 'style.css')), '遊戲 style.css 應存在');
});

test('P4. GitHub repository URL 正確（作品集 repo 內 projects/mahjong 之真實路徑）', () => {
  const expected = 'https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/mahjong';
  assert.equal(mahjong.githubUrl, expected);
  assert.ok(/^https:\/\//.test(mahjong.githubUrl));
  assert.ok(mahjong.githubUrl.includes('QiuGavintwproduct.github.io'));
});

test('P5. 技術標籤與分類存在', () => {
  assert.ok(Array.isArray(mahjong.technologies) && mahjong.technologies.length > 0);
  assert.ok(Array.isArray(mahjong.categories) && mahjong.categories.length > 0);
  assert.ok(mahjong.description && mahjong.description.length > 0);
  assert.ok(mahjong.features && mahjong.features.length > 0);
});

// ---------- P6–P7：可 render ----------
test('P6. 作品卡片可以 render（首頁 renderProjects 輸出含台灣麻將）', () => {
  const sandbox = buildSandbox();
  loadInSandbox(sandbox, ['js/main.js']);
  assert.ok(sandbox.gridEl.innerHTML.includes('台灣麻將'), '作品卡應包含標題');
  assert.ok(sandbox.gridEl.innerHTML.includes('projects/mahjong/'), '作品卡應含詳細頁連結');
  assert.ok(sandbox.gridEl.innerHTML.includes('立即體驗'), '作品卡應含立即體驗按鈕');
});

test('P7. 作品詳細頁可以 render（detail.js 輸出含標題與簡介）', () => {
  const sandbox = buildSandbox();
  loadInSandbox(sandbox, ['js/main.js', 'js/detail.js']);
  assert.ok(sandbox.detailEl.innerHTML.includes('台灣麻將'), '詳細頁應含標題');
  assert.ok(sandbox.detailEl.innerHTML.includes('作品簡介'), '詳細頁應含作品簡介區塊');
  assert.ok(sandbox.detailEl.innerHTML.includes('立即體驗'), '詳細頁應含立即體驗按鈕');
  assert.ok(sandbox.detailEl.innerHTML.includes('projects/mahjong/play/'), '詳細頁體驗按鈕應指向遊戲入口');
});

// ---------- P8：AI 隱私 ----------
const TILE_KEY_RE = /([1-9][mps])|(z[1-7])|(f[1-8])/;
function collectText(p) {
  return [
    p.title,
    p.shortDescription,
    p.description,
    ...(p.technologies || []),
    ...(p.features || []),
    ...(p.howToPlay || []),
    ...(p.highlights || []),
    p.thumbnail,
    p.screenshots ? p.screenshots.join(' ') : ''
  ].join('\n');
}

test('P8. 作品資料與 render 輸出不含 AI 手牌（牌面 key / concealed 資料）', () => {
  const text = collectText(mahjong);
  assert.ok(!TILE_KEY_RE.test(text), '作品資料不得含牌面 key（如 1m/z1/f1）');
  assert.ok(!text.includes('concealedTiles'), '作品資料不得含 concealedTiles');
  assert.ok(!text.includes('手牌：'), '作品資料不得描述 AI 實際手牌');

  const sandbox = buildSandbox();
  loadInSandbox(sandbox, ['js/main.js', 'js/detail.js']);
  const html = sandbox.gridEl.innerHTML + '\n' + sandbox.detailEl.innerHTML;
  assert.ok(!TILE_KEY_RE.test(html), 'render 輸出不得含牌面 key');
  assert.ok(!html.includes('concealedTiles'), 'render 輸出不得含 concealedTiles');
});
