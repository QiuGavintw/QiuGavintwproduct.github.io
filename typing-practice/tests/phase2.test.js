'use strict';
const { buildApp } = require('./harness');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS', name); }
  else { fail++; console.log('  FAIL', name); }
}

const L1 = { id: 't-lesson', title: 'T', level: 1, type: 'letters', requiredAccuracy: 85, requiredCompletions: 2, texts: ['ab cd'] };

(async () => {
  console.log('--- PHASE 2: FINGER MAPPING ---');
  {
    const { app, mod } = buildApp();
    await app.lessons.load();
    const F = mod.FINGERS;
    ok(F.q === 'left-pinky', 'Q -> 左小指');
    ok(F.a === 'left-pinky', 'A -> 左小指');
    ok(F.e === 'left-middle', 'E -> 左中指');
    ok(F.f === 'left-index', 'F -> 左食指');
    ok(F.g === 'left-index', 'G -> 左食指');
    ok(F.h === 'right-index', 'H -> 右食指');
    ok(F.j === 'right-index', 'J -> 右食指');
    ok(F.i === 'right-middle', 'I -> 右中指');
    ok(F.p === 'right-pinky', 'P -> 右小指');
    ok(mod.FINGER_LABELS['left-index'].zh === '左手食指', 'label zh 左手食指');
    ok(mod.fingerOf('G') === 'left-index', 'fingerOf uppercase G normalized');
    ok(mod.fingerOf(' ') === 'thumb', 'space -> thumb');
  }

  console.log('--- PHASE 2: LESSON UNLOCK ---');
  {
    const { app } = buildApp();
    await app.lessons.load();
    const list = app.lessons.list();
    const l1 = list[0];
    const l2 = list[1];
    ok(app._isLessonUnlocked(l1, 0), 'lesson-01 unlocked initially');
    ok(!app._isLessonUnlocked(l2, 1), 'lesson-02 locked initially');

    app._updateLessonProgress(l1, { wpm: 20, accuracy: 50 });
    ok(!app._isLessonCompleted(l1), 'low accuracy -> not completed');
    ok(!app._isLessonUnlocked(l2, 1), 'lesson-02 still locked after low accuracy');

    const r1 = app._updateLessonProgress(l1, { wpm: 25, accuracy: 95 });
    const r2 = app._updateLessonProgress(l1, { wpm: 30, accuracy: 96 });
    ok(r1.showComplete === true, 'course complete event fired on completing condition');
    ok(r2.showComplete === false, 'no repeat completion event');
    ok(app._isLessonCompleted(l1), 'lesson-01 completed after 2 high-accuracy runs');
    ok(app._isLessonUnlocked(l2, 1), 'lesson-02 unlocked after completion');
  }

  console.log('--- PHASE 2: PROGRESS ---');
  {
    const { app, localStorage } = buildApp();
    await app.lessons.load();
    const l1 = app.lessons.list()[0];
    const p1 = app.storage.data.lessonProgress[l1.id] || { completions: 0, bestWpm: 0, bestAccuracy: 0, completed: false };
    ok(p1.completions === 0, 'starts at 0 completions');

    app._updateLessonProgress(l1, { wpm: 22, accuracy: 88 });
    app._updateLessonProgress(l1, { wpm: 18, accuracy: 90 });

    const cur = app._getProgress(l1);
    ok(cur.completions === 2, 'completions incremented to 2');
    ok(cur.bestWpm === 22, 'bestWpm keeps max (22)');
    ok(cur.bestAccuracy === 90, 'bestAccuracy keeps max (90)');

    const saved = app.storage.data.lessonProgress[l1.id];
    ok(saved && saved.completions === 2, 'stored in storage data');

    const { app: app2 } = buildApp({ storage: localStorage });
    await app2.lessons.load();
    ok(app2.storage.data.lessonProgress[l1.id] && app2.storage.data.lessonProgress[l1.id].completions === 2,
      'progress persists after reload');
  }

  console.log('--- PHASE 2: WEAKNESS ---');
  {
    const { app, mod } = buildApp();
    await app.lessons.load();

    const eng = new mod.PracticeEngine(L1, { mode: 'beginner' });
    eng.handleKey('x');   // 錯 a
    eng.handleKey('x');   // 錯 a 再次
    eng.handleKey('a');   // 對
    eng.handleKey('q');   // 錯 b
    ok(eng.errorCounts.a === 2, 'errorCounts counts expected key a twice');
    ok(eng.errorCounts.b === 1, 'errorCounts counts b once');
    ok(eng.errors === 3, 'errors total 3');

    const analysis = mod.Weakness.analyzeErrorCounts({ e: 5, i: 4, r: 3 });
    ok(analysis.keys[0].key === 'e' && analysis.keys[0].count === 5, 'top wrong key is E (5)');
    ok(analysis.keys[1].key === 'i', 'second is I');
    const hasFinger = analysis.fingers.some(f => f.finger === 'right-middle');
    ok(hasFinger, 'I -> 右中指 in finger stats');

    const lesson = mod.Weakness.buildWeaknessLesson(['e', 'r', 'p']);
    ok(lesson.texts.length >= 4, 'weakness lesson generates texts');
    const allowed = /^[erp ]+$/;
    ok(lesson.texts.every(t => allowed.test(t)) || lesson.texts.some(t => allowed.test(t) || t.includes('asdf jkl;')),
      'weakness texts contain only weak keys (plus anchor)');
    ok(lesson.texts.join().includes('e') && lesson.texts.join().includes('r') && lesson.texts.join().includes('p'),
      'all weak keys appear');

    // 從歷史紀錄推薦
    app.storage.data.practiceHistory.push(
      { errorKeys: { p: 3, i: 2, r: 1 } },
      { errorKeys: { p: 4 } }
    );
    const counts = mod.Weakness.combineErrorCounts(app.storage.data.practiceHistory);
    ok(counts.p === 7 && counts.i === 2, 'combineErrorCounts aggregates records');
    app._refreshRecommendation();
    ok(app._recKeys.length === 3 && app._recKeys[0] === 'p', 'home recommendation picks P first');
  }

  console.log('--- PHASE 2: MODE ---');
  {
    const { mod } = buildApp();
    const L = { id: 't', title: 'T', type: 'letters', texts: ['ab cd'] };

    const bg = new mod.PracticeEngine(L, { mode: 'beginner' });
    let r = bg.handleKey('x');                 // 錯 a
    ok(r.type === 'error' && bg.index === 0, 'beginner: wrong key does not advance');
    bg.handleKey('a');                         // 對
    ok(bg.index === 1 && bg.correctChars === 1, 'beginner: correct advances');

    const nm = new mod.PracticeEngine(L, { mode: 'normal' });
    let rn = nm.handleKey('x');                // 錯 a，但繼續
    ok(rn.type === 'error' && nm.index === 1, 'normal: wrong key advances');
    ok(nm.errors === 1 && nm.correctChars === 0, 'normal: error recorded, not counted correct');
    nm.handleKey('b');
    ok(nm.index === 2, 'normal: continues typing');

    // 全部打錯也能完成（錯誤被記錄但不停頓）
    const nm2 = new mod.PracticeEngine(L, { mode: 'normal' });
    for (const _ of 'ab cd') nm2.handleKey('0');
    ok(nm2.isDone === true, 'normal: engine finishes even with all errors');
    ok(nm2.errors === 5 && nm2.correctChars === 0, 'normal: all 5 errors recorded');
    ok(nm2.errorCounts.a === 1 && nm2.errorCounts.c === 1 && nm2.errorCounts.d === 1 && nm2.errorCounts[' '] === 1,
      'normal: errorCounts tracked per expected key including space');
  }

  console.log('--- PHASE 2: INTRO MODAL + SETTINGS + MODAL RENDER ---');
  {
    const { app, localStorage } = buildApp();
    await app.lessons.load();
    const list = app.lessons.list();
    const l1 = list[0];

    // 第一次進入：顯示課程介紹
    app.startPractice(l1);
    ok(app.el.introModal._classes.has('hidden') === false, 'intro modal shown on first entry');
    ok(app.phase === 'countdown', 'countdown not started yet while intro shown');
    app.closeIntroAndStart();
    ok(app.el.introModal._classes.has('hidden') === true, 'intro modal closes on start');
    ok(app.phase === 'countdown', 'countdown starts after intro');

    // 第二次進入（已有一次完成）：不再顯示
    app._updateLessonProgress(l1, { wpm: 10, accuracy: 90 });
    app.startPractice(l1);
    ok(app.el.introModal._classes.has('hidden') === true, 'intro not shown on later entries');

    // 設定頁開關難度
    app.setDifficulty('normal');
    ok(app.storage.data.settings.difficulty === 'normal', 'difficulty saved as normal');
    ok(app.settings.difficulty === 'normal', 'app.settings reflects change');

    // 清除資料
    app.clearAllData();
    ok(app.storage.data.settings.difficulty === 'beginner', 'clear resets difficulty to beginner');
    ok(app.storage.data.practiceHistory.length === 0, 'clear resets history');
    ok((app.storage.data.lessonProgress && Object.keys(app.storage.data.lessonProgress).length) === 0,
      'clear resets lesson progress');

    // 課程 Modal 渲染（不崩潰）
    app.openLessonModal();
    ok(app.el.lessonList.children.length >= 6, 'lesson modal renders all lessons');
    const { app: appFresh } = buildApp({ storage: localStorage });
    await appFresh.lessons.load();
    ok(appFresh.storage.data.practiceHistory.length === 0, 'clear persists (history empty after reload)');
  }

  console.log('--- PHASE 2: WORDS / SENTENCES DATA ---');
  {
    const { app } = buildApp({ fetchOk: true });
    await app.lessons.load();
    const words = app.lessons.words;
    const totalWords = (words.easy.length + words.medium.length + words.hard.length);
    ok(totalWords >= 100, `words pool >= 100 (got ${totalWords})`);
    ok(app.lessons.sentences.length >= 50, `sentences pool >= 50 (got ${app.lessons.sentences.length})`);
    const wordLesson = app.lessons.list().find(l => l.type === 'words');
    ok(wordLesson && wordLesson.texts.length >= 10, 'words lesson has generated texts');
    const sentLesson = app.lessons.list().find(l => l.type === 'sentences');
    ok(sentLesson && sentLesson.texts.length >= 5, 'sentences lesson has generated texts');
  }

  console.log('--- RESULT ---');
  console.log('Phase 2: pass =', pass, 'fail =', fail);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });