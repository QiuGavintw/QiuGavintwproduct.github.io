window.ScoreManager = (function () {
  var KEY_RULES = 'mcts.scoreRules';
  var KEY_DRAFTS = 'mcts.scoreDrafts';
  var MAX_SCORE = 100;

  // 兩大卡片；細項、權重與評分表.xlsx 一致
  var SECTIONS = [
    { key: 'designated', label: '指定曲', weight: 0.5 },
    { key: 'self', label: '自選曲', weight: 0.5 }
  ];

  var GROUPS = [
    { key: 'designatedTone', section: 'designated', label: '音準、節奏、音色', percent: '50％', weight: 0.5 },
    { key: 'designatedCreative', section: 'designated', label: '團體創意', percent: '50％', weight: 0.5 },
    { key: 'selfTone', section: 'self', label: '音準、節奏、音色', percent: '40％', weight: 0.4 },
    { key: 'selfHarmony', section: 'self', label: '和聲', percent: '30％', weight: 0.3 },
    { key: 'selfConductor', section: 'self', label: '指揮', percent: '30％', weight: 0.3 }
  ];

  var FIELDS = [];
  GROUPS.forEach(function (g) {
    for (var i = 1; i <= 3; i++) {
      FIELDS.push({ key: g.key + 'Judge' + i, group: g.key, judge: i, label: g.label });
    }
  });

  var DEFAULT_RULES = { intervalSec: 10, deductPer: 1, autoNext: false };

  var rules = { intervalSec: 10, deductPer: 1, autoNext: false };
  var drafts = {};

  function copy(obj) {
    var out = {};
    if (!obj || typeof obj !== 'object') return out;
    Object.keys(obj).forEach(function (k) { out[k] = obj[k]; });
    return out;
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  function emptyValues() {
    var v = { bestConductor: false };
    FIELDS.forEach(function (f) { v[f.key] = null; });
    return v;
  }

  function sanitizeRules(r) {
    var out = { intervalSec: 10, deductPer: 1, autoNext: false };
    if (!r || typeof r !== 'object') return out;
    var sec = Number(r.intervalSec);
    var per = Number(r.deductPer);
    if (isFinite(sec) && sec >= 1 && sec <= 3600) out.intervalSec = sec;
    if (isFinite(per) && per >= 0 && per <= MAX_SCORE) out.deductPer = per;
    out.autoNext = r.autoNext === true;
    return out;
  }

  function load() {
    rules = sanitizeRules(AppStorage.load(KEY_RULES, DEFAULT_RULES));
    var d = AppStorage.load(KEY_DRAFTS, {});
    drafts = (d && typeof d === 'object' && !Array.isArray(d)) ? d : {};
  }

  function saveRules() { AppStorage.save(KEY_RULES, rules); }
  function saveDrafts() { AppStorage.save(KEY_DRAFTS, drafts); }

  function getRules() { return copy(rules); }

  function setRules(next) {
    rules = sanitizeRules(next);
    saveRules();
    return getRules();
  }

  function getDraft(teamName) {
    var name = String(teamName || '');
    if (!drafts[name]) return emptyValues();
    var base = emptyValues();
    var saved = drafts[name];
    FIELDS.forEach(function (f) {
      var raw = saved[f.key];
      if (raw === null || raw === undefined || raw === '') { base[f.key] = null; return; }
      var n = Number(raw);
      base[f.key] = isFinite(n) && n >= 0 && n <= MAX_SCORE ? n : null;
    });
    base.bestConductor = saved.bestConductor === true;
    return base;
  }

  function setDraft(teamName, values) {
    var name = String(teamName || '');
    if (name === '') return;
    drafts[name] = copy(values || emptyValues());
    saveDrafts();
  }

  function renameDraft(oldName, newName) {
    var from = String(oldName || '');
    var to = String(newName || '');
    if (from === '' || to === '' || from === to || !drafts[from]) return;
    drafts[to] = drafts[from];
    delete drafts[from];
    saveDrafts();
  }

  function removeDraft(teamName) {
    var name = String(teamName || '');
    if (!drafts[name]) return;
    delete drafts[name];
    saveDrafts();
  }

  function clearDrafts() {
    drafts = {};
    saveDrafts();
  }

  function parseScore(value) {
    if (value === null || value === undefined || value === '') return null;
    var n = Number(value);
    if (!isFinite(n) || n < 0 || n > MAX_SCORE) return null;
    return round2(n);
  }

  function deductionFor(overtimeMs, r) {
    var ot = Math.max(0, Number(overtimeMs) || 0);
    var sec = r && r.intervalSec > 0 ? r.intervalSec : rules.intervalSec;
    var per = r && isFinite(r.deductPer) && r.deductPer >= 0 ? r.deductPer : rules.deductPer;
    // 不足 sec 秒仍以 sec 秒計（向上取整）；ot 為 0 時不扣
    var units = ot <= 0 ? 0 : Math.ceil(ot / (sec * 1000));
    return round2(units * per);
  }

  // 對應評分表.xlsx：G/K/P/T/X 為三評審平均，L=AVERAGE(G,K)*0.5，
  // Y=(P*0.4+T*0.3+X*0.3)*0.5，AA=L+Y+Z；分數尺度改為 0–100
  function calculate(values, overtimeMs, r) {
    var v = values || {};
    var avg = {};
    var sectionRaw = { designated: 0, self: 0 };
    var complete = true;

    GROUPS.forEach(function (g) {
      var sum = 0;
      for (var i = 1; i <= 3; i++) {
        var score = parseScore(v[g.key + 'Judge' + i]);
        if (score === null) { complete = false; return; }
        sum += score;
      }
      avg[g.key] = sum / 3;
      sectionRaw[g.section] += avg[g.key] * g.weight;
    });

    var deduction = deductionFor(overtimeMs, r);
    var designatedScore = round2(sectionRaw.designated * 0.5);
    var selfScore = round2(sectionRaw.self * 0.5);
    var baseRaw = sectionRaw.designated * 0.5 + sectionRaw.self * 0.5;
    var baseRounded = round2(baseRaw);
    var total = round2(baseRaw - deduction);

    return {
      complete: complete,
      averages: complete ? avg : null,
      designatedScore: complete ? designatedScore : null,
      selfScore: complete ? selfScore : null,
      base: complete ? baseRounded : null,
      deduction: deduction,
      total: complete ? total : null,
      bestConductor: v.bestConductor === true
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    return Number(value).toFixed(digits === undefined ? 2 : digits);
  }

  return {
    SECTIONS: SECTIONS,
    GROUPS: GROUPS,
    FIELDS: FIELDS,
    MAX_SCORE: MAX_SCORE,
    load: load,
    getRules: getRules,
    setRules: setRules,
    getDraft: getDraft,
    setDraft: setDraft,
    renameDraft: renameDraft,
    removeDraft: removeDraft,
    clearDrafts: clearDrafts,
    parseScore: parseScore,
    deductionFor: deductionFor,
    calculate: calculate,
    format: format,
    emptyValues: emptyValues
  };
})();
