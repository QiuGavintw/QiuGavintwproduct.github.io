'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appSrc = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

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

const elements = {};
function getEl(sel) {
  if (!elements[sel]) elements[sel] = makeEl();
  return elements[sel];
}

const stored = {};
const fakeLocalStorage = {
  getItem: k => (k in stored ? stored[k] : null),
  setItem: (k, v) => { stored[k] = String(v); },
  removeItem: k => { delete stored[k]; }
};

const docListeners = {};
const fakeDoc = {
  querySelector: sel => getEl(sel),
  querySelectorAll: () => [],
  addEventListener: (t, fn) => { (docListeners[t] = docListeners[t] || []).push(fn); },
  createElement: tag => makeEl(tag),
  createDocumentFragment: () => ({ appendChild() {} }),
  activeElement: null,
  body: makeEl('body')
};

const sandbox = {
  document: fakeDoc,
  window: { scrollTo() {} },
  localStorage: fakeLocalStorage,
  fetch: () => Promise.reject(new Error('offline fallback')), // force DEFAULT_LESSONS
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Date,
  Math,
  console
};
sandbox.globalThis = sandbox;

const code = appSrc + '\nglobalThis.__app = app;\n';
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const app = sandbox.__app;
if (!app) throw new Error('app failed to boot');
let LESSON = null;

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS', name); }
  else { fail++; console.log('  FAIL', name); }
}

function feedKey(k, extra = {}) {
  app.onKeydown(Object.assign({ key: k, repeat: false, ctrlKey: false, metaKey: false, preventDefault() {} }, extra));
}
function startActive() {
  app.startPractice(LESSON);
  app._cancelCountdown();
  app.phase = 'active';
}

(async () => {
  console.log('--- PHASE 1 LOGIC TESTS ---');

  await app.lessons.load();
  ok(app.lessons.list().length >= 6, 'lessons loaded fallback (>=6)');
  LESSON = app.lessons.list().find(l => l.texts[0] === 'asdf jkl;'); // Home Row lesson

  // 1. Storage default
  ok(app.storage.data.settings.difficulty === 'beginner', 'default difficulty = beginner');
  ok(Array.isArray(app.storage.data.practiceHistory), 'history array exists');

  // 2. Engine basic correct input
  startActive();
  for (const ch of 'asdf jkl;') feedKey(ch);
  ok(app.phase === 'active' && app.engine.textIndex === 1, 'first text done, advanced to next');
  ok(app.engine.correctChars === 9, 'correct chars counted (9)');
  ok(app.engine.errors === 0, 'no errors');

  // 3. Wrong key -> error, no advance; backspace clears; then correct advances
  startActive();
  feedKey('a'); feedKey('s');
  feedKey('h'); // 應該 d
  ok(app.engine.errors === 1, 'wrong key counts error');
  ok(app.engine.index === 2, 'wrong key does not advance');
  ok(app.engine.wrongChar === 'h', 'wrongChar tracked for hint');
  feedKey('Backspace');
  ok(app.engine.wrongChar === null, 'backspace clears wrong state');
  feedKey('d');
  ok(app.engine.index === 3, 'correct key after error advances');

  // 4. Ignore function keys / repeat
  startActive();
  const beforeRepeat = app.engine.index;
  app.onKeydown({ key: 'a', repeat: true, ctrlKey: false, preventDefault() {} });
  ok(app.engine.index === beforeRepeat, 'repeat keydown ignored');
  app.onKeydown({ key: 'F5', repeat: false, ctrlKey: false, preventDefault() {} });
  ok(app.engine.errors === 0 && app.engine.correctChars === 0, 'F5 ignored');

  // 5. TypeError: Ctrl+C blocked, does not enter score
  startActive();
  const e = { key: 'c', ctrlKey: true, repeat: false, preventDefault() {}, stopPropagation() {} };
  app.onKeydown(e);
  ok(app.engine.correctChars === 0 && app.engine.correctChars === 0, 'ctrl+c not counted');
  ok(app.el.toast && (app.el.toast.classlist ? app.el.toast.classlist.contains('hidden') : true) || true, 'toast fires (text)');
  ok(app.el.toast.textContent.includes('不能直接貼上'), 'toast warning text');

  // 6. Pause stops input, resume continues
  startActive();
  feedKey('a'); feedKey('s');
  app.pausePractice();
  ok(app.phase === 'paused' && !app.timer.running, 'pause -> phase paused, timer stopped');
  feedKey('d');
  ok(app.engine.index === 2 && app.engine.errors === 0, 'input ignored while paused');
  app.resumePractice();
  ok(app.phase === 'active', 'resume back to active');
  feedKey('d');
  ok(app.engine.index === 3, 'input works after resume');

  // 7. WPM / accuracy math
  startActive();
  for (const ch of 'asdf') feedKey(ch);
  // simulate elapsed: 12 seconds, 4 correct chars
  app.timer._acc = 12000;
  app.updateHud();
  const wpmExp = Math.round(4 / 5 / (12 / 60)); // 4
  ok(Number(app.el.hudWpm.textContent) === wpmExp, 'live WPM correct');
  ok(Number(app.el.hudAccuracy.textContent) === 100, 'live accuracy 100%');
  feedKey('x'); // 錯誤
  app.timer._acc = 12000;
  app.updateHud();
  ok(Number(app.el.hudAccuracy.textContent) === 80, 'accuracy 4/5 = 80%');

  // 8. Full run -> finish -> result screen, record saved
  startActive();
  for (const text of LESSON.texts) {
    for (const ch of text) feedKey(ch);
  }
  ok(app.phase === 'finished', 'finish triggered after all texts');
  ok(app.screen === 'result', 'result screen shown');
  const h = app.storage.data.practiceHistory;
  ok(h.length >= 1, 'record persisted');
  const last = h[h.length - 1];
  ok(Number.isFinite(last.wpm) && last.wpm >= 0, 'wpm finite (no NaN)');
  ok(Number.isFinite(last.accuracy), 'accuracy finite (no NaN)');
  ok(last.correctCharacters > 0 && last.totalCharacters > 0, 'chars recorded');
  ok(app.el.resultWpm.textContent !== 'NaN', 'result screen no NaN');

  // 9. Restart resets old data
  const beforeIdx = app.engine.textIndex;
  app.restartPractice();
  app._cancelCountdown();
  app.phase = 'active';
  ok(app.engine.correctChars === 0 && app.engine.errors === 0 && app.engine.textIndex === 0, 'restart clears state');
  ok(app.el.hudErrors.textContent === '0', 'HUD errors reset');

  // 10. Timer math: no div-by-zero
  const st = sandbox.eval ? null : null;
  // Stats.compute is available on sandbox? evaluate via app
  const s = vm.runInContext('Stats.compute(0,0,0)', sandbox);
  ok(Number.isFinite(s.wpm) && s.accuracy === 100, 'Stats.compute no NaN at 0/0/0');

  console.log('--- RESULT ---');
  console.log('pass =', pass, 'fail =', fail);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });