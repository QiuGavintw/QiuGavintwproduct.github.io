window.TeamManager = (function () {
  var KEY_TEAMS = 'mcts.teams';
  var KEY_CURRENT = 'mcts.currentTeam';

  // 順序依評分表.xlsx 的「序號」1–11 排列：
  // 一年5班(1)、一年3班(2)、一年信班(3)、一年仁班(4)、一年1班(5)、一年2班(6)、
  // 一年4班(7)、一年7班(8)、一年忠班(9)、一年6班(10)、一年孝班(11)
  var DEFAULT_TEAMS = ['一年5班', '一年3班', '一年信班', '一年仁班', '一年1班', '一年2班',
    '一年4班', '一年7班', '一年忠班', '一年6班', '一年孝班'];
  // 舊版預設隊伍；若使用者仍停留在這組預設值，載入時自動升級為新預設班級
  var LEGACY_DEFAULT_TEAMS = 'A 組,B 組,C 組,D 組';
  var LEGACY_CN_TEAMS = '一年一班,一年二班,一年三班,一年四班,一年五班,一年六班,一年七班,一年忠班,一年孝班,一年仁班,一年信班';

  var teams = [];
  var current = 0;

  function load() {
    var t = AppStorage.load(KEY_TEAMS, null);
    if (Array.isArray(t) && (t.join(',') === LEGACY_DEFAULT_TEAMS || t.join(',') === LEGACY_CN_TEAMS)) {
      t = null;
    }
    if (!Array.isArray(t) || t.length === 0) {
      t = DEFAULT_TEAMS.slice();
    }
    teams = t.map(function (n) { return String(n); })
      .filter(function (n) { return n.trim() !== ''; });
    if (teams.length === 0) teams = ['一年5班'];

    var c = AppStorage.load(KEY_CURRENT, 0);
    if (typeof c === 'number' && Number.isInteger(c) && c >= 0 && c < teams.length) {
      current = c;
    } else {
      current = 0;
    }
    save();
  }

  function save() {
    AppStorage.save(KEY_TEAMS, teams);
    AppStorage.save(KEY_CURRENT, current);
  }

  function getTeams() { return teams.slice(); }

  function getCurrent() { return current; }

  function getCurrentName() { return teams[current]; }

  function add(name) {
    var n = String(name || '').trim();
    if (n === '') return { ok: false, reason: '空白名稱' };
    if (teams.indexOf(n) !== -1) return { ok: false, reason: '重複名稱' };
    teams.push(n);
    save();
    return { ok: true };
  }

  function edit(index, name) {
    var n = String(name || '').trim();
    if (n === '') return { ok: false, reason: '空白名稱' };
    for (var i = 0; i < teams.length; i++) {
      if (i !== index && teams[i] === n) return { ok: false, reason: '重複名稱' };
    }
    teams[index] = n;
    save();
    return { ok: true };
  }

  // 調整順序：dir = -1 上移、1 下移；目前選中的隊伍會跟著移動
  function move(index, dir) {
    var target = index + dir;
    if (target < 0 || target >= teams.length) return false;
    var tmp = teams[index];
    teams[index] = teams[target];
    teams[target] = tmp;
    if (current === index) {
      current = target;
    } else if (current === target) {
      current = index;
    }
    save();
    return true;
  }

  function remove(index) {
    if (teams.length <= 1) return false;
    if (index < 0 || index >= teams.length) return false;
    teams.splice(index, 1);
    if (current === index) {
      current = Math.max(0, index - 1);
    } else if (current > index) {
      current--;
    }
    if (current >= teams.length) current = teams.length - 1;
    save();
    return true;
  }

  function setCurrent(index) {
    if (index < 0 || index >= teams.length) return false;
    current = index;
    save();
    return true;
  }

  return {
    load: load,
    getTeams: getTeams,
    getCurrent: getCurrent,
    getCurrentName: getCurrentName,
    add: add,
    edit: edit,
    remove: remove,
    setCurrent: setCurrent,
    move: move
  };
})();
