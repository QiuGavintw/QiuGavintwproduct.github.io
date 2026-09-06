(function (global) {
  "use strict";

  /* ─── Feedback Layer (Phase 10) ───
     Goal: after a user knows HOW to operate the site (Phase 9), the site
     should tell them clearly WHAT is happening now and WHAT the operation
     produced. This module derives presentational feedback ONLY from the
     existing workspace snapshot and step data — it does NOT compute any
     BST/traversal algorithm, does NOT touch the DOM, does NOT hold a
     controller, and does NOT own any state except pure functions.

     API (documented, exactly these three):
       summarize(snapshot, lastStep, startTreeSize) -> {title,text,tone} | null
       statusOf(snapshot)                           -> {label,tone}
       startCaption(currentIndex, operation, firstStep) -> string | null

     Result text comes from the real snapshot / step data (targetValue,
     visitedValues, treeSize, traversalOrder, step types…). No hard-coded
     fixture outcomes. The only hard-coded things are the wording templates.
  */

  var STATUS_LABELS = {
    idle: "就緒",
    playing: "播放中",
    paused: "已暫停",
    complete: "已完成",
  };

  /* step types where "從 Root 開始" makes sense as a presentation lead-in */
  var ROOT_START_TYPES = ["compare", "go_left", "go_right", "visit"];

  var DELETE_FINISH_TYPES = ["delete_leaf", "delete_one_child", "replace_value"];

  /* ─── summarize(snapshot, lastStep, startTreeSize) ─── */

  function summarize(snapshot, lastStep, startTreeSize) {
    if (!snapshot) return null;
    if (snapshot.mode === null || !snapshot.complete) return null;

    var mode = snapshot.mode;
    var operation = snapshot.operation;
    var target = snapshot.targetValue;
    var treeSize = snapshot.treeSize;
    var startSize = (typeof startTreeSize === "number") ? startTreeSize : treeSize;
    var compared = Array.isArray(snapshot.visitedValues) ? snapshot.visitedValues.length : 0;
    var step = lastStep || null;
    var t = step ? step.type : null;

    /* Traversal */
    if (mode === "traversal") {
      var order = Array.isArray(snapshot.traversalOrder) ? snapshot.traversalOrder : [];
      if (order.length === 0) {
        return {
          title: "Traversal 完成",
          text: "空樹：沒有節點可走訪。",
          tone: "info",
        };
      }
      return {
        title: "Traversal 完成",
        text: order.join(" → "),
        tone: "success",
      };
    }

    /* BST operations */
    if (operation === "insert") {
      if (t === "duplicate") {
        return {
          title: "Insert 完成",
          text: target + " 已存在，未插入。Tree 不變（size 仍為 " + treeSize + "）",
          tone: "info",
        };
      }
      if (t === "insert") {
        return {
          title: "Insert 完成",
          text: "已加入樹，size " + startSize + " → " + treeSize,
          tone: "success",
        };
      }
      return {
        title: "Insert 完成",
        text: step && step.msg ? step.msg : "插入完成。",
        tone: "info",
      };
    }

    if (operation === "search") {
      if (t === "found") {
        return {
          title: "搜尋完成",
          text: "找到 " + target + "，共比較 " + compared + " 次",
          tone: "success",
        };
      }
      if (t === "not_found") {
        return {
          title: "搜尋完成",
          text: "找不到 " + target + "，共比較 " + compared + " 次",
          tone: "info",
        };
      }
      return {
        title: "搜尋完成",
        text: step && step.msg ? step.msg : "搜尋完成。",
        tone: "info",
      };
    }

    if (operation === "delete") {
      if (t === "not_found") {
        return {
          title: "刪除完成",
          text: "找不到 " + target + "，未刪除。Tree 不變（size 仍為 " + treeSize + "）",
          tone: "info",
        };
      }
      if (DELETE_FINISH_TYPES.indexOf(t) !== -1) {
        return {
          title: "刪除完成",
          text: "已刪除 " + target + "，size " + startSize + " → " + treeSize,
          tone: "success",
        };
      }
      return {
        title: "刪除完成",
        text: step && step.msg ? step.msg : "刪除完成。",
        tone: "info",
      };
    }

    /* unknown / fallback */
    return {
      title: snapshot.operationLabel || "完成",
      text: step && step.msg ? step.msg : "動畫完成。",
      tone: "info",
    };
  }

  /* ─── statusOf(snapshot) ───
     Derived purely from the EXISTING snapshot fields (mode / active /
     complete / playing). No second state machine. */
  function statusOf(snapshot) {
    if (!snapshot || snapshot.mode === null) {
      return { label: STATUS_LABELS.idle, tone: "idle" };
    }
    if (snapshot.complete) {
      return { label: STATUS_LABELS.complete, tone: "complete" };
    }
    if (snapshot.playing) {
      return { label: STATUS_LABELS.playing, tone: "playing" };
    }
    return { label: STATUS_LABELS.paused, tone: "paused" };
  }

  /* ─── startCaption(currentIndex, operation, firstStep) ───
     Presentation-only lead-in for the FIRST step. Never repeats for later
     steps. Does not touch the generated algorithm steps. */
  function startCaption(currentIndex, operation, firstStep) {
    if (currentIndex !== 0) return null;
    if (!firstStep || !firstStep.msg) return null;
    if (ROOT_START_TYPES.indexOf(firstStep.type) === -1) return null;
    return "從 Root 開始：" + firstStep.msg;
  }

  var exportsObj = {
    summarize: summarize,
    statusOf: statusOf,
    startCaption: startCaption,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.Feedback = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);