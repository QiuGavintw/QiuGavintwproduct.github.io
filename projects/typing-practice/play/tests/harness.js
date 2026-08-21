'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeEl(tag = 'div') {
  const el = {
    tag, children: [], _classes: new Set(), dataset: {}, style: {},
    listeners: {}, textContent: '', innerHTML: '', _attrs: {},
    classList: {
      add: c => el._classes.add(c),
      remove: c => el._classes.delete(c),
      toggle: (c, f) => f === undefined
        ? (el._classes.has(c) ? el._classes.delete(c) : el._classes.add(c))
        : (f ? el._classes.add(c) : el._classes.delete(c)),
      contains: c => el._classes.has(c)
    },
    addEventListener: (t, fn) => { (el.listeners[t] = el.listeners[t] || []).push(fn); },
    appendChild: c => el.children.push(c),
    querySelector: () => null,
    querySelectorAll: () => [],
    focus() {}, blur() {},
    setAttribute(k, v) { el._attrs[k] = v; if (k === 'data-key') el.dataset.key = v; },
    getAttribute(k) { return el._attrs[k]; }
  };
  return el;
}

function makeStorage() {
  const store = {};
  return {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
}

/**
 * 建立一個可測試的 App 實例。
 * @param {object} [opts]
 * @param {object} [opts.storage] 可重複使用的 localStorage 假物件
 * @param {boolean} [opts.fetchFail] 是否讓 fetch 失敗（offline fallback）
 */
function buildApp(opts = {}) {
  const elements = {};
  const getEl = sel => (elements[sel] = elements[sel] || makeEl());

  const docListeners = {};
  const fakeDoc = {
    querySelector: sel => getEl(sel),
    querySelectorAll: () => [],
    addEventListener: (t, fn) => { (docListeners[t] = docListeners[t] || []).push(fn); },
    createElement: tag => makeEl(tag),
    createDocumentFragment: () => ({ appendChild() {} }),
    activeElement: null,
    body: makeEl('body'),
    documentElement: { dataset: {} }
  };

  const localStorage = opts.storage || makeStorage();
  const fetchOk = opts.fetchOk === true;
  const sandbox = {
    document: fakeDoc,
    window: { scrollTo() {} },
    localStorage,
    fetch: fetchOk
      ? (url) => {
          const base = path.join(__dirname, '..');
          const rel = String(url).replace('./', '');
          const file = path.join(base, rel);
          try {
            const json = JSON.parse(fs.readFileSync(file, 'utf8'));
            return Promise.resolve({ ok: true, json: () => Promise.resolve(json) });
          } catch (e) {
            return Promise.resolve({ ok: false, json: () => Promise.resolve(null) });
          }
        }
      : () => Promise.reject(new Error('offline fallback')),
    setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, console
  };
  sandbox.globalThis = sandbox;

  const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const code = src +
    '\nglobalThis.__app = app;' +
    '\nglobalThis.__mod = { FINGERS, FINGER_LABELS, fingerOf, Weakness, PracticeEngine, Stats, Gamification, AchievementManager, AudioManager, ACHIEVEMENT_DEFS, DAILY_TASK_DEFS, migrateStorage, freshDailyTasks, SPEED_CHALLENGE_DURATION, SPEED_CHALLENGE_MIN_CHARS, DAILY_TASK_BONUS_XP, todayStr, clamp01 };\n';
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  return {
    app: sandbox.__app,
    mod: sandbox.__mod,
    sandbox,
    localStorage
  };
}

module.exports = { buildApp };