(function () {
  var S = TimerEngine.STATES;
  var MAX_DURATION_MS = 99 * 60 * 1000;

  var fwdEl = document.getElementById('forward-time');
  var cdEl = document.getElementById('countdown-time');
  var fwdCell = document.getElementById('forward-cell');
  var cdCell = document.getElementById('countdown-cell');
  var statusEl = document.getElementById('status-badge');
  var currentNameEl = document.getElementById('current-team-name');
  var reminderMsgEl = document.getElementById('reminder-message');
  var teamListEl = document.getElementById('team-list');
  var historyBody = document.getElementById('history-body');
  var historyEmpty = document.getElementById('history-empty');
  var scoreFieldsEl = document.getElementById('score-fields');
  var scoreHintEl = document.getElementById('score-hint');

  var btnStart = document.getElementById('btn-start');
  var btnPause = document.getElementById('btn-pause');
  var btnReset = document.getElementById('btn-reset');
  var btnSave = document.getElementById('btn-save');
  var btnSettings = document.getElementById('btn-settings');
  var btnTheme = document.getElementById('btn-theme');
  var btnMode = document.getElementById('btn-mode');
  var btnAddTeam = document.getElementById('btn-add-team');
  var btnClearHistory = document.getElementById('btn-clear-history');
  var btnSaveScore = document.getElementById('btn-save-score');
  var btnSaveRecordScore = document.getElementById('btn-save-record-score');
  var scoreTeamSelect = document.getElementById('score-team-select');
  var btnExport = document.getElementById('btn-export');
  var exportMenu = document.getElementById('export-menu');

  var sumDesignated = document.getElementById('sum-designated');
  var sumSelf = document.getElementById('sum-self');
  var sumDeduct = document.getElementById('sum-deduct');
  var sumTotal = document.getElementById('sum-total');
  var sumRank = document.getElementById('sum-rank');

  var reminderMsgTimer = null;
  var lastFwdStr = '';
  var lastCdStr = '';
  var lastScoreSig = '';

  var ORDER_CHARS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
    '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];

  function pad2(n) { return String(n).padStart(2, '0'); }

  function formatTime(ms) {
    if (!isFinite(ms)) ms = 0;
    var neg = ms < 0;
    var abs = Math.abs(ms);
    var cs = Math.floor(abs / 10) % 100;
    var ts = Math.floor(abs / 1000);
    var s = ts % 60;
    var m = Math.floor(ts / 60);
    return (neg ? '-' : '') + pad2(m) + ':' + pad2(s) + '.' + pad2(cs);
  }

  function formatDurationText(totalSec) {
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    if (m > 0 && s === 0) return m + ' 分鐘';
    if (m > 0) return m + ' 分 ' + s + ' 秒';
    return s + ' 秒';
  }

  function reminderText(ms) {
    var totalSec = Math.round(ms / 1000);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    if (m > 0 && s === 0) return '剩餘 ' + m + ' 分鐘';
    if (m > 0) return '剩餘 ' + m + ' 分 ' + s + ' 秒';
    return '剩餘 ' + s + ' 秒';
  }

  function orderNum(i) { return ORDER_CHARS[i] || String(i + 1); }

  function scoreOrDash(value) {
    return (value === null || value === undefined || !isFinite(value)) ? '—' : Number(value).toFixed(2);
  }

  // ---------- 初始化 ----------
  TeamManager.load();
  HistoryManager.load();
  ScoreManager.load();

  var durationMs = AppStorage.load('mcts.duration', 300000);
  var savedReminderMs = AppStorage.load('mcts.reminder', 60000);
  var reminderEnabled = AppStorage.load('mcts.reminderEnabled', true);
  if (!(durationMs >= 1000)) durationMs = 300000;
  if (durationMs > MAX_DURATION_MS) durationMs = MAX_DURATION_MS;
  if (typeof reminderEnabled !== 'boolean') reminderEnabled = true;
  if (!(savedReminderMs >= 1000)) savedReminderMs = 0;
  if (savedReminderMs >= durationMs) savedReminderMs = 0;

  function effectiveReminderMs() {
    var d = TimerEngine.snapshot().durationMs;
    if (reminderEnabled && savedReminderMs >= 1000 && savedReminderMs < d) return savedReminderMs;
    return 0;
  }

  TimerEngine.setDuration(durationMs);
  TimerEngine.setReminder(effectiveReminderMs());
  TimerEngine.setOnReminderTrigger(function (ms) { showReminderMessage(ms); });

  // ---------- 明亮 / 深色模式 ----------
  function applyTheme(theme) {
    var light = theme === 'light';
    document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark');
    btnTheme.textContent = light ? '深色模式' : '明亮模式';
    btnTheme.setAttribute('aria-pressed', light ? 'true' : 'false');
    AppStorage.save('mcts.theme', light ? 'light' : 'dark');
  }

  applyTheme(document.documentElement.getAttribute('data-theme'));
  btnTheme.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });

  // ---------- 登記分數模式 ----------
  function currentView() {
    return document.documentElement.getAttribute('data-view') === 'score' ? 'score' : 'full';
  }

  function applyView(view) {
    var scoreOnly = view === 'score';
    document.documentElement.setAttribute('data-view', scoreOnly ? 'score' : 'full');
    btnMode.textContent = scoreOnly ? '返回計時台' : '登記分數模式';
    btnMode.setAttribute('aria-pressed', scoreOnly ? 'true' : 'false');
    AppStorage.save('mcts.view', scoreOnly ? 'score' : 'full');
    if (scoreOnly) activateTab('score');
  }

  applyView(currentView());
  btnMode.addEventListener('click', function () {
    applyView(currentView() === 'score' ? 'full' : 'score');
  });

  // ---------- 提醒訊息 ----------
  function showReminderMessage(ms) {
    reminderMsgEl.textContent = reminderText(ms);
    if (reminderMsgTimer) clearTimeout(reminderMsgTimer);
    reminderMsgTimer = setTimeout(function () { reminderMsgEl.textContent = ''; }, 10000);
  }

  function clearReminderMessage() {
    if (reminderMsgTimer) { clearTimeout(reminderMsgTimer); reminderMsgTimer = null; }
    reminderMsgEl.textContent = '';
  }

  // ---------- 評分輸入 ----------
  function scoreInputId(key) { return 'score-' + key; }

  function buildScoreFields() {
    scoreFieldsEl.innerHTML = '';
    ScoreManager.SECTIONS.forEach(function (section) {
      var card = document.createElement('div');
      card.className = 'score-card';
      var title = document.createElement('h3');
      title.textContent = section.label + '｜' + Math.round(section.weight * 100) + '%';
      card.appendChild(title);

      ScoreManager.GROUPS.filter(function (g) { return g.section === section.key; })
        .forEach(function (group) {
          var item = document.createElement('div');
          item.className = 'score-item';
          var itemTitle = document.createElement('h4');
          itemTitle.textContent = group.label + '（' + group.percent + '）';
          item.appendChild(itemTitle);

          for (var i = 1; i <= 3; i++) {
            var id = scoreInputId(group.key + 'Judge' + i);
            var row = document.createElement('div');
            row.className = 'judge-row';
            var label = document.createElement('label');
            label.htmlFor = id;
            label.textContent = '評審 ' + i;
            var input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '100';
            input.step = '0.5';
            input.id = id;
            input.setAttribute('aria-label', section.label + ' ' + group.label + ' 評審 ' + i);
            input.addEventListener('change', onScoreChange);
            input.addEventListener('input', function () { scoreHintEl.textContent = ''; });
            row.appendChild(label);
            row.appendChild(input);
            item.appendChild(row);
          }
          card.appendChild(item);
        });

      if (section.key === 'designated') {
        var award = document.createElement('div');
        award.className = 'award-option';
        var awardInput = document.createElement('input');
        awardInput.type = 'checkbox';
        awardInput.id = 'score-best-conductor';
        awardInput.className = 'award-checkbox';
        awardInput.setAttribute('aria-label', '最佳指揮獎');
        awardInput.addEventListener('change', function () {
          captureDraft();
          updateScoreSummary(true);
        });
        var awardLabel = document.createElement('label');
        awardLabel.htmlFor = awardInput.id;
        awardLabel.textContent = '最佳指揮獎';
        award.appendChild(awardInput);
        award.appendChild(awardLabel);
        card.appendChild(award);
      }

      scoreFieldsEl.appendChild(card);
    });
  }

  function onScoreChange(e) {
    var input = e.currentTarget;
    var raw = String(input.value || '').trim();
    if (raw === '') {
      input.value = '';
    } else {
      var n = Number(raw);
      if (!isFinite(n) || n < 0 || n > 100) {
        input.value = '';
        scoreHintEl.textContent = '分數需介於 0 到 100';
      } else {
        input.value = String(Math.round(n * 2) / 2);
        scoreHintEl.textContent = '';
      }
    }
    captureDraft();
    updateScoreSummary(true);
  }

  function collectValues() {
    var values = {};
    ScoreManager.FIELDS.forEach(function (f) {
      var el = document.getElementById(scoreInputId(f.key));
      values[f.key] = el ? ScoreManager.parseScore(el.value) : null;
    });
    var award = document.getElementById('score-best-conductor');
    values.bestConductor = award ? award.checked : false;
    return values;
  }

  function currentOverdeduction() {
    var snap = TimerEngine.snapshot();
    return Math.max(0, snap.forwardMs - snap.durationMs);
  }

  function captureDraft() {
    ScoreManager.setDraft(TeamManager.getCurrentName(), collectValues());
  }

  function loadDraft() {
    var values = ScoreManager.getDraft(TeamManager.getCurrentName());
    ScoreManager.FIELDS.forEach(function (f) {
      var el = document.getElementById(scoreInputId(f.key));
      if (el) el.value = values[f.key] === null ? '' : String(values[f.key]);
    });
    var award = document.getElementById('score-best-conductor');
    if (award) award.checked = values.bestConductor === true;
    scoreHintEl.textContent = '';
    updateScoreSummary(true);
  }

  function updateScoreSummary(force) {
    var values = collectValues();
    var overtime = currentOverdeduction();
    var rules = ScoreManager.getRules();
    var sig = JSON.stringify(values) + '|' + Math.floor(overtime / 1000) + '|' +
      rules.intervalSec + '|' + rules.deductPer;
    if (!force && sig === lastScoreSig) return;
    lastScoreSig = sig;

    var res = ScoreManager.calculate(values, overtime, rules);
    sumDesignated.textContent = scoreOrDash(res.designatedScore);
    sumSelf.textContent = scoreOrDash(res.selfScore);
    sumDeduct.textContent = Number(res.deduction).toFixed(2);
    sumTotal.textContent = scoreOrDash(res.total);
    sumRank.textContent = HistoryManager.getRank(TeamManager.getCurrentName()) || '—';
  }

  btnSaveScore.addEventListener('click', function () {
    captureDraft();
    UI.toast('已儲存「' + TeamManager.getCurrentName() + '」的分數草稿');
  });

  // ---------- 右側隊伍列表 ----------
  function iconBtn(act, glyph, title) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'icon-btn';
    b.textContent = glyph;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.setAttribute('data-act', act);
    return b;
  }

  function renderTeamList() {
    var teams = TeamManager.getTeams();
    var cur = TeamManager.getCurrent();
    teamListEl.innerHTML = '';

    teams.forEach(function (name, i) {
      var item = document.createElement('div');
      item.className = 'queue-item' + (i === cur ? ' active' : '');

      var main = document.createElement('div');
      main.className = 'queue-name';
      main.setAttribute('role', 'button');
      main.tabIndex = 0;
      main.setAttribute('aria-label', '切換至 ' + name);

      var num = document.createElement('span');
      num.className = 'queue-num';
      num.textContent = orderNum(i);
      var nm = document.createElement('span');
      nm.textContent = name;
      main.appendChild(num);
      main.appendChild(nm);
      if (i === cur) {
        var tag = document.createElement('span');
        tag.className = 'queue-tag';
        tag.textContent = '目前';
        main.appendChild(tag);
      }

      var actions = document.createElement('div');
      actions.className = 'team-actions';
      var upBtn = iconBtn('up', '↑', '上移 ' + name);
      var downBtn = iconBtn('down', '↓', '下移 ' + name);
      var editBtn = iconBtn('edit', '✎', '編輯 ' + name);
      var delBtn = iconBtn('delete', '✕', '刪除 ' + name);
      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      item.appendChild(main);
      item.appendChild(actions);
      teamListEl.appendChild(item);

      main.addEventListener('click', function () { switchTeam(i); });
      main.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchTeam(i); }
      });
      upBtn.addEventListener('click', function () { TeamManager.move(i, -1); renderTeamList(); });
      downBtn.addEventListener('click', function () { TeamManager.move(i, 1); renderTeamList(); });
      editBtn.addEventListener('click', function () { editTeam(i); });
      delBtn.addEventListener('click', function () { deleteTeam(i); });
    });

    currentNameEl.textContent = TeamManager.getCurrentName();
    renderScoreTeamSelect();
  }

  function renderScoreTeamSelect() {
    var teams = TeamManager.getTeams();
    scoreTeamSelect.innerHTML = '';
    teams.forEach(function (name, i) {
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = (i + 1) + '. ' + name;
      scoreTeamSelect.appendChild(opt);
    });
    scoreTeamSelect.value = String(TeamManager.getCurrent());
  }

  // 登記分數模式：直接切換隊伍，不重置計時器、不跳出確認
  scoreTeamSelect.addEventListener('change', function () {
    var idx = Number(scoreTeamSelect.value);
    if (!isFinite(idx) || idx === TeamManager.getCurrent()) return;
    captureDraft();
    TeamManager.setCurrent(idx);
    loadDraft();
    renderTeamList();
    render();
  });

  function switchTeam(idx) {
    var cur = TeamManager.getCurrent();
    if (idx === cur) return;
    var curName = TeamManager.getCurrentName();
    var targetName = TeamManager.getTeams()[idx];
    UI.confirm({
      title: '確定要切換隊伍嗎？',
      message: '目前隊伍：' + curName + '\n切換至：' + targetName + '\n\n切換後目前計時器將會重置。',
      okText: '確定切換',
      cancelText: '取消'
    }).then(function (ok) {
      if (!ok) return;
      captureDraft();
      TeamManager.setCurrent(idx);
      TimerEngine.reset();
      clearReminderMessage();
      renderTeamList();
      loadDraft();
      render();
    });
  }

  function goNextTeam() {
    captureDraft();
    var teams = TeamManager.getTeams();
    var next = TeamManager.getCurrent() + 1;
    if (next >= teams.length) { UI.toast('已是最後一隊，不會自動切換'); return; }
    TeamManager.setCurrent(next);
    TimerEngine.reset();
    clearReminderMessage();
    renderTeamList();
    loadDraft();
    render();
    UI.toast('已自動切換到「' + teams[next] + '」');
  }

  function editTeam(idx) {
    var oldName = TeamManager.getTeams()[idx];
    UI.promptInput({
      title: '編輯隊伍名稱',
      label: '請輸入新的隊伍名稱',
      value: oldName,
      validate: function (val) {
        var n = (val || '').trim();
        if (n === '') return '不能使用空白名稱';
        var dup = TeamManager.getTeams().some(function (t, i) { return i !== idx && t === n; });
        if (dup) return '已存在相同名稱的隊伍';
        return true;
      }
    }).then(function (newName) {
      if (newName == null) return;
      var trimmed = newName.trim();
      if (idx === TeamManager.getCurrent()) captureDraft();
      TeamManager.edit(idx, trimmed);
      if (idx === TeamManager.getCurrent()) {
        ScoreManager.renameDraft(oldName, trimmed);
        loadDraft();
      }
      renderTeamList();
      UI.toast('已改名為「' + trimmed + '」');
    });
  }

  function deleteTeam(idx) {
    if (TeamManager.getTeams().length <= 1) {
      UI.toast('無法刪除最後一個隊伍');
      return;
    }
    var name = TeamManager.getTeams()[idx];
    UI.confirm({
      title: '刪除隊伍',
      message: '確定要刪除「' + name + '」嗎？\n刪除後無法復原。',
      okText: '確定刪除',
      cancelText: '取消',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      var wasCurrent = idx === TeamManager.getCurrent();
      if (wasCurrent) captureDraft();
      TeamManager.remove(idx);
      ScoreManager.removeDraft(name);
      if (wasCurrent) {
        TimerEngine.reset();
        clearReminderMessage();
        loadDraft();
      }
      renderTeamList();
      render();
      UI.toast('已刪除隊伍「' + name + '」');
    });
  }

  btnAddTeam.addEventListener('click', function () {
    UI.promptInput({
      title: '新增隊伍',
      label: '請輸入隊伍名稱',
      placeholder: '例如：一年5班',
      validate: function (val) {
        var n = (val || '').trim();
        if (n === '') return '不能使用空白名稱';
        if (TeamManager.getTeams().indexOf(n) !== -1) return '已存在相同名稱的隊伍';
        return true;
      }
    }).then(function (name) {
      if (name == null) return;
      var trimmed = name.trim();
      TeamManager.add(trimmed);
      renderTeamList();
      UI.toast('已新增隊伍「' + trimmed + '」');
    });
  });

  // ---------- 畫面渲染 ----------
  function render() {
    var snap = TimerEngine.snapshot();
    var fwd = snap.forwardMs;
    var cd = snap.countdownMs;
    var dur = snap.durationMs;

    var fs = formatTime(fwd);
    var cs = formatTime(cd);
    if (fs !== lastFwdStr) { fwdEl.textContent = fs; lastFwdStr = fs; }
    if (cs !== lastCdStr) { cdEl.textContent = cs; lastCdStr = cs; }

    var fwdOver = dur > 0 && fwd > dur;
    var cdOver = cd < 0;
    var remActive = snap.reminderMs > 0 && snap.reminderTriggered && !cdOver;

    fwdCell.classList.toggle('is-over', fwdOver);
    cdCell.classList.toggle('is-over', cdOver);
    cdCell.classList.toggle('is-warning', remActive);

    updateStatus(snap, fwdOver, cdOver);
    updateButtons(snap.state);
    updateScoreSummary(false);
  }

  function updateStatus(snap, fwdOver, cdOver) {
    var texts = [];
    var cls = '';
    if (snap.state === S.RUNNING) { texts.push('計時中'); cls = 'running'; }
    else if (snap.state === S.PAUSED) { texts.push('已暫停'); cls = 'paused'; }
    else { texts.push('未開始'); }

    if (cdOver) { texts.push('倒數已超時'); cls = 'overtime'; }
    else if (fwdOver) { texts.push('已超過設定時間'); cls = 'overtime'; }
    else if (snap.reminderTriggered && snap.reminderMs > 0) { texts.push('提醒中'); cls = 'reminder'; }

    statusEl.textContent = texts.join(' · ');
    statusEl.className = 'status ' + cls;
  }

  function updateButtons(state) {
    btnStart.disabled = state === S.RUNNING;
    btnPause.disabled = state !== S.RUNNING;
    btnSettings.disabled = state === S.RUNNING;
  }

  function frame() {
    TimerEngine.tick();
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- 開始 / 暫停 / 重置 ----------
  btnStart.addEventListener('click', function () {
    if (TimerEngine.getState() === S.RUNNING) return;
    TimerEngine.start();
    render();
  });
  btnPause.addEventListener('click', function () {
    if (TimerEngine.getState() !== S.RUNNING) return;
    TimerEngine.pause();
    render();
  });
  btnReset.addEventListener('click', function () {
    TimerEngine.reset();
    clearReminderMessage();
    render();
  });

  // ---------- 歷史紀錄 ----------
  function renderHistory() {
    var records = HistoryManager.getAll();
    historyBody.innerHTML = '';
    historyEmpty.hidden = records.length > 0;
    records.forEach(function (r) {
      var tr = document.createElement('tr');
      var values = [r.teamName, formatTime(r.forwardMs), formatTime(r.overtimeMs),
        r.breakdown ? Number(r.breakdown.deduction).toFixed(2) : '—',
        scoreOrDash(r.breakdown ? r.breakdown.total : null),
        r.rank || '—',
        (r.breakdown && r.breakdown.bestConductor === true) ? '✓' : '—'];
      values.forEach(function (v, i) {
        var td = document.createElement('td');
        td.textContent = v;
        if (i === 2 && r.overtimeMs > 0) td.className = 'over';
        if (i === 3 && r.breakdown && r.breakdown.deduction > 0) td.className = 'over';
        tr.appendChild(td);
      });
      historyBody.appendChild(tr);
    });
    updateScoreSummary(true);
  }

  function saveRecord(res) {
    var snap = TimerEngine.snapshot();
    var values = collectValues();
    if (res.complete) captureDraft();
    var rec = HistoryManager.add(TeamManager.getCurrentName(), snap.forwardMs, snap.durationMs, {
      scores: res.complete ? values : null,
      breakdown: res.complete ? res : null
    });
    renderHistory();
    UI.toast('已儲存紀錄：' + formatTime(rec.forwardMs) +
      (res.complete ? ' · 總分 ' + Number(res.total).toFixed(2) : ''));
    if (ScoreManager.getRules().autoNext) goNextTeam();
  }

  function requestSaveRecord() {
    var values = collectValues();
    var res = ScoreManager.calculate(values, currentOverdeduction(), ScoreManager.getRules());
    if (res.complete) { saveRecord(res); return; }
    UI.confirm({
      title: '評分尚未完整',
      message: '尚有評審分數未填寫，這筆紀錄將不含總分與排名。仍要儲存嗎？',
      okText: '仍然儲存',
      cancelText: '返回填寫'
    }).then(function (ok) { if (ok) saveRecord(res); });
  }

  btnSave.addEventListener('click', requestSaveRecord);
  btnSaveRecordScore.addEventListener('click', requestSaveRecord);

  btnClearHistory.addEventListener('click', function () {
    UI.confirm({
      title: '清除歷史紀錄',
      message: '確定要清除所有歷史紀錄嗎？',
      okText: '清除',
      cancelText: '取消',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      HistoryManager.clear();
      renderHistory();
      UI.toast('歷史紀錄已清除');
    });
  });

  // ---------- 設定時間 / 提醒 ----------
  function buildTimeFields(minVal, secVal) {
    var box = document.createElement('div');
    var f1 = document.createElement('div');
    f1.className = 'field';
    var l1 = document.createElement('label');
    l1.className = 'field-label';
    l1.appendChild(document.createTextNode('分鐘'));
    var mi = document.createElement('input');
    mi.type = 'number'; mi.min = '0'; mi.max = '99'; mi.value = minVal;
    mi.className = 'time-input'; mi.setAttribute('aria-label', '分鐘');
    l1.appendChild(mi); f1.appendChild(l1);

    var f2 = document.createElement('div');
    f2.className = 'field';
    var l2 = document.createElement('label');
    l2.className = 'field-label';
    l2.appendChild(document.createTextNode('秒數'));
    var si = document.createElement('input');
    si.type = 'number'; si.min = '0'; si.max = '59'; si.value = secVal;
    si.className = 'time-input'; si.setAttribute('aria-label', '秒數');
    l2.appendChild(si); f2.appendChild(l2);

    var err = document.createElement('div');
    err.className = 'modal-error';
    box.appendChild(f1); box.appendChild(f2); box.appendChild(err);
    return { box: box, min: mi, sec: si, err: err };
  }

  // 所有設定集中在同一个視窗：時間、提醒、扣分、外觀、資料管理
  function openSettingsModal() {
    var box = document.createElement('div');
    box.className = 'settings-modal';

    function section(title, note) {
      var sec = document.createElement('section');
      sec.className = 'settings-section';
      var h = document.createElement('h3');
      h.textContent = title;
      sec.appendChild(h);
      if (note) {
        var p = document.createElement('p');
        p.className = 'rule-note';
        p.style.marginTop = '0';
        p.textContent = note;
        sec.appendChild(p);
      }
      box.appendChild(sec);
      return sec;
    }

    // 比賽時間
    var snap = TimerEngine.snapshot();
    var totalSec = Math.round(snap.durationMs / 1000);
    var durationFields = buildTimeFields(Math.floor(totalSec / 60), totalSec % 60);
    section('比賽時間', '每隊時間，1 秒～99 分鐘。').appendChild(durationFields.box);

    // 提醒
    var reminderBaseMs = savedReminderMs >= 1000 ? savedReminderMs : 60000;
    var rSec = Math.round(reminderBaseMs / 1000);
    var reminderFields = buildTimeFields(Math.floor(rSec / 60), rSec % 60);
    var chkField = document.createElement('label');
    chkField.className = 'field field-check';
    var reminderChk = document.createElement('input');
    reminderChk.type = 'checkbox';
    reminderChk.className = 'checkbox-input';
    reminderChk.checked = effectiveReminderMs() > 0;
    reminderChk.setAttribute('aria-label', '啟用提醒時間');
    var chkText = document.createElement('span');
    chkText.className = 'checkbox-label';
    chkText.textContent = '啟用提醒時間';
    chkField.appendChild(reminderChk);
    chkField.appendChild(chkText);
    function syncReminderDisabled() {
      reminderFields.min.disabled = !reminderChk.checked;
      reminderFields.sec.disabled = !reminderChk.checked;
      reminderFields.box.classList.toggle('is-off', !reminderChk.checked);
    }
    reminderChk.addEventListener('change', syncReminderDisabled);
    reminderFields.box.insertBefore(chkField, reminderFields.box.firstChild);
    syncReminderDisabled();
    section('提醒', '提醒時間需小於比賽時間；關閉後仍保留設定值。')
      .appendChild(reminderFields.box);

    // 扣分與流程
    var rules = ScoreManager.getRules();
    var secRules = section('扣分與流程', '未滿一段時間仍以一段計（向上取整）。');
    var intervalInput = document.createElement('input');
    intervalInput.type = 'number';
    intervalInput.min = '1';
    intervalInput.max = '3600';
    intervalInput.step = '1';
    intervalInput.value = String(rules.intervalSec);
    intervalInput.setAttribute('aria-label', '每幾秒扣分');
    var deductInput = document.createElement('input');
    deductInput.type = 'number';
    deductInput.min = '0';
    deductInput.max = '100';
    deductInput.step = '0.5';
    deductInput.value = String(rules.deductPer);
    deductInput.setAttribute('aria-label', '扣分');
    var rowInterval = document.createElement('label');
    rowInterval.className = 'rule-row';
    rowInterval.appendChild(document.createTextNode('每 '));
    rowInterval.appendChild(intervalInput);
    rowInterval.appendChild(document.createTextNode(' 秒'));
    var rowDeduct = document.createElement('label');
    rowDeduct.className = 'rule-row';
    rowDeduct.appendChild(document.createTextNode('扣 '));
    rowDeduct.appendChild(deductInput);
    rowDeduct.appendChild(document.createTextNode(' 分'));
    var autoChk = document.createElement('input');
    autoChk.type = 'checkbox';
    autoChk.className = 'checkbox-input';
    autoChk.checked = rules.autoNext;
    var autoRow = document.createElement('label');
    autoRow.className = 'rule-check';
    autoRow.appendChild(autoChk);
    autoRow.appendChild(document.createTextNode(' 儲存紀錄後自動切換下一隊'));
    secRules.appendChild(rowInterval);
    secRules.appendChild(rowDeduct);
    secRules.appendChild(autoRow);

    // 外觀
    var themeSel = document.createElement('select');
    [['dark', '深色模式'], ['light', '明亮模式']].forEach(function (pair) {
      var opt = document.createElement('option');
      opt.value = pair[0];
      opt.textContent = pair[1];
      themeSel.appendChild(opt);
    });
    themeSel.value = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    var themeRow = document.createElement('label');
    themeRow.className = 'rule-row';
    themeRow.appendChild(themeSel);
    section('外觀', '頂列按鈕可快速切換，這裡也可設定。').appendChild(themeRow);

    // 資料管理
    var secData = section('資料管理', '清除草稿不會影響已儲存的歷史紀錄。');
    var clearDraftsBtn = document.createElement('button');
    clearDraftsBtn.type = 'button';
    clearDraftsBtn.className = 'btn danger';
    clearDraftsBtn.textContent = '清除所有分數草稿';
    clearDraftsBtn.addEventListener('click', function () {
      UI.hide();
      UI.confirm({
        title: '清除分數草稿',
        message: '確定要清除所有隊伍的分數草稿嗎？已儲存的歷史紀錄不會影響。',
        okText: '清除',
        cancelText: '取消',
        danger: true
      }).then(function (ok) {
        if (ok) {
          ScoreManager.clearDrafts();
          loadDraft();
          UI.toast('分數草稿已清除');
        }
        openSettingsModal();
      });
    });
    secData.appendChild(clearDraftsBtn);

    function submit() {
      durationFields.err.textContent = '';
      reminderFields.err.textContent = '';

      var m = parseInt(durationFields.min.value, 10);
      var s = parseInt(durationFields.sec.value, 10);
      if (isNaN(m)) m = 0;
      if (isNaN(s)) s = 0;
      if (m < 0 || s < 0 || s >= 60) { durationFields.err.textContent = '請輸入有效數字（秒數 0–59）'; return; }
      var newDurationMs = (m * 60 + s) * 1000;
      if (newDurationMs < 1000) { durationFields.err.textContent = '時間需至少 1 秒'; return; }
      if (newDurationMs > MAX_DURATION_MS) { durationFields.err.textContent = '時間需小於等於 99 分鐘'; return; }

      var enabled = reminderChk.checked;
      var rm = parseInt(reminderFields.min.value, 10);
      var rs = parseInt(reminderFields.sec.value, 10);
      if (isNaN(rm)) rm = 0;
      if (isNaN(rs)) rs = 0;
      if (rm < 0 || rs < 0 || rs >= 60) { reminderFields.err.textContent = '請輸入有效數字（秒數 0–59）'; return; }
      var newReminderSec = rm * 60 + rs;
      if (enabled) {
        if (newReminderSec < 1) { reminderFields.err.textContent = '提醒時間需至少 1 秒'; return; }
        if (newReminderSec * 1000 >= newDurationMs) {
          reminderFields.err.textContent = '提醒時間需小於比賽時間（' +
            formatDurationText(Math.round(newDurationMs / 1000)) + '）';
          return;
        }
      }

      var interval = Number(intervalInput.value);
      var per = Number(deductInput.value);
      if (!isFinite(interval) || interval < 1 || interval > 3600) {
        UI.toast('每幾秒需介於 1 到 3600');
        return;
      }
      if (!isFinite(per) || per < 0 || per > 100) {
        UI.toast('扣分需介於 0 到 100');
        return;
      }

      UI.hide();
      durationMs = newDurationMs;
      AppStorage.save('mcts.duration', durationMs);
      if (newReminderSec >= 1 && newReminderSec * 1000 < newDurationMs) {
        savedReminderMs = newReminderSec * 1000;
      }
      reminderEnabled = enabled;
      AppStorage.save('mcts.reminder', savedReminderMs);
      AppStorage.save('mcts.reminderEnabled', reminderEnabled);
      TimerEngine.setDuration(durationMs);
      TimerEngine.setReminder(effectiveReminderMs());
      clearReminderMessage();
      ScoreManager.setRules({ intervalSec: interval, deductPer: per, autoNext: autoChk.checked });
      applyTheme(themeSel.value);
      updateScoreSummary(true);
      render();
      UI.toast('設定已套用');
    }

    [durationFields.min, durationFields.sec, reminderFields.min, reminderFields.sec,
      intervalInput, deductInput].forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
      });
    });

    UI.show({
      title: '設定',
      body: box,
      buttons: [
        { text: '取消', className: 'btn-manage', onClick: function () { UI.hide(); } },
        { text: '套用設定', className: 'btn-primary', onClick: submit }
      ],
      onHide: function () {
        document.getElementById('modal-dialog').classList.remove('settings-dialog');
      }
    });
    document.getElementById('modal-dialog').classList.add('settings-dialog');
  }

  btnSettings.addEventListener('click', openSettingsModal);

  // ---------- 分頁 / 匯出 ----------
  function activateTab(target) {
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.setAttribute('aria-selected', tab.dataset.target === target ? 'true' : 'false');
    });
    ['score', 'history'].forEach(function (name) {
      document.getElementById('panel-' + name).hidden = name !== target;
    });
  }

  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () { activateTab(tab.dataset.target); });
  });

  function hideExportMenu() {
    exportMenu.hidden = true;
    btnExport.setAttribute('aria-expanded', 'false');
  }
  btnExport.addEventListener('click', function (e) {
    e.stopPropagation();
    exportMenu.hidden = !exportMenu.hidden;
    btnExport.setAttribute('aria-expanded', exportMenu.hidden ? 'false' : 'true');
  });
  document.addEventListener('click', function (e) {
    if (!exportMenu.hidden && !exportMenu.contains(e.target)) hideExportMenu();
  });
  document.getElementById('btn-export-csv').addEventListener('click', function () {
    ExportManager.exportCsv(HistoryManager.getAll());
    hideExportMenu(); UI.toast('已匯出 CSV');
  });
  document.getElementById('btn-export-xls').addEventListener('click', function () {
    ExportManager.exportXls(HistoryManager.getAll());
    hideExportMenu(); UI.toast('已匯出 Excel 相容檔');
  });
  document.getElementById('btn-export-print').addEventListener('click', function () {
    var ok = ExportManager.exportPrint(HistoryManager.getAll());
    hideExportMenu();
    if (!ok) UI.toast('瀏覽器擋住視窗，請允許彈出視窗後重試');
  });

  // ---------- 鍵盤快捷鍵 ----------
  document.addEventListener('keydown', function (e) {
    if (!document.getElementById('modal-overlay').hidden) return;
    var a = document.activeElement;
    if (a) {
      var tag = a.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (a.isContentEditable) return;
      if (tag === 'BUTTON') return;
      if (typeof a.closest === 'function' && a.closest('.queue-item')) return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (TimerEngine.getState() === S.RUNNING) TimerEngine.pause();
      else TimerEngine.start();
      render();
    } else if (e.key === 'r' || e.key === 'R') {
      TimerEngine.reset();
      clearReminderMessage();
      render();
    }
  });

  // ---------- 首次渲染 ----------
  buildScoreFields();
  renderTeamList();
  loadDraft();
  renderHistory();
  render();
})();
