(function (global) {
  "use strict";

  /* ============================================================
     Utilities
     ============================================================ */
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }

  var idSeq = 1;
  function makeItem(value) { return { id: idSeq++, value: value }; }
  function clone(items) { return items.map(function (o) { return { id: o.id, value: o.value }; }); }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ============================================================
     Data generation (search: sorted unique data, binary-safe)
     ============================================================ */
  function generateArray(count) {
    var range = count * 2;
    var pool = [];
    for (var i = 1; i <= range; i++) pool.push(i);
    shuffle(pool);
    var vals = pool.slice(0, count).sort(function (a, b) { return a - b; });
    return vals.map(makeItem);
  }
  function defaultData() {
    return [3, 7, 12, 18, 25, 31, 42].map(makeItem);
  }
  function valueSet(items) {
    var s = {};
    for (var i = 0; i < items.length; i++) s["v" + items[i].value] = true;
    return s;
  }
  function randomTarget(items) {
    return items[Math.floor(Math.random() * items.length)].value;
  }
  function absentTarget(items) {
    var s = valueSet(items);
    var max = items.length * 2;
    for (var v = 1; v <= max; v++) if (!s["v" + v]) return v;
    return max + 1;
  }

  /* ============================================================
     Step generators (pure logic, no DOM)
     Each step: { type, index, checked / excluded, left, mid, right,
                  stats, msg, code, state }
     ============================================================ */
  function linearSteps(items, target) {
    var w = clone(items), n = w.length;
    var checked = new Array(n).fill(false);
    var compares = 0, steps = [], i;

    for (i = 0; i < n; i++) {
      compares++;
      var val = w[i].value;
      steps.push({
        type: "compare", index: i, checked: checked.slice(), exclude: [],
        stats: { target: target, pos: "第 " + (i + 1) + " 格", compares: compares },
        msg: "🔎 檢查 A[" + i + "]：" + val + "　（" + val + " 與目標 " + target + " 比較）",
        code: [0, 1], state: "搜尋中"
      });
      if (val === target) {
        checked[i] = true;
        steps.push({
          type: "found", index: i, checked: checked.slice(), exclude: [],
          stats: { target: target, pos: "第 " + (i + 1) + " 格", compares: compares },
          msg: "🎉 找到了！目標 " + target + " 位於第 " + (i + 1) + " 格（index " + i + "），用了 " + compares + " 次比較",
          code: [2], state: "找到"
        });
        return steps;
      }
      checked[i] = true;
      steps.push({
        type: "miss", index: i, checked: checked.slice(), exclude: [],
        stats: { target: target, pos: "第 " + (i + 1) + " 格", compares: compares },
        msg: "✕ A[" + i + "]：" + val + " 不等於目標 " + target + "，繼續往下找",
        code: [3], state: "搜尋中"
      });
    }
    steps.push({
      type: "notfound", index: -1, checked: checked.slice(), exclude: [],
      stats: { target: target, pos: "已到底", compares: compares },
      msg: "❌ 找不到！已檢查完全部 " + n + " 個資料，" + target + " 不在其中（比較 " + compares + " 次）",
      code: [5], state: "找不到"
    });
    return steps;
  }

  function binarySteps(items, target) {
    var w = clone(items), n = w.length;
    var left = 0, right = n - 1;
    var excluded = new Array(n).fill(false);
    var compares = 0, steps = [];

    while (left <= right) {
      var mid = Math.floor((left + right) / 2);
      var midVal = w[mid].value;
      steps.push({
        type: "range", left: left, mid: mid, right: right, excluded: excluded.slice(),
        stats: { target: target, left: left, mid: "A[" + mid + "]", right: right, compares: compares },
        msg: "搜尋範圍 A[" + left + "] ～ A[" + right + "]，中間 = A[" + mid + "]（" + midVal + "）",
        code: [2, 3], state: "搜尋中"
      });
      compares++;
      steps.push({
        type: "compare", left: left, mid: mid, right: right, excluded: excluded.slice(),
        stats: { target: target, left: left, mid: "A[" + mid + "]", right: right, compares: compares },
        msg: "🔎 比較中間值 " + midVal + " 與目標 " + target,
        code: [4, 7], state: "搜尋中"
      });
      if (midVal === target) {
        steps.push({
          type: "found", index: mid, left: left, mid: mid, right: right, excluded: excluded.slice(),
          stats: { target: target, left: left, mid: "A[" + mid + "]", right: right, compares: compares },
          msg: "🎉 找到了！目標 " + target + " 位於第 " + (mid + 1) + " 格（index " + mid + "），用了 " + compares + " 次比較",
          code: [5], state: "找到"
        });
        return steps;
      }
      var ne = excluded.slice();
      if (midVal < target) {
        for (var k = left; k <= mid; k++) ne[k] = true;
        left = mid + 1;
        steps.push({
          type: "discard", direction: "right", left: left, mid: -1, right: right, excluded: ne,
          stats: { target: target, left: left, mid: "–", right: right, compares: compares },
          msg: "⏭ " + midVal + " < " + target + " → 排除左半邊（含中間），改搜尋右半邊 A[" + left + "] ～ A[" + right + "]",
          code: [7, 8], state: "搜尋中"
        });
      } else {
        for (var k2 = mid; k2 <= right; k2++) ne[k2] = true;
        right = mid - 1;
        steps.push({
          type: "discard", direction: "left", left: left, mid: -1, right: right, excluded: ne,
          stats: { target: target, left: left, mid: "–", right: right, compares: compares },
          msg: "⏭ " + midVal + " > " + target + " → 排除右半邊（含中間），改搜尋左半邊 A[" + left + "] ～ A[" + right + "]",
          code: [9, 10], state: "搜尋中"
        });
      }
      excluded = ne;
    }
    steps.push({
      type: "notfound", index: -1, left: left, mid: -1, right: right, excluded: excluded.slice(),
      stats: { target: target, left: left, mid: "–", right: right, compares: compares },
      msg: "❌ 找不到！搜尋範圍已不存在（Left " + left + " > Right " + right + "），" + target + " 不在資料中（比較 " + compares + " 次）",
      code: [13], state: "找不到"
    });
    return steps;
  }

  /* ============================================================
     Rendering layer (array cards)
     ============================================================ */
  var INTRO = "準備就緒。按「▶ 開始」自動播放，或「⏭ 下一步」單步學習。";

  var LABEL_FULL = {
    checking: "🔎 檢查中",
    miss: "✕ 不符合",
    checked: "✓ 已檢查",
    found: "🎯 找到了",
    excluded: "❌ 排除",
    inrange: "🔎 範圍內",
    midcard: "★ 中間"
  };
  var LABEL_SHORT = {
    checking: "🔎",
    miss: "✕",
    checked: "✓",
    found: "🎯",
    excluded: "❌",
    inrange: "🔎",
    midcard: "★"
  };

  function updateStepInfo(v) {
    if (v.statsEl) {
      var el = v.statsEl.querySelector('[data-f="stepinfo"]');
      if (el) el.textContent = v.cursor + " / " + v.steps.length;
    }
  }

  function render(v) {
    var st = v.last;
    var n = v.view.length;
    var stype = st ? st.type : null;
    var foundIdx = stype === "found" ? st.index : -1;
    var checked = st && st.checked ? st.checked : [];
    var excluded = st && st.excluded ? v.excluded : [];
    if (st && st.excluded) excluded = st.excluded;
    var binary = v.binary;
    var slot = v.cardsEl.clientWidth / n;
    var compact = slot < 44;

    v.cardsEl.className = "cards";
    if (slot < 26) v.cardsEl.classList.add("tiny");
    else if (slot < 44) v.cardsEl.classList.add("small");
    else if (slot < 70) v.cardsEl.classList.add("med");
    else v.cardsEl.classList.add("large");

    var existing = {};
    var kids = v.cardsEl.children;
    for (var i = 0; i < kids.length; i++) existing[kids[i].getAttribute("data-i")] = kids[i];

    for (var idx = 0; idx < n; idx++) {
      var item = v.view[idx];
      var el = existing[String(idx)];
      if (!el) {
        el = document.createElement("div");
        el.className = "card";
        el.innerHTML = '<span class="c-idx"></span><span class="c-val"></span><span class="c-label"></span>';
        el.setAttribute("data-i", idx);
        v.cardsEl.appendChild(el);
      }
      el.querySelector(".c-idx").textContent = idx;
      el.querySelector(".c-val").textContent = item.value;

      var cls = "normal", label = "";
      var lab = function (key) { return compact ? LABEL_SHORT[key] : LABEL_FULL[key]; };

      if (!binary) {
        if (stype === "compare" && idx === st.index) { cls = "checking"; label = lab("checking"); }
        else if (stype === "found" && idx === foundIdx) { cls = "found"; label = lab("found"); }
        else if (stype === "miss" && idx === st.index) { cls = "miss"; label = lab("miss"); }
        else if (checked[idx]) { cls = "checked"; label = lab("checked"); }
      } else {
        if (stype === "found" && idx === foundIdx) { cls = "found"; label = lab("found"); }
        else if (excluded[idx]) { cls = "excluded"; label = lab("excluded"); }
        else if ((stype === "range" || stype === "compare") && idx === st.mid) { cls = "mid"; label = lab("midcard"); }
        else if (stype === "compare" && idx === st.mid) { cls = "checking"; label = lab("checking"); }
        else { cls = "inrange"; label = lab("inrange"); }
      }

      el.className = "card";
      if (cls !== "normal") el.classList.add(cls);
      el.querySelector(".c-label").textContent = label;
      var aria = "第 " + (idx + 1) + " 格，index " + idx + "，數值 " + item.value;
      if (label) aria += "，" + label;
      el.setAttribute("aria-label", aria);
    }
    while (v.cardsEl.children.length > n) v.cardsEl.removeChild(v.cardsEl.lastChild);

    /* pointer row (binary) */
    if (v.ptrEl) {
      while (v.ptrEl.children.length < n) {
        var sp = document.createElement("span");
        sp.className = "ptr";
        v.ptrEl.appendChild(sp);
      }
      while (v.ptrEl.children.length > n) v.ptrEl.removeChild(v.ptrEl.lastChild);
      var pKids = v.ptrEl.children;
      for (var p = 0; p < n; p++) pKids[p].textContent = "";
      for (var q = 0; q < n; q++) pKids[q].classList.remove("on");
      if (st && st.left != null && (stype === "range" || stype === "compare")) {
        if (st.left >= 0 && st.left < n) { pKids[st.left].textContent = compact ? "←L" : "← Left"; pKids[st.left].classList.add("on"); pKids[st.left].setAttribute("data-ptr", "left"); }
        if (st.mid >= 0 && st.mid < n) { pKids[st.mid].textContent = compact ? "★" + st.mid : "★ Mid"; pKids[st.mid].classList.add("on"); pKids[st.mid].setAttribute("data-ptr", "mid"); }
        if (st.right >= 0 && st.right < n) { pKids[st.right].textContent = compact ? "R→" : "Right →"; pKids[st.right].classList.add("on"); pKids[st.right].setAttribute("data-ptr", "right"); }
      }
    }
  }

  function setStats(v, st) {
    if (!v.statsEl) return;
    var els = v.statsEl.querySelectorAll("[data-f]");
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute("data-f");
      if (k === "state" || k === "stepinfo") continue;
      var val = st && st.stats ? st.stats[k] : undefined;
      els[i].textContent = (val === undefined || val === null) ? "–" : val;
    }
  }

  function setState(v, text) {
    if (v.statsEl) {
      var el = v.statsEl.querySelector('[data-f="state"]');
      if (el) el.textContent = text;
    }
  }

  function highlightCode(v, st) {
    if (!v.codeEl) return;
    var lines = v.codeEl.querySelectorAll(".line");
    for (var i = 0; i < lines.length; i++) lines[i].classList.remove("active");
    if (st && st.code) {
      for (var c = 0; c < st.code.length; c++) {
        var ln = v.codeEl.querySelector('.line[data-line="' + st.code[c] + '"]');
        if (ln) ln.classList.add("active");
      }
    }
  }

  function doneMsg(type) {
    return type === "notfound"
      ? "❌ 搜尋結束：目標不在資料中。可按下「▶ 開始」重新播放。"
      : "🎉 搜尋結束：已找到目標！可按下「▶ 開始」重新播放。";
  }

  function applyStep(v, st) {
    v.last = st;
    v.view = st.arr || v.view;
    v.excluded = st.excluded || [];
    render(v);
    setStats(v, st);
    setState(v, st.state || "搜尋中");
    highlightCode(v, st);
    if (v.arrEl) v.arrEl.textContent = v.view.map(function (o) { return o.value; }).join(", ");
    if (v.msgEl) {
      var fin = st.type === "found" || st.type === "notfound";
      v.msgEl.classList.toggle("done", fin);
      v.msgEl.textContent = st.msg;
    }
  }

  function waitForStep(delay, st) {
    if (st.type === "discard") return Math.max(delay, 460);
    if (st.type === "found" || st.type === "notfound") return Math.max(delay, 460);
    if (st.type === "compare") return Math.max(delay, 320);
    if (st.type === "range") return Math.max(delay, 300);
    return Math.max(delay, 220);
  }

  /* ============================================================
     Global playback guard (only one auto-play at a time)
     ============================================================ */
  var activePlay = null;
  function claimPlay(p) {
    if (activePlay && activePlay !== p && typeof activePlay.pause === "function") activePlay.pause();
    activePlay = p;
  }

  /* ============================================================
     Visualizer factory (main sections)
     ============================================================ */
  function createVisualizer(cfg) {
    var v = {
      key: cfg.key,
      cardsEl: cfg.cardsEl,
      ptrEl: cfg.ptrEl || null,
      binary: !!cfg.binary,
      msgEl: cfg.msgEl,
      codeEl: cfg.codeEl,
      statsEl: cfg.statsEl,
      arrEl: cfg.arrEl,
      speedEl: cfg.speedEl,
      speedOut: cfg.speedOut,
      makeSteps: cfg.makeSteps,
      speed: 5,
      steps: [], cursor: 0, view: [], excluded: [],
      playing: false, finished: false, timer: null, last: null
    };

    v.delay = function () { return Math.max(70, 900 - (v.speed - 1) * 92); };

    v.stopTimer = function () {
      if (v.timer) { clearTimeout(v.timer); v.timer = null; }
    };

    v.init = function () {
      v.stopTimer();
      v.playing = false;
      v.finished = false;
      v.steps = v.makeSteps(clone(master), target);
      v.cursor = 0;
      v.excluded = [];
      v.view = clone(master);
      v.last = null;
      v.cardsEl.innerHTML = "";
      if (v.ptrEl) v.ptrEl.innerHTML = "";
      var n = v.view.length;
      v.cardsEl.style.gridTemplateColumns = "repeat(" + n + ", minmax(0, 1fr))";
      if (v.ptrEl) v.ptrEl.style.gridTemplateColumns = "repeat(" + n + ", minmax(0, 1fr))";
      render(v);
      if (v.msgEl) { v.msgEl.classList.remove("done"); v.msgEl.textContent = INTRO; }
      setStats(v, null);
      setState(v, "待機");
      if (v.statsEl) {
        var t = v.statsEl.querySelector('[data-f="target"]');
        if (t) t.textContent = target;
      }
      updateStepInfo(v);
      if (v.arrEl) v.arrEl.textContent = v.view.map(function (o) { return o.value; }).join(", ");
      highlightCode(v, null);
    };

    v.complete = function () {
      v.stopTimer();
      v.playing = false;
      v.finished = true;
      if (v.msgEl) {
        var lt = v.last && v.last.type;
        if (lt !== "found" && lt !== "notfound") {
          v.msgEl.classList.add("done");
          v.msgEl.textContent = doneMsg(lt);
        }
      }
      updateStepInfo(v);
    };

    v.tick = function () {
      if (!v.playing) return;
      if (v.cursor >= v.steps.length) { v.complete(); return; }
      var st = v.steps[v.cursor];
      applyStep(v, st);
      v.cursor++;
      updateStepInfo(v);
      v.timer = setTimeout(v.tick, waitForStep(v.delay(), st));
    };

    v.start = function () {
      if (v.playing) return;
      claimPlay(v);
      if (v.finished) v.init();
      v.playing = true;
      v.tick();
    };

    v.pause = function () {
      if (!v.playing) return;
      v.stopTimer();
      v.playing = false;
      setState(v, "已暫停");
      if (v.msgEl && !v.finished) {
        v.msgEl.textContent = "⏸ 已暫停｜" + (v.last ? v.last.msg : "尚未開始") + " ｜按「▶ 開始」繼續，或「⏭ 下一步」單步執行。";
      }
    };

    v.step = function () {
      if (v.finished) return;
      if (v.playing) v.pause();
      if (v.cursor >= v.steps.length) { v.complete(); return; }
      var st = v.steps[v.cursor];
      applyStep(v, st);
      v.cursor++;
      updateStepInfo(v);
      if (v.cursor >= v.steps.length) v.complete();
    };

    v.reset = function () {
      v.stopTimer();
      v.playing = false;
      v.init();
    };

    return v;
  }

  /* ============================================================
     Compare mode: Linear vs Binary (same data, same target)
     ============================================================ */
  var ALGO_META = {
    linear: { name: "順序搜尋", tag: "一個一個找" },
    binary: { name: "二分搜尋", tag: "每次排除一半" }
  };

  var compare = {
    runners: [],
    playing: false, finished: false, timer: null, speed: 5,

    delay: function () { return Math.max(70, 900 - (compare.speed - 1) * 92); },

    stopTimer: function () {
      if (compare.timer) { clearTimeout(compare.timer); compare.timer = null; }
    },

    buildRunner: function (key, makeSteps, binary) {
      var r = {
        key: key,
        binary: !!binary,
        makeSteps: makeSteps,
        cardsEl: $("#cm-" + key),
        ptrEl: null,
        msgEl: $("#cm-" + key + "-msg"),
        statsEl: $(".mini-stats", $("#cm-" + key + "-msg").parentNode),
        codeEl: null, arrEl: null,
        steps: [], cursor: 0, view: [], excluded: [],
        last: null, done: false, finalStats: null
      };
      return r;
    },

    init: function () {
      compare.stopTimer();
      compare.playing = false;
      compare.finished = false;
      var data = clone(master);
      var makers = [
        { key: "linear", fn: linearSteps, binary: false },
        { key: "binary", fn: binarySteps, binary: true }
      ];
      compare.runners = makers.map(function (m) { return compare.buildRunner(m.key, m.fn, m.binary); });
      compare.runners.forEach(function (r) {
        r.steps = r.makeSteps(clone(data), target);
        r.cursor = 0;
        r.view = clone(data);
        r.excluded = [];
        r.last = null;
        r.done = false;
        r.finalStats = null;
        r.cardsEl.innerHTML = "";
        var n = r.view.length;
        r.cardsEl.style.gridTemplateColumns = "repeat(" + n + ", minmax(0, 1fr))";
        render(r);
        var t = r.statsEl.querySelector('[data-f="target"]');
        if (t) t.textContent = target;
        r.msgEl.classList.remove("done");
        r.msgEl.textContent = "等待開始…";
        setStats(r, null);
        setState(r, "待機");
        updateStepInfo(r);
      });
      $("#race-result").hidden = true;
    },

    applyOne: function (r, st) {
      applyStep(r, st);
      setState(r, st.state || "進行中");
    },

    finishRunner: function (r) {
      r.done = true;
      r.finalStats = r.steps[r.steps.length - 1].stats;
      r.msgEl.classList.add("done");
      var fin = r.steps[r.steps.length - 1];
      r.msgEl.textContent = fin.type === "found" ? "🎯 找到！" + (fin.stats.compares || 0) + " 次比較" : "❌ 找不到（" + (fin.stats.compares || 0) + " 次）";
      setState(r, fin.state || "完成");
      updateStepInfo(r);
    },

    tick: function () {
      if (!compare.playing) return;
      var live = false;
      compare.runners.forEach(function (r) {
        if (r.done) return;
        live = true;
        if (r.cursor >= r.steps.length) { compare.finishRunner(r); return; }
        var st = r.steps[r.cursor];
        compare.applyOne(r, st);
        r.cursor++;
        updateStepInfo(r);
        if (r.cursor >= r.steps.length) compare.finishRunner(r);
      });
      if (!live) { compare.complete(); return; }
      var lastSt = compare.runners[0].done
        ? compare.runners[1].steps[compare.runners[1].cursor - 1] || { type: "range" }
        : compare.runners[0].steps[compare.runners[0].cursor - 1] || { type: "compare" };
      compare.timer = setTimeout(compare.tick, waitForStep(compare.delay(), lastSt));
    },

    start: function () {
      if (compare.playing) return;
      claimPlay(compare);
      if (compare.finished) compare.init();
      compare.playing = true;
      compare.tick();
    },

    pause: function () {
      if (!compare.playing) return;
      compare.stopTimer();
      compare.playing = false;
      compare.runners.forEach(function (r) {
        if (!r.done) setState(r, "已暫停");
      });
    },

    step: function () {
      if (compare.finished) return;
      if (compare.playing) compare.pause();
      compare.runners.forEach(function (r) {
        if (r.done) return;
        if (r.cursor >= r.steps.length) { compare.finishRunner(r); return; }
        var st = r.steps[r.cursor];
        compare.applyOne(r, st);
        r.cursor++;
        updateStepInfo(r);
        if (r.cursor >= r.steps.length) compare.finishRunner(r);
      });
      if (compare.runners.every(function (r) { return r.done; })) compare.complete();
    },

    complete: function () {
      compare.stopTimer();
      compare.playing = false;
      compare.finished = true;
      var box = $("#race-result");
      box.hidden = false;
      var lstat = compare.runners[0].finalStats || {};
      var bstat = compare.runners[1].finalStats || {};
      var lc = lstat.compares || 0, bc = bstat.compares || 0;
      var verdict = lc === bc
        ? "兩種搜尋法都用了 " + lc + " 次比較。"
        : (bc < lc ? "二分搜尋比較少！" : "這次順序搜尋比較少。");
      $("#race-winner").textContent =
        "🎯 順序搜尋：" + lc + " 次比較　｜　⚡ 二分搜尋：" + bc + " 次比較　→　" + verdict;
      var tbody = $("#race-table tbody");
      tbody.innerHTML = "";
      compare.runners.forEach(function (r) {
        var meta = ALGO_META[r.key];
        var s = r.finalStats || {};
        var tr = document.createElement("tr");
        tr.innerHTML = "<td><b>" + meta.name + "</b></td><td>" + (s.compares || 0) + "</td><td>" + meta.tag + "</td>";
        tbody.appendChild(tr);
      });
    },

    reset: function () {
      compare.stopTimer();
      compare.playing = false;
      compare.init();
    }
  };

  /* ============================================================
     Application state & wiring
     ============================================================ */
  var master = [];
  var dataCount = 8;
  var target = 25;
  var visualizers = {};
  var initialized = false;

  function newData() {
    master = generateArray(dataCount);
    target = randomTarget(master);
    refreshAll();
  }

  function refreshAll() {
    $("#target-out").textContent = target;
    $("#compare-target").textContent = target;
    Object.keys(visualizers).forEach(function (k) { visualizers[k].init(); });
    compare.init();
    $("#compare-arr").textContent = master.map(function (o) { return o.value; }).join(", ");
  }

  function wireSection(key) {
    var v = visualizers[key];
    $("#" + key + "-start").addEventListener("click", function () { v.start(); });
    $("#" + key + "-pause").addEventListener("click", function () { v.pause(); });
    $("#" + key + "-step").addEventListener("click", function () { v.step(); });
    $("#" + key + "-regen").addEventListener("click", newData);
    $("#" + key + "-reset").addEventListener("click", function () { v.reset(); });
    v.speedEl.addEventListener("input", function (e) {
      v.speed = +e.target.value;
      v.speedOut.textContent = v.speed;
    });
  }

  function init() {
    if (initialized) return;
    initialized = true;
    master = defaultData();
    dataCount = 8;
    target = 25;

    visualizers.linear = createVisualizer({
      key: "linear",
      cardsEl: $("#linear-cards"),
      msgEl: $("#linear-msg"),
      codeEl: $("#linear-code"),
      statsEl: $("#linear .stats"),
      arrEl: $("#linear-arr"),
      speedEl: $("#linear-speed"),
      speedOut: $("#linear-speed-out"),
      makeSteps: linearSteps,
      binary: false
    });
    visualizers.binary = createVisualizer({
      key: "binary",
      cardsEl: $("#binary-cards"),
      ptrEl: $("#binary-ptr"),
      msgEl: $("#binary-msg"),
      codeEl: $("#binary-code"),
      statsEl: $("#binary .stats"),
      arrEl: $("#binary-arr"),
      speedEl: $("#binary-speed"),
      speedOut: $("#binary-speed-out"),
      makeSteps: binarySteps,
      binary: true
    });

    wireSection("linear");
    wireSection("binary");

    $("#data-count").addEventListener("input", function (e) {
      dataCount = +e.target.value;
      $("#data-count-val").textContent = dataCount;
    });
    $("#btn-newdata").addEventListener("click", newData);
    $("#btn-target-random").addEventListener("click", function () {
      target = randomTarget(master);
      refreshAll();
    });
    $("#btn-target-none").addEventListener("click", function () {
      target = absentTarget(master);
      refreshAll();
    });

    $("#c-start").addEventListener("click", function () { compare.start(); });
    $("#c-pause").addEventListener("click", function () { compare.pause(); });
    $("#c-step").addEventListener("click", function () { compare.step(); });
    $("#c-regen").addEventListener("click", newData);
    $("#c-reset").addEventListener("click", function () { compare.reset(); });
    $("#compare-speed").addEventListener("input", function (e) {
      compare.speed = +e.target.value;
      $("#compare-speed-out").textContent = compare.speed;
    });

    refreshAll();
  }

  /* ============================================================
     Exports (module = Node.js test harness; window = browser)
     ============================================================ */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      linearSteps: linearSteps,
      binarySteps: binarySteps,
      generateArray: generateArray,
      defaultData: defaultData,
      makeItem: makeItem,
      clone: clone,
      randomTarget: randomTarget,
      absentTarget: absentTarget
    };
  }
  if (global && global.document && global.addEventListener) {
    global.addEventListener("DOMContentLoaded", init);
  }

})(typeof window !== "undefined" ? window : globalThis);