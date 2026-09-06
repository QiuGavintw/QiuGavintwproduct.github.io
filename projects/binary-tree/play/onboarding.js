(function (global) {
  "use strict";

  /* ─── Onboarding & Help (Phase 9) ───
     Goal: a first-time visitor should understand "what this site is" and
     "what to press first" in ~10-30s, without reading any external docs.

     This module is PURE (data + session-only state). It does NOT touch the
     DOM, does NOT know BST / traversal algorithms, and does NOT modify any
     tree. It only provides content and once-per-page-load state; index.html
     does the UI wiring.

     Session-only (no localStorage by protocol):
       - Welcome shows at most once per page load.
       - Each contextual hint shows at most once per page load.
     A page refresh may show Welcome again (acceptable per protocol).
  */

  /* 1 ── Welcome card content ─────────────────────────────────────────── */
  var WELCOME = {
    title: "👋 開始建立你的二元樹",
    body: "輸入一個數字，按「插入」即可開始，不必先看教學。",
    getStarted: "輸入一個數字，按「插入」即可開始。",
    actionLabel: "開始操作",
  };

  /* 2 ── Help panel content ───────────────────────────────────────────── */
  var HELP = {
    title: "如何使用",
    openLabel: "開啟使用說明",
    closeLabel: "關閉說明",
    intro: "第一次使用？跟著下面的步驟，10 秒鐘就能開始。",
    sections: [
      {
        n: 1,
        title: "建立樹",
        lines: [
          "輸入一個數字，按下「插入」。",
          "較小的數字會往左，大於節點的數字會往右。",
        ],
      },
      {
        n: 2,
        title: "搜尋節點",
        lines: [
          "輸入數字後按「搜尋」，觀看系統如何一步一步尋找節點。",
        ],
      },
      {
        n: 3,
        title: "刪除節點",
        lines: [
          "輸入數字後按「刪除」，觀看節點如何從樹中移除。",
        ],
      },
      {
        n: 4,
        title: "控制動畫",
        lines: [
          "▶ 播放　⏸ 暫停　⏭ 下一步　⏮ 上一步　↻ 重新開始",
          "也可以使用「速度」調整動畫的快慢。",
        ],
      },
      {
        n: 5,
        title: "查看節點",
        lines: [
          "點擊樹上的節點，可以查看：Root、Parent、Child、Leaf、Child Count、Depth。",
        ],
      },
      {
        n: 6,
        title: "學習模式",
        lines: [
          "如果想從基礎開始學起，切換到「學習模式」，跟著課程一步一步認識二元樹。",
        ],
      },
    ],
  };

  /* 3 ── Contextual hints (once each, per page load) ──────────────────── */
  var HINTS = {
    insert: "在二元搜尋樹中，比目前節點小的數字往左，大的數字往右。",
    search: "搜尋會從 Root 開始，根據大小決定往左或往右。",
    traversal: "Traversal 是「走訪樹」的方法，不同走訪順序會得到不同的節點順序。",
  };

  /* 4 ── Transport button accessible labels ───────────────────────────── */
  var CONTROL_LABELS = {
    play: "播放動畫",
    pause: "暫停動畫",
    step: "下一步",
    stepBack: "上一步",
    restart: "重新開始",
    skipEnd: "跳到動畫結尾",
  };

  function createOnboarding() {
    var welcomeDismissed = false; /* session-only, per page load */
    var hintShown = {};            /* session-only, per hint kind */

    return {
      /* Welcome */
      getWelcome: function () { return WELCOME; },
      isWelcomeDismissed: function () { return welcomeDismissed; },
      dismissWelcome: function () { welcomeDismissed = true; return true; },

      /* Help */
      getHelp: function () { return HELP; },

      /* Contextual hints */
      hasHint: function (kind) {
        return Object.prototype.hasOwnProperty.call(HINTS, kind);
      },
      getHint: function (kind) { return HINTS[kind] || null; },
      shouldShowHint: function (kind) {
        if (!Object.prototype.hasOwnProperty.call(HINTS, kind)) return false;
        return !hintShown[kind];
      },
      markHintShown: function (kind) {
        if (!Object.prototype.hasOwnProperty.call(HINTS, kind)) return false;
        hintShown[kind] = true;
        return true;
      },

      /* Accessible names for icon-only transport buttons */
      getControlLabel: function (kind) { return CONTROL_LABELS[kind] || null; },
    };
  }

  /* ─── Exports ─── */

  var exportsObj = {
    createOnboarding: createOnboarding,
    WELCOME: WELCOME,
    HELP: HELP,
    HINTS: HINTS,
    CONTROL_LABELS: CONTROL_LABELS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.Onboarding = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);