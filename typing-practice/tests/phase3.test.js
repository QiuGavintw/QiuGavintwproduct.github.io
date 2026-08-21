'use strict';
const { buildApp } = require('./harness');

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) { pass += 1; console.log('  PASS', name); }
  else { fail += 1; console.log('  FAIL', name); }
}

const TODAY = new Date().toISOString().slice(0, 10);
const YDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

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
  console.log('--- PHASE 3: STORAGE MIGRATION ---');
  {
    const { mod } = buildApp();
    const old = { settings: {}, stats: { streak: 3, longestStreak: 5, highestWpm: 42, bestAccuracy: 91, today: { date: TODAY, count: 2, bestWpm: 20 } },
      achievements: ['first-practice'], dailyTasks: { date: TODAY, tasks: {} },
      lessonProgress: {}, practiceHistory: [] };
    const data = mod.migrateStorage(old);

    ok(data.gamification && data.gamification.xp === 0, 'gamification added with default xp');
    ok(data.gamification.currentStreak === 3, 'migrates stats.streak -> gamification currentStreak');
    ok(data.gamification.longestStreak === 5, 'migrates stats.longestStreak');
    ok(data.gamification.level === 1, 'level computed from xp');
    ok(Array.isArray(data.dailyTasks.tasks) && data.dailyTasks.tasks.length === 3, 'dailyTasks migrated to array of 3');
    ok(data.dailyTasks.date === TODAY, 'dailyTasks date today');
    ok(data.personalBest.bestWpm === 42, 'personalBest backfilled from highestWpm');
    ok(data.personalBest.bestAccuracy === 91, 'personalBest backfilled from bestAccuracy');
    ok(typeof data.gamification.achievements === 'object' && !Array.isArray(data.gamification.achievements),
      'legacy achievements[] stays compatible with map');
  }

  console.log('--- PHASE 3: PERSIST AFTER MIGRATION ---');
  {
    function makeStore() {
      const store = {};
      return {
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; }
      };
    }

    const seed = {
      settings: {},
      stats: { streak: 4, longestStreak: 6, highestWpm: 50, bestAccuracy: 98, today: { date: TODAY, count: 1, bestWpm: 30 } },
      achievements: [],
      dailyTasks: { date: TODAY, tasks: {} },
      lessonProgress: { 'lesson-01': { completions: 2, bestWpm: 40, bestAccuracy: 90, completed: true } },
      practiceHistory: [
        { date: TODAY, mode: 'letters', wpm: 30, accuracy: 90, errors: 1, duration: 20, durationMs: 20000, correctCharacters: 10, totalCharacters: 11 }
      ]
    };
    const shared = makeStore();
    shared.setItem('typing_practice_v1', JSON.stringify(seed));

    const app2 = buildApp({ storage: shared }).app;
    const g = app2.storage.data.gamification;
    ok(g.currentStreak === 4, 'migrated streak persisted to gamification');
    ok(app2.storage.data.personalBest.bestWpm === 50, 'migrated personalBest persisted');
    ok(app2.storage.data.practiceHistory.length === 1, 'practiceHistory preserved');
    ok(Array.isArray(app2.storage.data.dailyTasks.tasks) && app2.storage.data.dailyTasks.tasks.length === 3,
      'dailyTasks reshaped on load');
    app2.storage.save();

    const app3 = buildApp({ storage: shared }).app;
    ok(app3.storage.data.gamification.currentStreak === 4, 'gamification persists across reloads');
  }

  console.log('--- PHASE 3: XP / LEVEL ---');
  {
    const { mod } = buildApp();
    const G = mod.Gamification;
    ok(G.xpForLevel(1) === 0, 'level 1 threshold 0');
    ok(G.xpForLevel(2) === 100, 'level 2 threshold 100');
    ok(G.xpForLevel(5) === 700, 'level 5 threshold 700');
    ok(G.xpForLevel(10) === 3000, 'level 10 threshold 3000');
    ok(G.xpForLevel(11) === 3500, 'beyond lv10: +500 per level');

    ok(G.getLevelFromXP(0) === 1, '0 xp -> level 1');
    ok(G.getLevelFromXP(99) === 1, '99 xp -> level 1');
    ok(G.getLevelFromXP(100) === 2, '100 xp -> level 2');
    ok(G.getLevelFromXP(249) === 2, '249 xp -> level 2');
    ok(G.getLevelFromXP(450) === 4, '450 xp -> level 4');
    ok(G.getLevelFromXP(3400) === 10, '3400 xp -> level 10');
    ok(G.getLevelFromXP(3500) === 11, '3500 xp -> level 11');
    ok(G.getLevelFromXP(99999) >= 11, 'huge xp -> high level');

    const prog = G.getLevelProgress(100);
    ok(prog.level === 2 && prog.floor === 100 && prog.next === 250, 'getLevelProgress floor/next');
    ok(prog.pct >= 0 && prog.pct <= 100, 'progress pct bounded');
    ok(typeof prog.name === 'string' && prog.name.length > 0, 'level name present');

    ok(G.calculatePracticeXP({ accuracy: 80, wpm: 10 }) === 10, 'base xp = 10');
    ok(G.calculatePracticeXP({ accuracy: 95, wpm: 10 }) === 15, 'accuracy 95+ -> +5');
    ok(G.calculatePracticeXP({ accuracy: 95, wpm: 10 }, { newPersonalBest: true }) === 25, 'new PB -> +10');
    ok(G.calculatePracticeXP({ accuracy: 95, wpm: 10 }, { courseCompleted: true }) === 30, 'course complete -> +15');
    ok(G.calculatePracticeXP({ accuracy: 95, wpm: 10 }, { dailyTaskBonus: ['accuracy-95'] }) === 35, 'daily task -> +20');
    ok(G.calculatePracticeXP({ accuracy: 0 }) === 10, 'no negative on low accuracy');
  }

  console.log('--- PHASE 3: ACHIEVEMENTS ---');
  {
    const { app, localStorage, mod } = buildApp();
    ok(app.achievements.getAchievements().length === 10, '10 achievements defined');
    ok(app.achievements.getUnlockedCount() === 0, 'none unlocked initially');

    ok(app.achievements.unlock('first-practice') === true, 'unlock returns true');
    ok(app.achievements.unlock('first-practice') === false, 'no duplicate unlock');
    ok(app.achievements.isUnlocked('first-practice') === true, 'isUnlocked true after unlock');

    // 重新載入（同一 localStorage）成就仍在
    const app2 = buildApp({ storage: localStorage }).app;
    ok(app2.achievements.isUnlocked('first-practice') === true, 'achievement persists after reload');

    // checkAfterPractice
    const app3 = buildApp().app;
    app3.storage.data.stats.totalPractices = 1;
    const newly = app3.achievements.checkAfterPractice({ record: { wpm: 55, accuracy: 100 }, streak: 3, newPersonalBest: true });
    const unlockedIds = newly.sort();
    ok(unlockedIds.includes('first-practice'), 'first-practice unlocked by checkAfterPractice');
    ok(unlockedIds.includes('speed-30') && unlockedIds.includes('speed-50'), 'speed 30/50 unlocked');
    ok(unlockedIds.includes('perfect-accuracy'), 'perfect accuracy unlocked');
    ok(unlockedIds.includes('streak-3'), 'streak-3 unlocked');
    ok(unlockedIds.includes('breakthrough'), 'breakthrough unlocked on new PB');

    // checkCatchUp 由舊資料補解鎖
    const app4 = buildApp().app;
    app4.storage.data.stats.totalPractices = 2;
    app4.storage.data.personalBest.bestWpm = 90;
    const caught = app4.achievements.checkCatchUp({ streak: 2, lessonOneCompleted: true, allLessonsCompleted: true });
    const caughtIds = caught.sort();
    ok(caughtIds.includes('first-practice') && caughtIds.includes('speed-80'), 'catchUp unlocks speed-80 + first-practice');
    ok(caughtIds.includes('complete-lesson-1') && caughtIds.includes('complete-all-lessons'), 'catchUp unlocks course achievements');
  }

  console.log('--- PHASE 3: DAILY TASKS ---');
  {
    const { mod } = buildApp();
    const fresh = mod.freshDailyTasks();
    ok(fresh.date === TODAY, 'fresh daily tasks date today');
    ok(fresh.tasks.length === 3, '3 daily tasks');
    ok(fresh.tasks.every(t => t.progress === 0 && t.completed === false), 'tasks start fresh');
  }

  console.log('--- PHASE 3: XP + DAILY TASKS + ACHIEVEMENT INTEGRATION ---');
  {
    const { app } = buildApp();
    startActive(app, TYPE_LESSON);
    feedKey(app, 'a');
    app.timer._base = Date.now() - 5000; // 控制 5 秒完成 → wpm≈19
    typeText(app, TYPE_TEXT.slice(1));

    const g = app.storage.data.gamification;
    const rec = app.storage.data.practiceHistory[app.storage.data.practiceHistory.length - 1];
    ok(g.xp > 0, 'xp gained from practice');
    ok(rec.xp > 0, 'record carries xp');
    ok(g.level === 1, 'level stays 1 on small xp');
    ok(rec.completed === true, 'completed flagged');
    ok(rec.speedChallenge === false, 'not speed challenge');

    const tasks = app.storage.data.dailyTasks.tasks;
    const p3 = tasks.find(t => t.id === 'practice-3');
    const acc95 = tasks.find(t => t.id === 'accuracy-95');
    ok(p3.progress === 1, 'practice-3 progress 1');
    ok(p3.completed === false, 'practice-3 not completed yet');
    ok(acc95.progress === 1 && acc95.completed === true, 'accuracy-95 completed');

    const all = app.achievements.getAchievements();
    ok(all.find(a => a.id === 'first-practice').unlocked, 'first-practice unlocked in flow');
    ok(all.find(a => a.id === 'perfect-accuracy').unlocked, 'perfect accuracy unlocked (100%)');
    ok(all.find(a => a.id === 'breakthrough').unlocked === false, 'no breakthrough without prior PB');

    // 紀錄可被統計 Dashboard 使用
    app.openStats();
    ok(app.el.statsChartTitle && app.el.statsChartTitle.textContent.includes('WPM'), 'dashboard chart title rendered');
    ok(app.el.statsChart.innerHTML.includes('muted') || app.el.statsChart.innerHTML.startsWith('<svg'),
      'dashboard chart area rendered');
    ok(app.el.statsBest.textContent.includes(String(app.storage.data.personalBest.bestWpm)),
      'dashboard shows personal best');
  }

  console.log('--- PHASE 3: STREAK + LEVEL UP ---');
  {
    const { app } = buildApp();
    app.storage.data.gamification.xp = 90;
    app.storage.data.gamification.currentStreak = 2;
    app.storage.data.stats.streak = 2;
    app.storage.data.stats.lastPracticeDate = YDAY;
    app.storage.data.gamification.lastPracticeDate = YDAY;
    app.storage.save();

    startActive(app, TYPE_LESSON);
    feedKey(app, 'a');
    app.timer._base = Date.now() - 5000;
    typeText(app, TYPE_TEXT.slice(1));

    const g = app.storage.data.gamification;
    ok(g.currentStreak === 3, 'streak incremented to 3');
    ok(g.longestStreak === 3, 'longest streak updated');
    ok(g.level === 2, 'level up after crossing 100 xp');
    ok(app.achievements.isUnlocked('streak-3'), 'streak-3 achievement unlocked');
    ok(g.xp >= 100, 'xp at/above 100');
  }

  console.log('--- PHASE 3: SPEED CHALLENGE ---');
  {
    const { app } = buildApp();
    const lesson = app._buildSpeedChallenge();
    ok(lesson.type === 'speed', 'speed challenge type');
    ok(lesson.texts && lesson.texts.length === 1, 'speed challenge single long text');
    ok(lesson.texts[0].length > 50, 'speed challenge text long enough');

    // 直接驗證 _bumpDailyTasks 對挑戰紀錄的處理
    const completed = app._bumpDailyTasks({ totalCharacters: 20, completed: true, accuracy: 90, speedChallenge: true });
    ok(completed.includes('speed-challenge'), 'speed-challenge task completed via record');
    const tasks = app.storage.data.dailyTasks.tasks;
    ok(tasks.find(t => t.id === 'speed-challenge').completed === true, 'speed-challenge task marked completed');
  }

  console.log('--- PHASE 3: PERSONAL BEST ---');
  {
    const { app } = buildApp();
    app.storage.addPractice({ wpm: 30, accuracy: 92, duration: 25, durationMs: 25000, correctCharacters: 20, totalCharacters: 22, errorKeys: {} });
    const pb = app.storage.data.personalBest;
    ok(pb.bestWpm === 30, 'bestWpm tracked');
    ok(pb.bestAccuracy === 92, 'bestAccuracy tracked');
    ok(pb.fastestCompletion && pb.fastestCompletion.duration === 25, 'fastestCompletion tracked');

    app.storage.addPractice({ wpm: 28, accuracy: 95, duration: 18, durationMs: 18000, correctCharacters: 15, totalCharacters: 16, errorKeys: {} });
    const pb2 = app.storage.data.personalBest;
    ok(pb2.bestWpm === 30, 'bestWpm keeps max');
    ok(pb2.bestAccuracy === 95, 'bestAccuracy updated to 95');
    ok(pb2.fastestCompletion.duration === 18, 'fastestCompletion updated to 18s');
    ok(app.storage.data.gamification.currentStreak === 1, 'gamification streak synced by addPractice');
  }

  console.log('--- PHASE 3: DASHBOARD SVG CHART + TABLES ---');
  {
    const { app } = buildApp();
    for (let i = 1; i <= 12; i++) {
      app.storage.addPractice({
        date: TODAY, mode: 'letters', lessonId: 'lesson-01', lessonTitle: '基準鍵 F J',
        wpm: 20 + i, accuracy: 88 + (i % 10), errors: 1, duration: 30, durationMs: 30000,
        correctCharacters: 20, totalCharacters: 21, errorKeys: {}, completed: true
      });
    }
    app.openStats();
    ok(app.el.statsChart.innerHTML.startsWith('<svg'), 'SVG chart rendered with 10 points');
    ok(app.el.statsChartTitle.textContent.includes('最近 10'), 'chart title shows recent 10');
    ok(app.el.statsTrend.textContent.includes('較前 5 次'), 'trend comparison text shown');
    ok(app.el.statsRecent.textContent.includes('10'), 'recent summary shown');

    // 表格三模式
    app._renderStatsTable('compare');
    ok(app.el.statsTable.innerHTML.includes('<thead>'), 'compare table rendered');
    ok(app.el.statsTable.innerHTML.includes('平均 WPM'), 'compare table has average row');
    app._renderStatsTable('tasks');
    ok(app.el.statsTableTitle.textContent === '今日任務', 'tasks table title');
    app._renderStatsTable('record');
    ok(app.el.statsTableTitle.textContent === '練習紀錄（最近 10 筆）', 'record table title');
  }

  console.log('--- PHASE 3: RESULT PAGE XP + ACHIEVEMENT TOAST ---');
  {
    const { app } = buildApp();
    startActive(app, TYPE_LESSON);
    feedKey(app, 'a');
    app.timer._base = Date.now() - 5000;
    typeText(app, TYPE_TEXT.slice(1));
    ok(app.screen === 'result', 'result screen shown');
    ok(app.el.resultXp.textContent.includes('經驗值') && app.el.resultXp.textContent.includes('XP'),
      'result xp line rendered');
    ok(app.el.resultBest.textContent.includes('個人最佳'), 'result best line rendered');
  }

  console.log('--- RESULT ---');
  console.log(`Phase 3: pass = ${pass} fail = ${fail}`);
  process.exit(fail > 0 ? 1 : 0);
})();