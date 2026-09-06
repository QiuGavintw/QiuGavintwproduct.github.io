(function (global) {
  "use strict";

  /* ─── Unified Interactive Workspace ───
     Orchestrates BST operations (insert/search/delete) and Traversal
     (preorder/inorder/postorder/levelorder) through a SINGLE
     AnimationController shared by both, enforcing mutual exclusion.
     This module is UI-agnostic: it manages tree/renderer/controller state
     and emits UI snapshots through the `onUi` callback. It does NOT touch
     the Tree Model inside the animation loop (traversal is read-only; BST
     mutations are committed once by BSTOperations at step generation time,
     then only re-laid-out here). */

  var TreeModel = global.TreeModel;
  var TreeLayout = global.TreeLayout;
  var AnimationController = global.AnimationController;
  var BSTOps = global.BSTOperations;
  var TravOps = global.TraversalOperations;

  var DEFAULT_VALUES = [50, 30, 70, 20, 40, 60, 80];

  var TRAVERSAL_LABELS = TravOps ? TravOps.LABELS : {};

  function createWorkspace(options) {
    var opts = options || {};
    var renderer = opts.renderer;
    var onUi = typeof opts.onUi === "function" ? opts.onUi : null;

    if (!renderer) throw new Error("workspace requires a renderer");

    var tree = new TreeModel.BinarySearchTree();

    var session = {
      mode: null, // "bst" | "traversal" | null
      operation: null,
      operationLabel: null,
      targetValue: null,
      complete: false,
      stepCount: 0,
    };

    var ac = AnimationController.createAnimationController({
      onStep: applyStep,
    });

    function snapshot() {
      var cur = ac.getCurrentStep();
      var step = ac.getCurrentStepData();
      var isActive = session.mode !== null && !session.complete;
      return {
        mode: session.mode,
        operation: session.operation,
        operationLabel: session.operationLabel,
        targetValue: session.targetValue,
        active: isActive,
        complete: session.complete,
        playing: ac.isPlaying(),
        currentIndex: cur,
        totalSteps: session.stepCount,
        currentValue: step ? step.currentValue : null,
        visitedValues: step ? step.visitedValues.slice() : [],
        selectedValue: step && step.selectedValue !== undefined ? step.selectedValue : null,
        msg: step ? step.msg : "",
        traversalOrder: step && step.traversalOrder ? step.traversalOrder.slice() : [],
        treeSize: tree.size,
      };
    }

    function emit() {
      if (onUi) onUi(snapshot());
    }

    function refreshLayoutFit() {
      renderer.setLayout(TreeLayout.calculateLayout(tree));
      renderer.fitToView();
      renderer.clearNodeStates();
      renderer.clearSelection();
      renderer.render();
    }

    function renderStepStates(step) {
      renderer.clearNodeStates();
      renderer.clearSelection();
      (step.visitedValues || []).forEach(function (v) {
        renderer.setNodeState(v, "visited");
      });
      if (step.currentValue !== null && step.currentValue !== undefined) {
        renderer.setNodeState(step.currentValue, "compare");
      }
      if (step.selectedValue !== null && step.selectedValue !== undefined) {
        renderer.setNodeState(step.selectedValue, "selected");
      }
      renderer.render();
    }

    function applyStep(idx, steps) {
      if (idx < 0) {
        renderer.clearNodeStates();
        renderer.clearSelection();
        renderer.render();
        emit();
        return;
      }
      var step = steps[idx];
      var last = idx >= steps.length - 1;
      renderStepStates(step);
      if (last) {
        if (session.mode === "traversal") {
          /* tree unchanged; keep final highlight */
          (step.visitedValues || []).forEach(function (v) {
            renderer.setNodeState(v, "selected");
          });
          renderer.render();
        } else {
          /* BST: re-layout into the committed tree shape (clears states) */
          refreshLayoutFit();
        }
        session.complete = true;
      }
      emit();
    }

    function resetSession() {
      ac.reset();
      session.mode = null;
      session.operation = null;
      session.operationLabel = null;
      session.targetValue = null;
      session.complete = false;
      session.stepCount = 0;
      renderer.clearNodeStates();
      renderer.clearSelection();
      renderer.render();
    }

    function startBstSession(result, operation, target) {
      ac.pause();
      ac.reset();
      session.mode = "bst";
      session.operation = operation;
      session.targetValue = target;
      session.complete = false;
      session.stepCount = result.steps.length;
      var label;
      if (operation === "insert") label = "插入 " + target;
      else if (operation === "search") label = "搜尋 " + target;
      else if (operation === "delete") label = "刪除 " + target;
      else label = operation;
      session.operationLabel = label;
      refreshLayoutFit();
      ac.setSteps(result.steps);
      if (result.steps.length > 0) ac.stepForward();
      emit();
      return result;
    }

    function startTraversalSession(result, traversal) {
      ac.pause();
      ac.reset();
      session.mode = "traversal";
      session.operation = traversal;
      session.operationLabel = TRAVERSAL_LABELS[traversal] || traversal;
      session.targetValue = null;
      session.complete = false;
      session.stepCount = result.steps.length;
      refreshLayoutFit();
      ac.setSteps(result.steps);
      if (result.steps.length > 0) ac.stepForward();
      /* empty tree: consider immediately complete */
      if (result.steps.length === 0) session.complete = true;
      emit();
      return result;
    }

    /* Direct Manipulation: fast-forward the freshly-started session so the
       operation is "already done" while releasing the controller to serve
       as an optional visual replay. Learning Mode keeps the step-by-step
       flow by simply not passing `instant`. */
    function finishInstantSession() {
      if (session.stepCount === 0) {
        session.complete = true;
        return;
      }
      while (!ac.isComplete()) ac.stepForward();
    }

    /* ─── Public API ─── */

    return {
      /* tree building */
      buildTree: function (values) {
        if (!Array.isArray(values)) return { ok: false, error: "輸入必須是數值陣列" };
        if (values.length === 0) return { ok: false, error: "輸入不得為空" };
        for (var i = 0; i < values.length; i++) {
          var v = values[i];
          if (typeof v !== "number" || !isFinite(v) || isNaN(v)) {
            return { ok: false, error: "含有非有限數字：第 " + (i + 1) + " 個" };
          }
        }
        var seen = {};
        for (var j = 0; j < values.length; j++) {
          var vv = values[j];
          if (seen[vv]) return { ok: false, error: "含有重複值：" + vv };
          seen[vv] = true;
        }
        resetSession();
        tree = new TreeModel.BinarySearchTree();
        for (var k = 0; k < values.length; k++) tree.insert(values[k]);
        refreshLayoutFit();
        emit();
        return { ok: true };
      },

      loadDefaultTree: function () {
        return this.buildTree(DEFAULT_VALUES.slice());
      },

      clearTree: function () {
        resetSession();
        tree = new TreeModel.BinarySearchTree();
        refreshLayoutFit();
        emit();
      },

      /* BST operations */
      runInsert: function (value, opts) {
        if (session.mode !== null && !session.complete) return { ok: false, error: "busy" };
        var r = BSTOps.runInsert(tree, value);
        var started = startBstSession(r, "insert", value);
        if (opts && opts.instant) finishInstantSession();
        return started;
      },
      runSearch: function (value, opts) {
        if (session.mode !== null && !session.complete) return { ok: false, error: "busy" };
        var r = BSTOps.runSearch(tree, value);
        var started = startBstSession(r, "search", value);
        if (opts && opts.instant) finishInstantSession();
        return started;
      },
      runDelete: function (value, opts) {
        if (session.mode !== null && !session.complete) return { ok: false, error: "busy" };
        var r = BSTOps.runDelete(tree, value);
        var started = startBstSession(r, "delete", value);
        if (opts && opts.instant) finishInstantSession();
        return started;
      },

      /* traversal */
      runTraversal: function (traversal, opts) {
        /* block only during an active BST session; switching traversal
           mid-run is allowed (starts a fresh traversal session) */
        if (session.mode === "bst" && !session.complete) return { ok: false, error: "busy" };
        var r = TravOps.runTraversal(tree, traversal);
        if (!r.ok) return r;
        var started = startTraversalSession(r, traversal);
        if (opts && opts.instant) finishInstantSession();
        return started;
      },

      /* animation transport — delegates to the single controller */
      play: function () { ac.play(); },
      pause: function () { ac.pause(); },
      stepForward: function () { ac.stepForward(); },
      stepBackward: function () { ac.stepBackward(); },
      restart: function () { ac.restart(); emit(); },
      setSpeed: function (s) { ac.setSpeed(s); },

      /* introspection */
      getState: function () { return snapshot(); },
      getTree: function () { return tree; },
      getController: function () { return ac; },
      isBusy: function () { return session.mode !== null && !session.complete; },
    };
  }

  var exportsObj = {
    createWorkspace: createWorkspace,
    DEFAULT_VALUES: DEFAULT_VALUES,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.TreeWorkspace = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);