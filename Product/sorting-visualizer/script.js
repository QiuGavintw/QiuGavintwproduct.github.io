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
  function maxValue(items) {
    var m = 1;
    for (var i = 0; i < items.length; i++) if (items[i].value > m) m = items[i].value;
    return m;
  }

  /* ============================================================
     Data generation
     ============================================================ */
  function generateArray(count) {
    var vals = [];
    for (var i = 1; i <= count; i++) vals.push(i);
    shuffle(vals);
    return vals.map(makeItem);
  }
  function defaultData() {
    return [8, 3, 6, 2, 7, 4, 1, 5].map(makeItem);
  }

  /* ============================================================
     Step generators (pure logic, no DOM)
     Each step: { type, arr, compare, key, min, cur, sorted, region,
                  stats, msg, code, move }
     ============================================================ */
  function bubbleSteps(items) {
    var w = clone(items), n = w.length, steps = [];
    var sorted = new Array(n).fill(false);
    var compares = 0, swaps = 0, i, j;

    for (i = 0; i < n - 1; i++) {
      var pass = i + 1, len = n - 1 - i;
      for (j = 0; j < len; j++) {
        compares++;
        steps.push({
          type: "compare", arr: clone(w), compare: [j, j + 1], key: null, min: null, cur: null,
          sorted: sorted.slice(), region: null,
          stats: { pass: pass, cur: (j + 1) + " / " + len, compares: compares, swaps: swaps },
          msg: "比較 A[" + j + "] 和 A[" + (j + 1) + "]（" + w[j].value + " 與 " + w[j + 1].value + "）",
          code: [2], move: false
        });
        if (w[j].value > w[j + 1].value) {
          swaps++;
          var big = w[j].value, small = w[j + 1].value;
          var t = w[j]; w[j] = w[j + 1]; w[j + 1] = t;
          steps.push({
            type: "swap", arr: clone(w), compare: [j, j + 1], key: null, min: null, cur: null,
            sorted: sorted.slice(), region: null,
            stats: { pass: pass, cur: (j + 1) + " / " + len, compares: compares, swaps: swaps },
            msg: big + " 大於 " + small + "，交換 A[" + j + "] 與 A[" + (j + 1) + "]",
            code: [3], move: true
          });
        }
      }
      sorted[n - 1 - i] = true;
      steps.push({
        type: "mark", arr: clone(w), compare: null, key: null, min: null, cur: null,
        sorted: sorted.slice(), region: null,
        stats: { pass: pass, cur: len + " / " + len, compares: compares, swaps: swaps },
        msg: "第 " + pass + " 輪結束，最大的 " + w[n - 1 - i].value + " 已冒泡到位置 A[" + (n - 1 - i) + "]",
        code: [1], move: false
      });
    }
    sorted.fill(true);
    steps.push({
      type: "done", arr: clone(w), compare: null, key: null, min: null, cur: null,
      sorted: sorted.slice(), region: null,
      stats: { pass: n - 1, cur: "完成", compares: compares, swaps: swaps },
      msg: "完成！陣列已升冪排序：" + w.map(function (o) { return o.value; }).join(", "),
      code: [6], move: false
    });
    return steps;
  }

  function selectionSteps(items) {
    var w = clone(items), n = w.length, steps = [];
    var sorted = new Array(n).fill(false);
    var compares = 0, swaps = 0, i, j;

    for (i = 0; i < n - 1; i++) {
      var pass = i + 1, minIdx = i;
      steps.push({
        type: "mark", arr: clone(w), compare: null, key: null, min: i, cur: i,
        sorted: sorted.slice(), region: null,
        stats: { pass: pass, minVal: w[minIdx].value, pos: i + 1, compares: compares, swaps: swaps },
        msg: "目前位置 A[" + i + "]，假設它是最小值 " + w[minIdx].value,
        code: [0, 1], move: false
      });
      for (j = i + 1; j < n; j++) {
        compares++;
        steps.push({
          type: "compare", arr: clone(w), compare: [minIdx, j], key: null, min: minIdx, cur: i,
          sorted: sorted.slice(), region: null,
          stats: { pass: pass, minVal: w[minIdx].value, pos: i + 1, compares: compares, swaps: swaps },
          msg: "將目前最小值 " + w[minIdx].value + " 與 A[" + j + "]（" + w[j].value + "）比較",
          code: [3], move: false
        });
        if (w[j].value < w[minIdx].value) {
          minIdx = j;
          steps.push({
            type: "min", arr: clone(w), compare: null, key: null, min: minIdx, cur: i,
            sorted: sorted.slice(), region: null,
            stats: { pass: pass, minVal: w[minIdx].value, pos: i + 1, compares: compares, swaps: swaps },
            msg: "找到新的最小值 " + w[minIdx].value + "（位置 A[" + j + "]）！",
            code: [4], move: false
          });
        }
      }
      if (i !== minIdx) {
        swaps++;
        var a = w[i].value, b = w[minIdx].value;
        var t = w[i]; w[i] = w[minIdx]; w[minIdx] = t;
        steps.push({
          type: "swap", arr: clone(w), compare: [i, minIdx], key: null, min: i, cur: i,
          sorted: sorted.slice(), region: null,
          stats: { pass: pass, minVal: w[i].value, pos: i + 1, compares: compares, swaps: swaps },
          msg: "將最小值 " + b + " 與目前位置 A[" + i + "]（" + a + "）交換",
          code: [7], move: true
        });
      }
      sorted[i] = true;
      steps.push({
        type: "mark", arr: clone(w), compare: null, key: null, min: null, cur: null,
        sorted: sorted.slice(), region: null,
        stats: { pass: pass, minVal: w[i].value, pos: i + 1, compares: compares, swaps: swaps },
        msg: "位置 A[" + i + "] 已放上正確的最小值 " + w[i].value,
        code: [2], move: false
      });
    }
    sorted[n - 1] = true;
    steps.push({
      type: "done", arr: clone(w), compare: null, key: null, min: null, cur: null,
      sorted: sorted.slice(), region: null,
      stats: { pass: n - 1, minVal: w[n - 1].value, pos: n, compares: compares, swaps: swaps },
      msg: "完成！陣列已升冪排序：" + w.map(function (o) { return o.value; }).join(", "),
      code: [8], move: false
    });
    return steps;
  }

  function insertionSteps(items) {
    var w = clone(items), n = w.length, steps = [];
    var region = new Array(n).fill(false);
    var compares = 0, moves = 0, i;

    region[0] = true;
    steps.push({
      type: "mark", arr: clone(w), compare: null, key: null, min: null, cur: 0,
      sorted: [], region: region.slice(),
      stats: { pass: 1, keyVal: null, compares: compares, moves: moves },
      msg: "第 1 格 A[0] 視為已排序區域",
      code: [0], move: false
    });

    for (i = 1; i < n; i++) {
      var pass = i + 1, k = i, keyVal = w[i].value;
      steps.push({
        type: "key", arr: clone(w), compare: null, key: k, min: null, cur: null,
        sorted: [], region: region.slice(),
        stats: { pass: pass, keyVal: keyVal, compares: compares, moves: moves },
        msg: "取出目前元素 Key = " + keyVal + "（位置 A[" + i + "]）",
        code: [1], move: false
      });
      while (k > 0) {
        var left = w[k - 1].value, right = w[k].value;
        compares++;
        steps.push({
          type: "compare", arr: clone(w), compare: [k - 1, k], key: k, min: null, cur: null,
          sorted: [], region: region.slice(),
          stats: { pass: pass, keyVal: keyVal, compares: compares, moves: moves },
          msg: "比較 Key " + keyVal + " 與左邊的 " + left,
          code: [3], move: false
        });
        if (left > right) {
          moves++;
          var t = w[k - 1]; w[k - 1] = w[k]; w[k] = t;
          k--;
          steps.push({
            type: "shift", arr: clone(w), compare: [k, k + 1], key: k, min: null, cur: null,
            sorted: [], region: region.slice(),
            stats: { pass: pass, keyVal: keyVal, compares: compares, moves: moves },
            msg: "左邊的 " + left + " 比 Key " + keyVal + " 大，將 " + left + " 向右移動",
            code: [4], move: true
          });
        } else {
          break;
        }
      }
      steps.push({
        type: "place", arr: clone(w), compare: null, key: k, min: null, cur: null,
        sorted: [], region: region.slice(),
        stats: { pass: pass, keyVal: keyVal, compares: compares, moves: moves },
        msg: "Key " + keyVal + " 已插入到位置 A[" + k + "]，完成插入",
        code: [7], move: false
      });
      region[i] = true;
      steps.push({
        type: "mark", arr: clone(w), compare: null, key: null, min: null, cur: null,
        sorted: [], region: region.slice(),
        stats: { pass: pass, keyVal: keyVal, compares: compares, moves: moves },
        msg: "已排序區域增加到前 " + (i + 1) + " 個元素",
        code: [8], move: false
      });
    }
    steps.push({
      type: "done", arr: clone(w), compare: null, key: null, min: null, cur: null,
      sorted: new Array(n).fill(true), region: region.slice(),
      stats: { pass: n, keyVal: null, compares: compares, moves: moves },
      msg: "完成！陣列已升冪排序：" + w.map(function (o) { return o.value; }).join(", "),
      code: [8], move: false
    });
    return steps;
  }

  /* ============================================================
     Merge Sort（合併排序法）step generator
     分兩階段視覺化：先「拆分」（splitPass），再「合併」（mergePass）。
     拆分階段不動陣列，只更新區塊；合併階段用原地 shift 合併。
     step 欄位：splitBlock/merging/mcmp/mput/mBlocks/activeBlock
     ============================================================ */
  function mergeSteps(items) {
    var w = clone(items), n = w.length, steps = [];
    var sortedFlags = new Array(n).fill(false);
    var compares = 0, merges = 0;
    var blocks = [[0, n - 1]];

    function blocksCopy() { return blocks.map(function (b) { return [b[0], b[1]]; }); }
    function push(o) { steps.push(o); }

    function replaceBlock(lo, hi, withBlocks) {
      var out = [];
      for (var i = 0; i < blocks.length; i++) {
        if (blocks[i][0] === lo && blocks[i][1] === hi) out = out.concat(withBlocks);
        else out.push([blocks[i][0], blocks[i][1]]);
      }
      return out;
    }
    function findPair(lo, mid, hi) {
      for (var i = 0; i < blocks.length - 1; i++) {
        if (blocks[i][0] === lo && blocks[i][1] === mid &&
            blocks[i + 1][0] === mid + 1 && blocks[i + 1][1] === hi) return i;
      }
      return -1;
    }

    /* ---- Phase 1: 拆分（只更新區塊，不動陣列） ---- */
    function splitPass(lo, hi) {
      var r = "A[" + lo + ".." + hi + "]";
      push({
        type: "split", arr: clone(w), splitBlock: [lo, hi], merging: null, mcmp: [], mput: -1,
        mBlocks: blocksCopy(), activeBlock: [lo, hi], sorted: sortedFlags.slice(),
        stats: { compares: compares, merges: merges, range: r, size: hi - lo + 1 },
        msg: lo === hi
          ? "只剩下單一元素 " + w[lo].value + "：區塊 " + r + " 不需要再拆分"
          : "拆分區塊 " + r + "：把 " + (hi - lo + 1) + " 個資料切成左右兩半",
        code: lo === hi ? [1] : [2], move: false
      });
      if (lo === hi) return;
      var mid = (lo + hi) >> 1;
      blocks = replaceBlock(lo, hi, [[lo, mid], [mid + 1, hi]]);
      splitPass(lo, mid);
      splitPass(mid + 1, hi);
    }

    /* ---- Phase 2: 合併（post-order，與拆分邊界一致） ---- */
    function mergePass(lo, hi) {
      if (lo === hi) return;
      var mid0 = (lo + hi) >> 1;
      mergePass(lo, mid0);
      mergePass(mid0 + 1, hi);
      mergeRange(lo, mid0, hi);
    }

    function mergeRange(lo, mid0, hi) {
      merges++;
      var i, j, s;
      for (i = lo; i <= hi; i++) sortedFlags[i] = false;
      push({
        type: "mergestart", arr: clone(w), merging: [lo, hi], mcmp: [], mput: -1,
        mBlocks: blocksCopy(), activeBlock: [lo, hi], sorted: sortedFlags.slice(),
        stats: { compares: compares, merges: merges, range: "A[" + lo + ".." + hi + "]", size: hi - lo + 1 },
        msg: "合併兩個已排序區塊：A[" + lo + ".." + mid0 + "] 與 A[" + (mid0 + 1) + ".." + hi + "]",
        code: [5, 7], move: false
      });
      i = lo; j = mid0 + 1; var mid = mid0;
      while (i <= mid && j <= hi) {
        compares++;
        push({
          type: "mergecmp", arr: clone(w), merging: [lo, hi], mcmp: [i, j], mput: -1,
          mBlocks: blocksCopy(), activeBlock: [lo, hi], sorted: sortedFlags.slice(),
          stats: { compares: compares, merges: merges, range: "A[" + lo + ".." + hi + "]", size: hi - lo + 1 },
          msg: "比較兩個區塊的開頭：A[" + i + "]＝" + w[i].value + " 與 A[" + j + "]＝" + w[j].value,
          code: [8], move: false
        });
        if (w[i].value <= w[j].value) {
          i++;
        } else {
          var moved = w[j].value;
          for (s = j; s > i; s--) {
            var t = w[s - 1]; w[s - 1] = w[s]; w[s] = t;
            push({
              type: "mergeshift", arr: clone(w), merging: [lo, hi], mcmp: [s - 1, s], mput: s,
              mBlocks: blocksCopy(), activeBlock: [lo, hi], sorted: sortedFlags.slice(),
              stats: { compares: compares, merges: merges, range: "A[" + lo + ".." + hi + "]", size: hi - lo + 1 },
              msg: "較小的 " + moved + " 向左交換到位置 A[" + (s - 1) + "]",
              code: [9], move: true
            });
          }
          i++; j++; mid++;
        }
      }
      for (i = lo; i <= hi; i++) sortedFlags[i] = true;
      var pi = findPair(lo, mid0, hi);
      if (pi >= 0) blocks = blocks.slice(0, pi).concat([[lo, hi]], blocks.slice(pi + 2));
      push({
        type: "mergedone", arr: clone(w), merging: null, mcmp: [], mput: -1,
        mBlocks: blocksCopy(), activeBlock: [lo, hi], sorted: sortedFlags.slice(),
        stats: { compares: compares, merges: merges, range: "A[" + lo + ".." + hi + "]", size: hi - lo + 1 },
        msg: "區塊 A[" + lo + ".." + hi + "] 合併完成：[" +
          w.slice(lo, hi + 1).map(function (o) { return o.value; }).join(" ") + "]",
        code: [10], move: false
      });
    }

    splitPass(0, n - 1);
    mergePass(0, n - 1);
    for (var x = 0; x < n; x++) sortedFlags[x] = true;
    blocks = [[0, n - 1]];
    steps.push({
      type: "done", arr: clone(w), mergedone: null, mcmp: [], mput: -1,
      mBlocks: blocksCopy(), activeBlock: null, sorted: sortedFlags.slice(),
      stats: { compares: compares, merges: merges, range: "A[0.." + (n - 1) + "]", size: n },
      msg: "完成！合併排序把資料依序排好了：" + w.map(function (o) { return o.value; }).join(", "),
      code: [10], move: false
    });
    steps.forEach(function (s) { if (s.stats) s.stats.moves = merges; });
    return steps;
  }

  /* ============================================================
     Greedy Sort（教學型貪心排序法）step generator
     每一步從「剩餘資料」中挑出目前看起來最好的（最小值），排到前面。
     step 欄位：gscan（搜尋中）/gcand（候選）/gpick（貪心選擇）/gswap
     ============================================================ */
  function greedySteps(items) {
    var w = clone(items), n = w.length, steps = [];
    var sortedFlags = new Array(n).fill(false);
    var compares = 0, swaps = 0, i, j;

    function push(o) { steps.push(o); }

    for (i = 0; i < n - 1; i++) {
      var pass = i + 1, cand = i;

      steps.push({
        type: "gstart", arr: clone(w), gscan: i, gcand: i, gpick: -1, gswap: [],
        sorted: sortedFlags.slice(),
        stats: { pass: pass, candVal: w[i].value, bestVal: w[i].value, compares: compares, swaps: swaps },
        msg: "第 " + pass + " 輪：先假設第一筆剩餘資料「" + w[i].value + "」目前看起來最好",
        code: [1, 2], move: false
      });

      for (j = i + 1; j < n; j++) {
        compares++;
        steps.push({
          type: "gscan", arr: clone(w), gscan: j, gcand: cand, gpick: -1, gswap: [],
          sorted: sortedFlags.slice(),
          stats: { pass: pass, candVal: w[cand].value, bestVal: w[cand].value, compares: compares, swaps: swaps },
          msg: "搜尋中：掃描剩餘資料 A[" + j + "]＝" + w[j].value + "，目前最佳選擇是 " + w[cand].value,
          code: [3, 4], move: false
        });
        if (w[j].value < w[cand].value) {
          cand = j;
          steps.push({
            type: "gbetter", arr: clone(w), gscan: j, gcand: cand, gpick: -1, gswap: [],
            sorted: sortedFlags.slice(),
            stats: { pass: pass, candVal: w[cand].value, bestVal: w[cand].value, compares: compares, swaps: swaps },
            msg: "發現「看起來更好」的候選：" + w[cand].value + "（A[" + cand + "]），更新選擇",
            code: [5], move: false
          });
        }
      }

      steps.push({
        type: "gchoose", arr: clone(w), gscan: -1, gcand: cand, gpick: cand, gswap: [],
        sorted: sortedFlags.slice(),
        stats: { pass: pass, candVal: w[cand].value, bestVal: w[cand].value, compares: compares, swaps: swaps },
        msg: "貪心選擇：目前看起來最好的選擇是「" + w[cand].value + "」，把它放到下一個排序位置",
        code: [6, 7], move: false
      });

      if (cand !== i) {
        swaps++;
        var a = w[i].value, b = w[cand].value;
        var t = w[i]; w[i] = w[cand]; w[cand] = t;
        steps.push({
          type: "gswap", arr: clone(w), gscan: -1, gcand: -1, gpick: -1, gswap: [i, cand],
          compare: [i, cand], sorted: sortedFlags.slice(),
          stats: { pass: pass, candVal: w[i].value, bestVal: b, compares: compares, swaps: swaps },
          msg: "把「" + b + "」換到位置 A[" + i + "]（原本是 " + a + "）",
          code: [8], move: true
        });
      }

      if (i === cand) {
        steps.push({
          type: "gkeep", arr: clone(w), gscan: -1, gcand: -1, gpick: -1, gswap: [],
          sorted: sortedFlags.slice(),
          stats: { pass: pass, candVal: w[i].value, bestVal: w[i].value, compares: compares, swaps: swaps },
          msg: "「" + w[i].value + "」剛好就在正確位置，不需要交換，直接固定",
          code: [8], move: false
        });
      }

      sortedFlags[i] = true;
      steps.push({
        type: "gmark", arr: clone(w), gscan: -1, gcand: -1, gpick: -1, gswap: [],
        sorted: sortedFlags.slice(),
        stats: { pass: pass, candVal: null, bestVal: w[i].value, compares: compares, swaps: swaps },
        msg: "第 " + pass + " 個已確定：位置 A[" + i + "]＝" + w[i].value + "（排進排序結果）",
        code: [8], move: false
      });
    }

    sortedFlags[n - 1] = true;
    steps.push({
      type: "done", arr: clone(w), gscan: -1, gcand: -1, gpick: -1, gswap: [],
      sorted: sortedFlags.slice(),
      stats: { pass: n, candVal: null, bestVal: w[n - 1].value, compares: compares, swaps: swaps },
      msg: "完成！貪心排序從「目前看起來最好的」一路挑選，陣列已升冪排序：" +
        w.map(function (o) { return o.value; }).join(", "),
      code: [9], move: false
    });
    return steps;
  }

  /* ============================================================
     Rendering layer
     ============================================================ */
  var INTRO = "準備就緒，按「▶ 開始」自動播放，或「⏭ 下一步」單步學習。";

  function updateStepInfo(v) {
    if (v.statsEl) {
      var el = v.statsEl.querySelector('[data-f="stepinfo"]');
      if (el) el.textContent = v.cursor + " / " + v.steps.length;
    }
  }

  function render(v) {
    var st = v.last;
    var n = v.view.length;
    var compare = st && st.compare ? st.compare : [];
    var key = st && st.key != null ? st.key : -1;
    var min = st && st.min != null ? st.min : -1;
    var cur = st && st.cur != null ? st.cur : -1;
    var isMove = st && (st.type === "swap" || st.type === "shift" || st.type === "gswap");
    var splitBlock = st && st.splitBlock ? st.splitBlock : null;
    var merging = st && st.merging ? st.merging : null;
    var mcmp = st && st.mcmp ? st.mcmp : [];
    var mput = st && st.mput != null ? st.mput : -1;
    var gscan = st && st.gscan != null ? st.gscan : -1;
    var gcand = st && st.gcand != null ? st.gcand : -1;
    var gpick = st && st.gpick != null ? st.gpick : -1;
    function within(r, idx) { return r && idx >= r[0] && idx <= r[1]; }
    var existing = {};
    var kids = v.barsEl.children;
    for (var i = 0; i < kids.length; i++) existing[kids[i].getAttribute("data-id")] = kids[i];

    for (var idx = 0; idx < n; idx++) {
      var item = v.view[idx];
      var el = existing[String(item.id)];
      if (!el) {
        el = document.createElement("div");
        el.className = "bar";
        el.innerHTML = '<span class="num"></span><span class="bmark"></span>';
        el.setAttribute("data-id", item.id);
        v.barsEl.appendChild(el);
      }
      el.style.left = (idx * 100 / n) + "%";
      el.style.width = "calc(" + (100 / n) + "% - 3px)";
      el.style.height = (item.value / v.max * 100) + "%";
      el.querySelector(".num").textContent = item.value;
      var bm = el.querySelector(".bmark");
      var slot = (v.barsEl && n) ? (v.barsEl.clientWidth / n) : 100;
      var compact = slot < 50;
      var badge = "";
      if (slot >= 30) {
        if (gpick === idx) badge = compact ? "選擇" : "Greedy 選擇";
        if (!badge && gcand === idx) badge = "候選";
        if (!badge && gscan === idx) badge = compact ? "搜尋" : "搜尋中";
        if (!badge && mcmp.indexOf(idx) !== -1) badge = compact ? "比較" : "比較中";
        if (!badge && mput === idx) badge = compact ? "合併" : "合併中";
        if (!badge && cur === idx) badge = "位置";
        if (!badge && min === idx) badge = compact ? "最小" : "最小值";
        if (!badge && key === idx) badge = "Key";
        if (!badge && compare.indexOf(idx) !== -1) badge = isMove ? (compact ? "交換" : "交換中") : (compact ? "比較" : "比較中");
        if (v.sorted[idx]) badge = compact ? "✓" : "✓ 已排序";
      }
      bm.textContent = badge;
      bm.style.display = badge ? "" : "none";

      el.classList.toggle("cmp", !isMove && compare.indexOf(idx) !== -1);
      el.classList.toggle("mv", (isMove && compare.indexOf(idx) !== -1) || (st && st.gswap && st.gswap.indexOf(idx) !== -1));
      el.classList.toggle("key", key === idx);
      el.classList.toggle("min", min === idx);
      el.classList.toggle("cur", cur === idx);
      el.classList.toggle("region", !!v.region[idx]);
      el.classList.toggle("sorted", !!v.sorted[idx]);
      el.classList.toggle("split", within(splitBlock, idx));
      el.classList.toggle("mrg", within(merging, idx));
      el.classList.toggle("mcmp", mcmp.indexOf(idx) !== -1);
      el.classList.toggle("mput", mput === idx);
      el.classList.toggle("gseek", gscan === idx);
      el.classList.toggle("gcand", gcand === idx);
      el.classList.toggle("gpick", gpick === idx);
      el.setAttribute("aria-label", "第 " + (idx + 1) + " 支柱，數值 " + item.value + (badge ? "，" + badge : ""));
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

  function updateMergePanel(v, st) {
    if (!v.mergeEl) return;
    v.mergeEl.innerHTML = "";
    if (!st || !st.mBlocks) { v.mergeEl.textContent = "—"; return; }
    st.mBlocks.forEach(function (b) {
      var pill = document.createElement("span");
      pill.className = "mrg-pill";
      if (st.activeBlock && st.activeBlock[0] === b[0] && st.activeBlock[1] === b[1]) pill.classList.add("active");
      var vals = st.arr.slice(b[0], b[1] + 1).map(function (o) { return o.value; }).join(" ");
      pill.textContent = vals;
      v.mergeEl.appendChild(pill);
    });
  }

  function applyStep(v, st) {
    v.last = st;
    v.view = st.arr;
    v.sorted = st.sorted || [];
    v.region = st.region || [];
    v.max = maxValue(st.arr);
    render(v);
    setStats(v, st);
    highlightCode(v, st);
    if (v.arrEl) v.arrEl.textContent = st.arr.map(function (o) { return o.value; }).join(", ");
    if (v.msgEl) {
      v.msgEl.classList.remove("done");
      v.msgEl.textContent = st.msg;
    }
    updateMergePanel(v, st);
  }

  function waitForStep(delay, st) {
    if (st.move) return Math.max(delay, 360);
    if (st.type === "compare") return Math.max(delay, 130);
    return Math.max(delay, 200);
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
      barsEl: cfg.barsEl,
      msgEl: cfg.msgEl,
      codeEl: cfg.codeEl,
      statsEl: cfg.statsEl,
      arrEl: cfg.arrEl,
      mergeEl: cfg.mergeEl || null,
      speedEl: cfg.speedEl,
      speedOut: cfg.speedOut,
      makeSteps: cfg.makeSteps,
      speed: 5,
      steps: [], cursor: 0, view: [], sorted: [], region: [],
      playing: false, finished: false, timer: null, last: null, max: 1
    };

    v.delay = function () { return Math.max(70, 900 - (v.speed - 1) * 92); };

    v.stopTimer = function () {
      if (v.timer) { clearTimeout(v.timer); v.timer = null; }
    };

    v.init = function () {
      v.stopTimer();
      v.playing = false;
      v.finished = false;
      v.steps = v.makeSteps(clone(master));
      v.cursor = 0;
      v.sorted = [];
      v.region = [];
      v.view = clone(master);
      v.max = maxValue(v.view);
      v.last = null;
      v.barsEl.innerHTML = "";
      render(v);
      updateMergePanel(v, null);
      if (v.msgEl) { v.msgEl.classList.remove("done"); v.msgEl.textContent = INTRO; }
      setStats(v, null);
      updateStepInfo(v);
      if (v.arrEl) v.arrEl.textContent = v.view.map(function (o) { return o.value; }).join(", ");
      highlightCode(v, null);
    };

    v.complete = function () {
      v.stopTimer();
      v.playing = false;
      v.finished = true;
      if (v.msgEl) {
        v.msgEl.classList.add("done");
        v.msgEl.textContent = "✅ 排序完成！陣列已按升冪排列。可按下「▶ 開始」重新播放。";
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
     Compare mode
     ============================================================ */
  var ALGO_META = {
    bubble: { name: "Bubble Sort", moveLabel: "交換" },
    selection: { name: "Selection Sort", moveLabel: "交換" },
    insertion: { name: "Insertion Sort", moveLabel: "移動" },
    merge: { name: "Merge Sort", moveLabel: "合併" },
    greedy: { name: "Greedy Sort", moveLabel: "交換" }
  };

  var compare = {
    runners: [],
    playing: false, finished: false, timer: null, speed: 5, rank: 0,

    delay: function () { return Math.max(70, 900 - (compare.speed - 1) * 92); },

    stopTimer: function () {
      if (compare.timer) { clearTimeout(compare.timer); compare.timer = null; }
    },

    buildRunner: function (key, makeSteps) {
      var r = {
        key: key,
        makeSteps: makeSteps,
        barsEl: $("#cm-" + key),
        msgEl: $("#cm-" + key + "-msg"),
        statsEl: $(".mini-stats", $("#cm-" + key + "-msg").parentNode),
        codeEl: null,
        arrEl: null,
        steps: [], cursor: 0, view: [], sorted: [], region: [],
        last: null, max: 1, done: false, rank: 0, finalStats: null
      };
      return r;
    },

    init: function () {
      compare.stopTimer();
      compare.playing = false;
      compare.finished = false;
      compare.rank = 0;
      var data = clone(master);
      var makers = [
        { key: "bubble", fn: bubbleSteps },
        { key: "selection", fn: selectionSteps },
        { key: "insertion", fn: insertionSteps },
        { key: "merge", fn: mergeSteps },
        { key: "greedy", fn: greedySteps }
      ];
      compare.runners = makers.map(function (m) { return compare.buildRunner(m.key, m.fn); });
      compare.runners.forEach(function (r) {
        r.steps = r.makeSteps(clone(data));
        r.cursor = 0;
        r.view = clone(data);
        r.sorted = [];
        r.region = [];
        r.max = maxValue(r.view);
        r.last = null;
        r.done = false;
        r.rank = 0;
        r.finalStats = null;
        r.barsEl.innerHTML = "";
        render(r);
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
      setState(r, "進行中");
    },

    finishRunner: function (r) {
      r.done = true;
      compare.rank++;
      r.rank = compare.rank;
      r.finalStats = r.steps[r.steps.length - 1].stats;
      r.msgEl.classList.add("done");
      r.msgEl.textContent = "🏁 排序完成（第 " + r.rank + " 名）";
      setState(r, "完成");
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
      var wait = waitForStep(compare.delay(), compare.runners[0].steps[compare.runners[0].cursor - 1] || { type: "mark" });
      compare.timer = setTimeout(compare.tick, wait);
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
      var sortedRuns = compare.runners.slice().sort(function (a, b) { return a.rank - b.rank; });
      var winner = sortedRuns[0];
      var wMeta = ALGO_META[winner.key];
      var wStats = winner.finalStats || {};
      $("#race-winner").textContent = "🏆 " + wMeta.name + " 率先完成！它總共比較 " +
        wStats.compares + " 次、" + wMeta.moveLabel + " " + (wStats.swaps || wStats.moves || 0) + " 次。";
      var tbody = $("#race-table tbody");
      tbody.innerHTML = "";
      compare.runners.forEach(function (r) {
        var meta = ALGO_META[r.key];
        var s = r.finalStats || {};
        var tr = document.createElement("tr");
        tr.innerHTML = "<td><b>" + meta.name + "</b></td><td>" + (s.compares || 0) + "</td><td>" +
          (s.swaps != null ? s.swaps : s.moves || 0) + "</td><td>" + (r.rank ? "第 " + r.rank + " 名" : "—") + "</td>";
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
  var visualizers = {};
  var initialized = false;

  function newData() {
    master = generateArray(dataCount);
    refreshAll();
  }

  function refreshAll() {
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

    visualizers.bubble = createVisualizer({
      key: "bubble",
      barsEl: $("#bubble-bars"),
      msgEl: $("#bubble-msg"),
      codeEl: $("#bubble-code"),
      statsEl: $("#bubble .stats"),
      arrEl: $("#bubble-arr"),
      speedEl: $("#bubble-speed"),
      speedOut: $("#bubble-speed-out"),
      makeSteps: bubbleSteps
    });
    visualizers.selection = createVisualizer({
      key: "selection",
      barsEl: $("#selection-bars"),
      msgEl: $("#selection-msg"),
      codeEl: $("#selection-code"),
      statsEl: $("#selection .stats"),
      arrEl: $("#selection-arr"),
      speedEl: $("#selection-speed"),
      speedOut: $("#selection-speed-out"),
      makeSteps: selectionSteps
    });
    visualizers.insertion = createVisualizer({
      key: "insertion",
      barsEl: $("#insertion-bars"),
      msgEl: $("#insertion-msg"),
      codeEl: $("#insertion-code"),
      statsEl: $("#insertion .stats"),
      arrEl: $("#insertion-arr"),
      speedEl: $("#insertion-speed"),
      speedOut: $("#insertion-speed-out"),
      makeSteps: insertionSteps
    });
    visualizers.merge = createVisualizer({
      key: "merge",
      barsEl: $("#merge-bars"),
      msgEl: $("#merge-msg"),
      codeEl: $("#merge-code"),
      statsEl: $("#merge .stats"),
      arrEl: $("#merge-arr"),
      mergeEl: $("#merge-blocks"),
      speedEl: $("#merge-speed"),
      speedOut: $("#merge-speed-out"),
      makeSteps: mergeSteps
    });
    visualizers.greedy = createVisualizer({
      key: "greedy",
      barsEl: $("#greedy-bars"),
      msgEl: $("#greedy-msg"),
      codeEl: $("#greedy-code"),
      statsEl: $("#greedy .stats"),
      arrEl: $("#greedy-arr"),
      speedEl: $("#greedy-speed"),
      speedOut: $("#greedy-speed-out"),
      makeSteps: greedySteps
    });

    wireSection("bubble");
    wireSection("selection");
    wireSection("insertion");
    wireSection("merge");
    wireSection("greedy");

    $("#data-count").addEventListener("input", function (e) {
      dataCount = +e.target.value;
      $("#data-count-val").textContent = dataCount;
    });
    $("#btn-newdata").addEventListener("click", newData);

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
      bubbleSteps: bubbleSteps,
      selectionSteps: selectionSteps,
      insertionSteps: insertionSteps,
      mergeSteps: mergeSteps,
      greedySteps: greedySteps,
      generateArray: generateArray,
      makeItem: makeItem,
      clone: clone
    };
  }
  if (global && global.document && global.addEventListener) {
    global.addEventListener("DOMContentLoaded", init);
  }

})(typeof window !== "undefined" ? window : globalThis);