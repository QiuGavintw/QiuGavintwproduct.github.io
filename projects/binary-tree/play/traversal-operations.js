(function (global) {
  "use strict";

  /* ─── Traversal Operations ─── */
  /* Wraps the Phase 1 traversal step APIs (preorderSteps / inorderSteps /
     postorderSteps / levelOrderSteps) into visual steps for the animation
     controller. This module does NOT reimplement the traversal algorithms;
     it only decorates the existing 'visit' steps with visual semantics. */

  var TRAVERSALS = ["preorder", "inorder", "postorder", "levelorder"];

  var LABELS = {
    preorder: "前序 Preorder",
    inorder: "中序 Inorder",
    postorder: "後序 Postorder",
    levelorder: "層序 Level-order",
  };

  var ORDER_KEYS = {
    preorder: "preorder",
    inorder: "inorder",
    postorder: "postorder",
    levelorder: "levelorder",
  };

  function getTraversalSteps(tree, traversal) {
    if (traversal === "preorder") return tree.preorderSteps();
    if (traversal === "inorder") return tree.inorderSteps();
    if (traversal === "postorder") return tree.postorderSteps();
    if (traversal === "levelorder") return tree.levelOrderSteps();
    return [];
  }

  function getOrder(tree, traversal) {
    if (traversal === "preorder") return tree.preorder();
    if (traversal === "inorder") return tree.inorder();
    if (traversal === "postorder") return tree.postorder();
    if (traversal === "levelorder") return tree.levelOrder();
    return [];
  }

  /* Build visual steps from the raw Phase 1 traversal steps.
     Each step gets:
       - operation: traversal label
       - currentValue: the node being visited
       - visitedValues: array up to & including this step
       - visitIndex: zero-based index of this visit in the traversal
       - traversalOrder: the full precomputed order
  */
  function buildVisualTraversalSteps(rawSteps, traversal, order) {
    var visited = [];
    var result = [];
    for (var i = 0; i < rawSteps.length; i++) {
      var s = rawSteps[i];
      var value = s.nodeValue;
      visited.push(value);
      result.push({
        type: s.type,
        rawType: s.type,
        operation: traversal,
        operationLabel: LABELS[traversal] || traversal,
        nodeValue: value,
        targetValue: null,
        direction: null,
        parentId: s.parentId !== undefined ? s.parentId : null,
        msg: s.msg,
        phase: s.phase,
        order: s.order,
        depth: s.depth,
        currentValue: value,
        visitedValues: visited.slice(),
        visitIndex: i,
        traversalOrder: order.slice(),
      });
    }
    return result;
  }

  function runTraversal(tree, traversal) {
    if (TRAVERSALS.indexOf(traversal) === -1) {
      return { ok: false, error: "Unknown traversal: " + traversal };
    }
    var order = getOrder(tree, traversal);
    var raw = getTraversalSteps(tree, traversal);
    var visual = buildVisualTraversalSteps(raw, traversal, order);

    return {
      ok: true,
      traversal: traversal,
      traversalLabel: LABELS[traversal] || traversal,
      order: order,
      steps: visual,
      count: order.length,
    };
  }

  var exportsObj = {
    runTraversal: runTraversal,
    TRAVERSALS: TRAVERSALS,
    LABELS: LABELS,
    ORDER_KEYS: ORDER_KEYS,
    buildVisualTraversalSteps: buildVisualTraversalSteps,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.TraversalOperations = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
