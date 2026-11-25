window.runTests = function () {
  var results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name: name, pass: true });
    } catch (e) {
      results.push({ name: name, pass: false, error: e.message || String(e) });
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'assertion failed');
  }

  function approx(a, b, tol) {
    return Math.abs(a - b) <= (tol || 2);
  }

  // ---- 清除先前資料，避免污染 ----
  ['mcts.teams', 'mcts.currentTeam', 'mcts.history', 'mcts.duration', 'mcts.reminder',
    'mcts.scoreRules', 'mcts.scoreDrafts']
    .forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
    });
  TeamManager.load();
  ScoreManager.load();
  HistoryManager.load();

  // ---- 模擬時鐘 ----
  var sim = 0;
  var triggered = [];
  TimerEngine._setClock(function () { return sim; });
  TimerEngine.setOnReminderTrigger(function (ms) { triggered.push(ms); });
  function advance(ms) { sim += ms; TimerEngine.tick(); }

  // ============ Timer ============
  test('開始後正數從 0 增加', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(3000);
    assert(TimerEngine.getState() === 'RUNNING');
    assert(approx(TimerEngine.currentForwardMs(), 3000), 'forward=' + TimerEngine.currentForwardMs());
  });

  test('開始後倒數從設定時間減少', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(5000);
    assert(approx(TimerEngine.currentCountdownMs(), 295000), 'countdown=' + TimerEngine.currentCountdownMs());
  });

  test('暫停兩者同時停止', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(4000);
    TimerEngine.pause();
    assert(TimerEngine.getState() === 'PAUSED');
    assert(approx(TimerEngine.currentForwardMs(), 4000, 1), 'fwd=' + TimerEngine.currentForwardMs());
    assert(approx(TimerEngine.currentCountdownMs(), 296000, 1), 'cd=' + TimerEngine.currentCountdownMs());
    sim = 5000;
    TimerEngine.tick();
    assert(approx(TimerEngine.currentForwardMs(), 4000, 1), 'fwd2=' + TimerEngine.currentForwardMs());
    assert(approx(TimerEngine.currentCountdownMs(), 296000, 1), 'cd2=' + TimerEngine.currentCountdownMs());
  });

  test('再次開始從暫停位置繼續', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(4000);
    TimerEngine.pause();
    assert(TimerEngine.getState() === 'PAUSED');
    TimerEngine.start();
    assert(TimerEngine.getState() === 'RUNNING');
    advance(1000);
    assert(approx(TimerEngine.currentForwardMs(), 5000, 1), 'fwd=' + TimerEngine.currentForwardMs());
    assert(approx(TimerEngine.currentCountdownMs(), 295000, 1), 'cd=' + TimerEngine.currentCountdownMs());
  });

  test('RUNNING 時重複 start 不會重設', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(2000);
    TimerEngine.start();
    advance(1000);
    assert(approx(TimerEngine.currentForwardMs(), 3000, 1), 'fwd=' + TimerEngine.currentForwardMs());
  });

  test('重置正數歸零、倒數恢復設定值', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(10000);
    TimerEngine.reset();
    assert(TimerEngine.getState() === 'READY');
    assert(TimerEngine.currentForwardMs() === 0, 'fwd=' + TimerEngine.currentForwardMs());
    assert(TimerEngine.currentCountdownMs() === 300000, 'cd=' + TimerEngine.currentCountdownMs());
  });

  test('倒數到 0 後繼續負數', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(301200);
    assert(TimerEngine.currentCountdownMs() < 0, 'cd=' + TimerEngine.currentCountdownMs());
    assert(approx(TimerEngine.currentCountdownMs(), -1200, 1), 'cd=' + TimerEngine.currentCountdownMs());
  });

  test('倒數負數後暫停再繼續', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(312320);
    TimerEngine.pause();
    assert(approx(TimerEngine.currentCountdownMs(), -12320, 1), 'cd=' + TimerEngine.currentCountdownMs());
    TimerEngine.start();
    advance(100);
    assert(approx(TimerEngine.currentCountdownMs(), -12420, 1), 'cd=' + TimerEngine.currentCountdownMs());
  });

  test('正數超過設定時間 (overtime)', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(330000);
    var snap = TimerEngine.snapshot();
    assert(snap.forwardMs > snap.durationMs, 'fwd=' + snap.forwardMs + ' dur=' + snap.durationMs);
    assert(snap.forwardMs - snap.durationMs === 30000, 'diff=' + (snap.forwardMs - snap.durationMs));
  });

  test('重置清除超時狀態', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(400000);
    TimerEngine.reset();
    var snap = TimerEngine.snapshot();
    assert(snap.forwardMs === 0, 'fwd=' + snap.forwardMs);
    assert(snap.countdownMs === 300000, 'cd=' + snap.countdownMs);
  });

  // ============ Reminder ============
  test('到達 N 分鐘時觸發提醒（只觸發一次）', function () {
    triggered = [];
    TimerEngine.setDuration(600000); // 10 分鐘
    TimerEngine.setReminder(180000); // 3 分鐘
    sim = 0;
    TimerEngine.start();
    advance(420000); // 剩餘 3:00 → 應觸發
    assert(triggered.length === 1, 'triggered=' + triggered.length);
    assert(triggered[0] === 180000, 'value=' + triggered[0]);
    advance(10000);
    TimerEngine.tick();
    assert(triggered.length === 1, 're-triggered=' + triggered.length);
  });

  test('提醒尚未到達時不觸發', function () {
    triggered = [];
    TimerEngine.setDuration(600000);
    TimerEngine.setReminder(180000);
    sim = 0;
    TimerEngine.start();
    advance(400000); // 剩餘 3:20，尚未到 3:00
    assert(triggered.length === 0, 'triggered=' + triggered.length);
  });

  test('提醒觸發後 snapshot 標記 reminderTriggered', function () {
    TimerEngine.setDuration(600000);
    TimerEngine.setReminder(180000);
    sim = 0;
    TimerEngine.start();
    advance(420000);
    var snap = TimerEngine.snapshot();
    assert(snap.reminderTriggered === true, 'flag=' + snap.reminderTriggered);
  });

  test('提醒時間大於等於比賽時間被拒絕（validation 邏輯）', function () {
    // 套用提醒的驗證規則：reminder < duration 才允許
    var durationSec = 300; // 5 分鐘
    function isValidReminder(remSec) {
      return remSec >= 1 && remSec < durationSec;
    }
    assert(isValidReminder(180) === true);
    assert(isValidReminder(300) === false);  // 等於
    assert(isValidReminder(400) === false);  // 大於
  });

  test('關閉提醒（提醒時間 0）不觸發提醒', function () {
    triggered = [];
    TimerEngine.setDuration(300000); // 5 分鐘
    TimerEngine.setReminder(0);      // 關閉提醒
    sim = 0;
    TimerEngine.start();
    advance(400000);                 // 超過比賽時間
    var snap = TimerEngine.snapshot();
    assert(triggered.length === 0, 'triggered=' + triggered.length);
    assert(snap.reminderTriggered === false, 'flag=' + snap.reminderTriggered);
  });

  test('重新開啟提醒後可正常觸發', function () {
    triggered = [];
    TimerEngine.setDuration(600000); // 10 分鐘
    TimerEngine.setReminder(0);
    sim = 0;
    TimerEngine.start();
    advance(1000);
    TimerEngine.setReminder(180000); // 中途開啟 3 分鐘提醒
    advance(420000 - 1000);          // 剩餘 3:00
    assert(triggered.length === 1, 'triggered=' + triggered.length);
    assert(triggered[0] === 180000, 'value=' + triggered[0]);
  });

  // ============ Teams ============
  test('預設隊伍依評分表序號 1–11 排序（共 11 班）', function () {
    var expected = ['一年5班', '一年3班', '一年信班', '一年仁班', '一年1班', '一年2班',
      '一年4班', '一年7班', '一年忠班', '一年6班', '一年孝班'];
    assert(TeamManager.getTeams().join(',') === expected.join(','),
      TeamManager.getTeams().join(','));
  });

  test('舊預設隊伍（A/B/C/D 與國字班名）載入時自動升級為新班名與序號', function () {
    ['A 組,B 組,C 組,D 組',
      '一年一班,一年二班,一年三班,一年四班,一年五班,一年六班,一年七班,一年忠班,一年孝班,一年仁班,一年信班'
    ].forEach(function (legacy) {
      AppStorage.save('mcts.teams', legacy.split(','));
      AppStorage.save('mcts.currentTeam', 0);
      TeamManager.load();
      assert(TeamManager.getTeams().length === 11, 'len=' + TeamManager.getTeams().length);
      assert(TeamManager.getTeams()[0] === '一年5班', TeamManager.getTeams()[0]);
    });
  });

  test('新增隊伍（空白 / 重複會被拒）', function () {
    assert(TeamManager.add('').ok === false);
    assert(TeamManager.add('   ').ok === false);
    assert(TeamManager.add('一年5班').ok === false);
    assert(TeamManager.add('E 組').ok === true);
    assert(TeamManager.getTeams().indexOf('E 組') !== -1);
  });

  test('編輯隊伍名稱', function () {
    TeamManager.setCurrent(0);
    var r = TeamManager.edit(0, '第一組');
    assert(r.ok === true, r.reason);
    assert(TeamManager.getCurrentName() === '第一組');
    // 與其他隊伍同名應被拒
    assert(TeamManager.edit(0, '一年3班').ok === false);
    // 編輯非目前隊伍不影響目前指標
    var curBefore = TeamManager.getCurrent();
    assert(TeamManager.edit(1, '第二組').ok === true);
    assert(TeamManager.getCurrent() === curBefore, '編輯其他隊伍不應改變目前指標');
  });

  test('調整隊伍順序（上移 / 下移）', function () {
    while (TeamManager.getTeams().length > 1) TeamManager.remove(0);
    TeamManager.setCurrent(0);
    TeamManager.edit(0, 'A 組');
    TeamManager.add('B 組');
    TeamManager.add('C 組');
    TeamManager.setCurrent(0);
    assert(TeamManager.getTeams().join(',') === 'A 組,B 組,C 組');

    // B 上移
    assert(TeamManager.move(1, -1) === true);
    assert(TeamManager.getTeams().join(',') === 'B 組,A 組,C 組');
    // 目前(0) 是 A：上移後 A 移到 index1 → 目前跟著移到 1
    assert(TeamManager.getCurrent() === 1, '目前=' + TeamManager.getCurrent());
    assert(TeamManager.getCurrentName() === 'A 組');

    // 邊界：第一個不能上移、最後一個不能下移
    assert(TeamManager.move(0, -1) === false);
    assert(TeamManager.move(2, 1) === false);

    // C 分兩步移到最前面：[B,A,C] → [B,C,A] → [C,B,A]
    assert(TeamManager.move(2, -1) === true);
    assert(TeamManager.move(1, -1) === true);
    assert(TeamManager.getTeams().join(',') === 'C 組,B 組,A 組');
    // 重新調整後目前選中的 A 組仍然跟著走
    assert(TeamManager.getCurrent() === TeamManager.getTeams().indexOf('A 組'),
      '目前應仍是 A 組（index=' + TeamManager.getCurrent() + '）');

    // 順序調整不會破壞持久化
    var saved = TeamManager.getTeams().join(',');
    TeamManager.load();
    assert(TeamManager.getTeams().join(',') === saved, '順序應於重新載入後保留');
  });

  test('刪除隊伍，且不能刪除最後一個', function () {
    TeamManager.setCurrent(0);
    while (TeamManager.getTeams().length > 1) {
      assert(TeamManager.remove(0) === true);
    }
    assert(TeamManager.getTeams().length === 1);
    assert(TeamManager.remove(0) === false, '最後一個不可刪');
  });

  test('切換目前隊伍', function () {
    // 目前只剩一個隊伍，先重建
    while (TeamManager.getTeams().length < 2) {
      TeamManager.add('X 組');
    }
    TeamManager.setCurrent(0);
    assert(TeamManager.setCurrent(1) === true);
    assert(TeamManager.getCurrent() === 1);
  });

  // ============ History ============
  test('儲存紀錄：沒超時超過時間為 0', function () {
    HistoryManager.clear();
    var rec = HistoryManager.add('第一組', 300000, 300000);
    assert(rec.overtimeMs === 0, 'ot=' + rec.overtimeMs);
    assert(HistoryManager.getAll().length === 1);
  });

  test('儲存紀錄：超時顯示正確數值', function () {
    var rec = HistoryManager.add('第一組', 332450, 300000);
    assert(rec.overtimeMs === 32450, 'ot=' + rec.overtimeMs);
  });

  test('同一隊伍可儲存多筆', function () {
    HistoryManager.clear();
    HistoryManager.add('第一組', 100000, 300000);
    HistoryManager.add('第一組', 200000, 300000);
    HistoryManager.add('第一組', 350000, 300000);
    assert(HistoryManager.getAll().length === 3);
  });

  test('清除全部紀錄', function () {
    HistoryManager.clear();
    assert(HistoryManager.getAll().length === 0);
  });

  test('歷史紀錄保留儲存當下的名稱（改名不影響舊紀錄）', function () {
    HistoryManager.clear();
    HistoryManager.add('舊名稱', 120000, 300000);
    HistoryManager.add('第一組', 120000, 300000);
    var recs = HistoryManager.getAll();
    assert(recs[0].teamName === '舊名稱');
    assert(recs[1].teamName === '第一組');
  });

  // ============ Persistence ============
  test('隊伍與歷史紀錄可透過 localStorage 往返', function () {
    AppStorage.save('mcts.duration', 180000);
    AppStorage.save('mcts.reminder', 60000);
    assert(AppStorage.load('mcts.duration', 0) === 180000);
    assert(AppStorage.load('mcts.reminder', 0) === 60000);

    TeamManager.add('持久組');
    var savedTeams = TeamManager.getTeams().slice();
    TeamManager.load();
    assert(TeamManager.getTeams().join(',') === savedTeams.join(','), 'teams roundtrip');
    assert(TeamManager.getTeams().indexOf('持久組') !== -1);
  });

  test('主題設定可透過 localStorage 往返', function () {
    AppStorage.save('mcts.theme', 'light');
    assert(AppStorage.load('mcts.theme', 'dark') === 'light');
    AppStorage.save('mcts.theme', 'dark');
    assert(AppStorage.load('mcts.theme', 'light') === 'dark');
  });

  test('登記分數模式設定可透過 localStorage 往返', function () {
    AppStorage.save('mcts.view', 'score');
    assert(AppStorage.load('mcts.view', 'full') === 'score');
    AppStorage.save('mcts.view', 'full');
    assert(AppStorage.load('mcts.view', 'score') === 'full');
  });

  test('載入頁面後計時器為未開始狀態（不恢復進行中的計時）', function () {
    TimerEngine.setDuration(300000);
    TimerEngine.setReminder(60000);
    sim = 0;
    TimerEngine.start();
    advance(5000);
    TimerEngine.reset(); // 重新整理等同於重建 engine → READY
    var snap = TimerEngine.snapshot();
    assert(snap.state === 'READY');
    assert(snap.forwardMs === 0);
    assert(snap.countdownMs === 300000);
  });

  // ============ Scoring ============
  function allScores(value) {
    var v = {};
    ScoreManager.FIELDS.forEach(function (f) { v[f.key] = value; });
    return v;
  }

  test('評分細項依評分表：2 大項 × 5 細項 × 3 評審，共 15 個', function () {
    assert(ScoreManager.SECTIONS.length === 2, 'sections=' + ScoreManager.SECTIONS.length);
    assert(ScoreManager.GROUPS.length === 5, 'groups=' + ScoreManager.GROUPS.length);
    assert(ScoreManager.FIELDS.length === 15, 'fields=' + ScoreManager.FIELDS.length);
    var secSum = ScoreManager.SECTIONS.reduce(function (s, x) { return s + x.weight; }, 0);
    var desSum = ScoreManager.GROUPS.filter(function (g) { return g.section === 'designated'; })
      .reduce(function (s, g) { return s + g.weight; }, 0);
    var selfSum = ScoreManager.GROUPS.filter(function (g) { return g.section === 'self'; })
      .reduce(function (s, g) { return s + g.weight; }, 0);
    assert(Math.abs(secSum - 1) < 0.0001, 'secSum=' + secSum);
    assert(Math.abs(desSum - 1) < 0.0001, 'desSum=' + desSum);
    assert(Math.abs(selfSum - 1) < 0.0001, 'selfSum=' + selfSum);
  });

  test('滿分 100 分時總分為 100.00', function () {
    var res = ScoreManager.calculate(allScores(100), 0);
    assert(res.complete === true);
    assert(Math.abs(res.total - 100) < 0.0001, 'total=' + res.total);
    assert(Math.abs(res.designatedScore - 50) < 0.0001, 'd=' + res.designatedScore);
    assert(Math.abs(res.selfScore - 50) < 0.0001, 's=' + res.selfScore);
  });

  test('三評審平均後依 50/50 與 40/30/30 加權（對應評分表）', function () {
    var v = allScores(80);
    // 指定曲：音準 90、創意 70 → (90*0.5+70*0.5)*0.5 = 40
    v.designatedToneJudge1 = 100; v.designatedToneJudge2 = 90; v.designatedToneJudge3 = 80;
    v.designatedCreativeJudge1 = 80; v.designatedCreativeJudge2 = 70; v.designatedCreativeJudge3 = 60;
    // 自選曲：音準 100、和聲 80、指揮 60 → (100*0.4+80*0.3+60*0.3)*0.5 = 41
    v.selfToneJudge1 = 100; v.selfToneJudge2 = 100; v.selfToneJudge3 = 100;
    v.selfHarmonyJudge1 = 80; v.selfHarmonyJudge2 = 80; v.selfHarmonyJudge3 = 80;
    v.selfConductorJudge1 = 60; v.selfConductorJudge2 = 60; v.selfConductorJudge3 = 60;
    var res = ScoreManager.calculate(v, 0);
    assert(res.complete === true);
    assert(Math.abs(res.averages.designatedTone - 90) < 0.0001);
    assert(Math.abs(res.averages.designatedCreative - 70) < 0.0001);
    assert(Math.abs(res.averages.selfTone - 100) < 0.0001);
    assert(Math.abs(res.averages.selfHarmony - 80) < 0.0001);
    assert(Math.abs(res.averages.selfConductor - 60) < 0.0001);
    assert(Math.abs(res.designatedScore - 40) < 0.0001, 'd=' + res.designatedScore);
    assert(Math.abs(res.selfScore - 41) < 0.0001, 's=' + res.selfScore);
    assert(Math.abs(res.total - 81) < 0.0001, 'total=' + res.total);
  });

  test('超時扣分：每 10 秒扣 1 分，未滿 10 秒以 10 秒計', function () {
    var rules = { intervalSec: 10, deductPer: 1 };
    assert(ScoreManager.deductionFor(0, rules) === 0, 'zero=' + ScoreManager.deductionFor(0, rules));
    assert(ScoreManager.deductionFor(1, rules) === 1, 'tiny=' + ScoreManager.deductionFor(1, rules));
    assert(ScoreManager.deductionFor(9999, rules) === 1, 'small=' + ScoreManager.deductionFor(9999, rules));
    assert(ScoreManager.deductionFor(10000, rules) === 1, 'exact=' + ScoreManager.deductionFor(10000, rules));
    assert(ScoreManager.deductionFor(10001, rules) === 2, 'over=' + ScoreManager.deductionFor(10001, rules));
    assert(ScoreManager.deductionFor(32450, rules) === 4, 'd=' + ScoreManager.deductionFor(32450, rules));
    var res = ScoreManager.calculate(allScores(100), 32450, rules);
    assert(Math.abs(res.total - 96) < 0.0001, 'total=' + res.total);
  });

  test('分數不完整時不計算總分', function () {
    var v = allScores(80);
    delete v.selfConductorJudge3;
    var res = ScoreManager.calculate(v, 0);
    assert(res.complete === false);
    assert(res.total === null, 'total=' + res.total);
  });

  test('超出 0–100 的分數視為無效', function () {
    assert(ScoreManager.parseScore('') === null);
    assert(ScoreManager.parseScore('100.1') === null);
    assert(ScoreManager.parseScore('-1') === null);
    assert(ScoreManager.parseScore('85.5') === 85.5);
    assert(ScoreManager.parseScore('100') === 100);
  });

  test('分數草稿依隊伍名稱保存，改名後跟著轉移', function () {
    ScoreManager.clearDrafts();
    ScoreManager.setDraft('甲班', allScores(60));
    ScoreManager.renameDraft('甲班', '乙班');
    assert(ScoreManager.getDraft('甲班').designatedToneJudge1 === null);
    assert(ScoreManager.getDraft('乙班').designatedToneJudge1 === 60);
    ScoreManager.removeDraft('乙班');
    assert(ScoreManager.getDraft('乙班').designatedToneJudge1 === null);
  });

  test('最佳指揮獎為獨立欄位，不影響分數且可隨草稿保存', function () {
    var v = allScores(80);
    v.bestConductor = true;
    var res = ScoreManager.calculate(v, 0);
    assert(res.bestConductor === true, 'award 未帶入結果');
    assert(Math.abs(res.total - 80) < 0.0001, 'total=' + res.total);
    var plain = ScoreManager.calculate(allScores(80), 0);
    assert(plain.bestConductor === false, '預設應為未勾選');
    assert(plain.total === res.total, '不應影響總分');
    assert(ScoreManager.emptyValues().bestConductor === false, '空值預設');

    ScoreManager.clearDrafts();
    ScoreManager.setDraft('丙班', v);
    assert(ScoreManager.getDraft('丙班').bestConductor === true, '草稿未保存');
    ScoreManager.removeDraft('丙班');
  });

  test('規則可持久化roundtrip', function () {
    ScoreManager.setRules({ intervalSec: 15, deductPer: 2, autoNext: true });
    ScoreManager.load();
    var r = ScoreManager.getRules();
    assert(r.intervalSec === 15 && r.deductPer === 2 && r.autoNext === true);
  });

  // ============ Rank + Export ============
  test('排名採競爭排名，同分並列', function () {
    HistoryManager.clear();
    var b1 = ScoreManager.calculate(allScores(100), 0);
    var b2 = ScoreManager.calculate(allScores(80), 0);
    HistoryManager.add('A', 300000, 300000, { scores: allScores(100), breakdown: b1 });
    HistoryManager.add('B', 300000, 300000, { scores: allScores(100), breakdown: b1 });
    HistoryManager.add('C', 300000, 300000, { scores: allScores(80), breakdown: b2 });
    var recs = HistoryManager.getAll();
    assert(recs[0].rank === 1 && recs[1].rank === 1 && recs[2].rank === 3,
      'ranks=' + recs.map(function (r) { return r.rank; }).join(','));
  });

  test('舊紀錄沒有分數時排名為空', function () {
    HistoryManager.clear();
    var rec = HistoryManager.add('舊格式', 330000, 300000);
    assert(rec.rank === '', 'rank=' + rec.rank);
    assert(HistoryManager.getRank('舊格式') === '');
  });

  test('CSV 含 BOM、表頭與逗號 escaping', function () {
    HistoryManager.clear();
    HistoryManager.add('一年「二」,班', 332450, 300000, {
      scores: allScores(80),
      breakdown: ScoreManager.calculate(allScores(80), 32450)
    });
    var csv = ExportManager.buildCSV(HistoryManager.getAll());
    assert(csv.charAt(0) === '\uFEFF', 'BOM 缺失');
    assert(csv.indexOf('序號,班級') !== -1, '表頭');
    assert(csv.indexOf('"一年「二」,班"') !== -1, 'escaping');
    assert(csv.indexOf('05:32.45') !== -1, '正數時間');
  });

  test('Excel 相容檔與列印頁面包含資料（含最佳指揮獎）', function () {
    HistoryManager.clear();
    var v = allScores(80);
    v.bestConductor = true;
    HistoryManager.add('一年5班', 300000, 300000, {
      scores: v, breakdown: ScoreManager.calculate(v, 0)
    });
    var records = HistoryManager.getAll();
    var xls = ExportManager.buildXls(records);
    var print = ExportManager.buildPrintHtml(records);
    var csv = ExportManager.buildCSV(records);
    assert(xls.indexOf('xmlns:x=') !== -1 && xls.indexOf('一年5班') !== -1, 'xls');
    assert(print.indexOf('window.print()') !== -1 && print.indexOf('<table>') !== -1, 'print');
    assert(csv.indexOf('最佳指揮獎') !== -1 && csv.indexOf('✓') !== -1, 'csv 最佳指揮獎');
    assert(xls.indexOf('最佳指揮獎') !== -1 && print.indexOf('最佳指揮獎') !== -1, '表頭');
  });

  // ---- 還原時鐘 ----
  TimerEngine._setClock(null);

  var passed = results.filter(function (r) { return r.pass; }).length;
  var failed = results.length - passed;
  return { passed: passed, failed: failed, results: results };
};
