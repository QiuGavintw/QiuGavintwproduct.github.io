'use strict';
const fs = require('fs');
const path = require('path');
const { buildApp } = require('./harness');

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) { pass += 1; console.log('  PASS', name); }
  else { fail += 1; console.log('  FAIL', name); }
}

const TODAY = new Date().toISOString().slice(0, 10);

function makeStore() {
  const store = {};
  return {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
}

function feedKey(app, k) {
  app.onKeydown({ key: k, repeat: false, ctrlKey: false, metaKey: false, preventDefault() {} });
}

function typeText(app, text) {
  for (const ch of text) feedKey(app, ch);
}

function startActive(app, lesson) {
  app.startPractice(lesson);
  app._cancelCountdown();
  app.phase = 'active';
  app.screen = 'practice';
}

const TYPE_LESSON = { id: 'vt', title: '測試', type: 'letters', level: 1, texts: ['asdf', 'jkl;'] };
const TYPE_TEXT = 'asdfjkl;'; // 8 chars

(async () => {
  console.log('--- PHASE 4: AUDIO MANAGER (safe fallback) ---');
  {
    const { app, mod, sandbox } = buildApp();
    ok(typeof mod.AudioManager === 'function', 'AudioManager exported');
    ok(typeof mod.clamp01 === 'function', 'clamp01 exported');
    ok(app.audio.unavailable === true, 'Node runner: Audio unavailable -> safe fallback');
    const ids = ['playCorrect', 'playError', 'playComplete', 'playLevelUp', 'playAchievement', 'playButton', 'unlock'];
    ids.forEach(m => { app.audio[m](); ok(true, `audio.${m}() no-throw`); });
    ok(app.audio.music === null, 'music not loaded when unavailable');
    ok(!app.audio._musicBroken, 'no broken flag set on construction');
  }
  {
    const { mod } = buildApp();
    ok(mod.clamp01(1.5) === 1, 'clamp01 clamps high');
    ok(mod.clamp01(-0.5) === 0, 'clamp01 clamps low');
    ok(mod.clamp01(0.4) === 0.4, 'clamp01 keeps mid');
    ok(mod.clamp01('x') === 0, 'clamp01 non-number -> 0');
    ok(mod.clamp01(undefined) === 0, 'clamp01 undefined -> 0');
  }
  {
    const { app } = buildApp();
    ok(app.audio.toggleSfx() === false, 'toggleSfx true -> false');
    ok(app.audio.toggleSfx() === true, 'toggleSfx back to true');
    ok(app.audio.toggleMusic() === true, 'toggleMusic false -> true');
    ok(app.audio.toggleMusic() === false, 'toggleMusic back to false');
    app.audio.setSfxVolume(2); ok(app.audio.sfxVolume === 1, 'setSfxVolume clamps to 1');
    app.audio.setMusicVolume(-3); ok(app.audio.musicVolume === 0, 'setMusicVolume clamps to 0');
  }

  console.log('--- PHASE 4: SETTINGS DEFAULTS & MIGRATION ---');
  {
    const { app } = buildApp();
    const s = app.settings;
    ok(s.theme === 'light', 'default theme = light');
    ok(s.sfxEnabled === true, 'default sfxEnabled = true');
    ok(Math.abs(s.sfxVolume - 0.35) < 1e-9, 'default sfxVolume = 0.35');
    ok(s.musicEnabled === false, 'default musicEnabled = false');
    ok(Math.abs(s.musicVolume - 0.3) < 1e-9, 'default musicVolume = 0.3');
  }
  {
    const { mod } = buildApp();
    const data = mod.migrateStorage({ settings: { sound: false, soundVolume: 0.6 }, stats: {} });
    ok(data.settings.theme === 'light', 'migrate backfills theme=light');
    ok(data.settings.sfxEnabled === false, 'legacy sound:false -> sfxEnabled=false');
    ok(Math.abs(data.settings.sfxVolume - 0.6) < 1e-9, 'legacy soundVolume 0.6 -> sfxVolume 0.6');
    ok(data.settings.musicEnabled === false, 'legacy no music -> musicEnabled=false');
    ok(Math.abs(data.settings.musicVolume - 0.3) < 1e-9, 'legacy no music volume -> default 0.3');
  }

  console.log('--- PHASE 4: THEME APPLY / PERSIST ---');
  {
    const shared = makeStore();
    const a1 = buildApp({ storage: shared });
    a1.app.setTheme('dark');
    ok(a1.sandbox.document.documentElement.dataset.theme === 'dark', 'setTheme applies data-theme=dark');
    ok(a1.app.settings.theme === 'dark', 'setTheme persists setting');
    ok(JSON.parse(shared.getItem('typing_practice_v1')).settings.theme === 'dark', 'theme saved to storage');

    const a2 = buildApp({ storage: shared });
    ok(a2.app.settings.theme === 'dark', 'theme survives reload');
    ok(a2.sandbox.document.documentElement.dataset.theme === 'dark', 'constructor re-applies dark theme');
    ok(a2.app.audio.sfxEnabled === true, 'audio defaults from migrated settings');
  }
  {
    const shared = makeStore();
    shared.setItem('typing_practice_v1', JSON.stringify({ settings: { theme: 'dark' } }));

    const app = buildApp({ storage: shared }).app;
    ok(app.settings.theme === 'dark', 'legacy settings.theme dark loaded');
    app.setTheme('light');
    ok(JSON.parse(shared.getItem('typing_practice_v1')).settings.theme === 'light', 'theme toggle saves light');
  }

  console.log('--- PHASE 4: SFX / MUSIC SETTINGS PERSIST ---');
  {
    const shared = makeStore();
    const a1 = buildApp({ storage: shared }).app;
    a1.setSfxEnabled(false);
    a1.setSfxVolume(0.8);
    a1.setMusicEnabled(true);
    a1.setMusicVolume(0.5);
    ok(a1.el.sfxVolume.value === 80, 'sfx range input synced to 80');
    ok(a1.el.sfxVolumeOut.textContent === '80%', 'sfx output synced to 80%');
    ok(a1.el.musicVolumeOut.textContent === '50%', 'music output synced to 50%');
    ok(a1.el.setSfx.checked === false, 'sfx checkbox synced off');
    ok(a1.el.setMusic.checked === true, 'music checkbox synced on');

    const a2 = buildApp({ storage: shared }).app;
    ok(a2.settings.sfxEnabled === false, 'sfxEnabled persists');
    ok(Math.abs(a2.settings.sfxVolume - 0.8) < 1e-9, 'sfxVolume persists');
    ok(a2.settings.musicEnabled === true, 'musicEnabled persists');
    ok(Math.abs(a2.settings.musicVolume - 0.5) < 1e-9, 'musicVolume persists');
    ok(a2.audio.sfxEnabled === false, 'AudioManager reflects persisted sfxEnabled');
    ok(a2.audio.musicEnabled === true, 'AudioManager reflects persisted musicEnabled');
    ok(Math.abs(a2.audio.sfxVolume - 0.8) < 1e-9, 'AudioManager reflects persisted sfxVolume');
    a2.setMusicVolume(1);
    ok(Math.abs(a2.audio.musicVolume - 1) < 1e-9, 'AudioManager music volume follows setter');
  }

  console.log('--- PHASE 4: SETTINGS MODAL SYNC (no crash) ---');
  {
    const { app } = buildApp();
    app.openSettings();
    ok(true, 'openSettings() renders without error');
  }

  console.log('--- PHASE 4: TIMER STABILITY (single interval) ---');
  {
    const { app } = buildApp();
    const t = app.timer;
    t.reset();
    t.start();
    ok(t.running === true && t._interval !== null, 'start -> running with interval');
    const first = t._interval;
    t.start();
    ok(t.running === true && t._interval === first, 'start() idempotent (no second interval)');
    t.pause();
    ok(t.running === false && t._interval === null, 'pause clears interval');
    t.pause();
    ok(t.running === false && t._interval === null, 'pause idempotent');
    t.resume();
    ok(t.running === true && t._interval !== null, 'resume re-arms single interval');
    t.stop();
    ok(t.running === false && t._interval === null, 'stop clears interval');
  }

  console.log('--- PHASE 4: FINISH GUARD (single settle) ---');
  {
    const { app } = buildApp();
    startActive(app, TYPE_LESSON);
    typeText(app, TYPE_TEXT);
    ok(app.phase === 'finished', 'completed text -> phase finished');
    const n1 = app.storage.data.practiceHistory.length;
    const xp1 = app.storage.data.gamification.xp;
    app._finishPractice();
    ok(app.storage.data.practiceHistory.length === n1, 'second _finishPractice does not double-record');
    ok(app.storage.data.gamification.xp === xp1, 'second _finishPractice does not double-XP');
    ok(app.storage.data.stats.totalPractices === 1, 'totalPractices recorded exactly once');
  }
  {
    const { app } = buildApp();
    app.phase = 'finished';
    app._finishPractice();
    ok(app.storage.data.practiceHistory.length === 0, 'guard blocks settle from idle-finished state');
  }

  console.log('--- PHASE 4: SPEED CHALLENGE MIN LENGTH ---');
  {
    const { app, mod } = buildApp();
    const lesson = app._buildSpeedChallenge();
    ok(lesson.texts.length === 1, 'speed challenge has single text');
    ok(lesson.texts[0].length >= mod.SPEED_CHALLENGE_MIN_CHARS,
      `speed text length ${lesson.texts[0].length} >= ${mod.SPEED_CHALLENGE_MIN_CHARS}`);
    ok(lesson.title.includes('60'), 'speed challenge lesson title mentions 60 秒');
  }
  {
    const { app } = buildApp();
    const r1 = app._bumpDailyTasks({ totalCharacters: 20, completed: true, accuracy: 90, speedChallenge: true });
    ok(r1.includes('speed-challenge'), 'first speed record completes speed-challenge task');
    const r2 = app._bumpDailyTasks({ totalCharacters: 20, completed: true, accuracy: 90, speedChallenge: true });
    ok(r2.length === 0, 'second speed record does not double-complete');
    const task = app.storage.data.dailyTasks.tasks.find(t => t.id === 'speed-challenge');
    ok(task.progress === 1 && task.completed === true, 'speed-challenge progress capped');
  }

  console.log('--- PHASE 4: CLEAR DATA RESET ---');
  {
    const shared = makeStore();
    const a1 = buildApp({ storage: shared }).app;
    startActive(a1, TYPE_LESSON);
    typeText(a1, TYPE_TEXT);
    ok(a1.storage.data.gamification.xp > 0, 'xp earned before clear');
    a1.setSfxEnabled(false);

    a1.clearAllData();
    ok(a1.storage.data.gamification.xp === 0, 'clearAllData resets xp');
    ok(a1.storage.data.practiceHistory.length === 0, 'clearAllData empties history');
    ok(a1.settings.sfxEnabled === true, 'clearAllData restores default sfxEnabled');
    ok(a1.settings.theme === 'light', 'clearAllData restores default theme');

    const a2 = buildApp({ storage: shared }).app;
    ok(a2.storage.data.gamification.xp === 0, 'cleared data persists on reload');
    ok(a2.settings.theme === 'light', 'cleared theme persists');
  }

  console.log('--- PHASE 4: DAILY TASKS STILL WORK WITH AUDIO/SPEED ---');
  {
    const { app } = buildApp();
    const r1 = app._bumpDailyTasks({ totalCharacters: 10, completed: true, accuracy: 95, speedChallenge: false });
    ok(r1.filter(t => t !== 'speed-challenge').length >= 1, 'regular practice advances non-speed daily tasks');
  }

  console.log('--- PHASE 4: STATIC CHECKS (console / paths / ids / a11y) ---');
  {
    const src = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
    const js = src('app.js');
    const html = src('index.html');
    const css = src('style.css');

    ok(!/debugger\b/.test(js), 'no debugger statement');
    ok(!/console\.log/.test(js), 'no console.log');
    ok(!/console\.error/.test(js), 'no console.error');
    ok(!/localhost/.test(js + html), 'no localhost URLs');
    ok(!/C:\\|C:\//.test(js + html), 'no absolute windows paths');
    ok(/SFX_FILES/.test(js) && /AudioManager/.test(js), 'audio code in app.js');
    ok(/typeof Audio === 'undefined'/.test(js), 'audio guarded for unsupported env');
    ok(/this\.phase === 'finished'/.test(js), 'finish guard present');

    const settingIds = ['theme-light', 'theme-dark', 'set-sfx', 'sfx-volume', 'sfx-volume-out', 'set-music', 'music-volume', 'music-volume-out', 'keyboard-note'];
    settingIds.forEach(id => {
      ok(new RegExp(`id=["']${id}["']`).test(html), `html has #${id}`);
    });
    ok(/aria-live=["']polite["']/.test(html), 'practice-hint aria-live present');
    ok(/data-theme/.test(css), 'css supports data-theme (dark mode)');
    ok(/prefers-reduced-motion/.test(css), 'css honours prefers-reduced-motion');
    ok(/keyboard-note/.test(css), 'css styles keyboard-note');
    ok(/volume-output/.test(css), 'css styles volume output');
    ok(/@media \(max-width: 520px\)/.test(css) && /kb-finger/.test(css), 'mobile layout hides finger codes');
  }

  console.log('--- PHASE 4: FINAL QA TARGETED COVERAGE (browser-test logic) ---');
  {
    // §9 ESC: pause <-> resume toggle from keyboard
    const { app } = buildApp();
    startActive(app, TYPE_LESSON);
    app.timer.start();
    app.onKeydown({ key: 'Escape', repeat: false, ctrlKey: false, metaKey: false, preventDefault() {} });
    ok(app.phase === 'paused' && !app.timer.running, 'ESC pauses active practice (timer stopped)');
    app.onKeydown({ key: 'Escape', repeat: false, ctrlKey: false, metaKey: false, preventDefault() {} });
    ok(app.phase === 'active' && app.timer.running, 'ESC resumes paused practice (timer running)');
    app.timer.stop();
  }
  {
    // §9 Home: goHome clears timer + returns to idle/home
    const { app } = buildApp();
    startActive(app, TYPE_LESSON);
    app.timer.start();
    app.goHome();
    ok(!app.timer.running && app.timer._interval === null && app.timer._acc === 0, 'goHome stops + clears timer');
    ok(app.phase === 'idle' && app.screen === 'home', 'goHome resets phase to idle on home screen');
  }
  {
    // §9 Restart: restartPractice resets old timer and re-enters countdown
    const { app } = buildApp();
    startActive(app, TYPE_LESSON);
    app.currentLesson = TYPE_LESSON;
    app.timer.start();
    ok(app.timer.running === true, 'timer running before restart');
    app.restartPractice();
    ok(!app.timer.running && app.timer._interval === null && app.timer._acc === 0,
      'restart clears old timer');
    ok(app.phase === 'countdown', 'restart re-enters countdown');
    app._cancelCountdown();
  }
  {
    // §10 Speed challenge: 60s tick auto-settles exactly once
    const { app, mod } = buildApp();
    startActive(app, TYPE_LESSON);
    app._speedChallenge = true;
    app.timer._acc = mod.SPEED_CHALLENGE_DURATION;
    ok(app.phase === 'active', 'speed challenge active before tick');
    app.timer._onTick(mod.SPEED_CHALLENGE_DURATION);
    ok(app.phase === 'finished', '60s tick auto-finishes speed challenge');
    ok(app.storage.data.practiceHistory.length === 1, 'speed challenge settled once');
    const xp = app.storage.data.gamification.xp;
    const n = app.storage.data.practiceHistory.length;
    app.timer._onTick(mod.SPEED_CHALLENGE_DURATION + 1);
    ok(app.storage.data.practiceHistory.length === n, 'second tick does not settle again');
    ok(app.storage.data.gamification.xp === xp, 'second tick does not double XP');
    ok(app.storage.data.dailyTasks.tasks.find(t => t.id === 'speed-challenge')
      && app.storage.data.dailyTasks.tasks.find(t => t.id === 'speed-challenge').progress <= 1,
      'daily task progress not double-counted by repeat tick');
  }

  console.log('--- RESULT ---');
  console.log(`Phase 4: pass = ${pass} fail = ${fail}`);
  process.exit(fail ? 1 : 0);
})();