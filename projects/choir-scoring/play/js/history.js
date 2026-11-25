window.HistoryManager = (function () {
  var KEY = 'mcts.history';
  var records = [];

  function load() {
    var r = AppStorage.load(KEY, []);
    records = Array.isArray(r) ? r : [];
    rankAll();
  }

  function save() {
    AppStorage.save(KEY, records);
  }

  function clone(value) {
    if (value === null || value === undefined) return null;
    try { return JSON.parse(JSON.stringify(value)); } catch (e) { return null; }
  }

  // 隊伍名稱儲存當下的名稱，改名不影響過去紀錄
  function add(teamName, forwardMs, durationMs, extra) {
    var overtimeMs = Math.max(0, forwardMs - durationMs);
    var rec = {
      teamName: String(teamName),
      forwardMs: Math.round(forwardMs),
      overtimeMs: Math.round(overtimeMs),
      rank: ''
    };
    if (extra && extra.scores) {
      rec.scores = clone(extra.scores);
      rec.breakdown = clone(extra.breakdown);
      rec.savedAt = new Date().toISOString();
    }
    records.push(rec);
    rankAll();
    return rec;
  }

  // 同名總分並列，使用試算表 RANK.EQ 的競爭排名
  function rankAll() {
    var scored = records.filter(function (r) {
      return r && r.breakdown && typeof r.breakdown.total === 'number' && isFinite(r.breakdown.total);
    });
    var sorted = scored.slice().sort(function (a, b) { return b.breakdown.total - a.breakdown.total; });
    sorted.forEach(function (r) {
      var rank = 1;
      for (var i = 0; i < sorted.length; i++) {
        if (Math.abs(sorted[i].breakdown.total - r.breakdown.total) < 0.00001) { rank = i + 1; break; }
      }
      r.rank = rank;
    });
    records.forEach(function (r) {
      if (scored.indexOf(r) === -1) r.rank = '';
    });
    save();
  }

  function clear() {
    records = [];
    save();
  }

  function getAll() { return records.slice(); }

  function getRank(teamName) {
    var name = String(teamName || '');
    for (var i = records.length - 1; i >= 0; i--) {
      if (records[i].teamName === name && records[i].rank !== '') return records[i].rank;
    }
    return '';
  }

  return { load: load, add: add, clear: clear, getAll: getAll, rankAll: rankAll, getRank: getRank };
})();
