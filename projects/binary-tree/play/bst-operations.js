(function (global) {
  "use strict";

  /* ─── BST Operations: Steps + Mutation ─── */
  /* Orchestrates Insert / Search / Delete visualization.
     It runs the operation on a CLONE to generate steps (so we can derive
     per-step visual states without corrupting the real tree), then commits
     the final mutation to the production tree exactly once. */

  /* ─── True structural clone of a tree ─── */
  /* Creates a deep copy with identical left/right/parent pointers, so the
     clone has the exact same visual shape as the production tree. Mutations
     on the clone never touch the production tree. */

  function cloneBst(tree) {
    var TreeModel = (typeof global.TreeModel !== "undefined") ? global.TreeModel : null;
    if (!TreeModel) return null;
    var T = TreeModel.BinarySearchTree;
    var TreeNode = TreeModel.TreeNode;
    var clone = new T();

    function copyNode(original, parentClone) {
      if (original === null) return null;
      var n = new TreeNode(original.value);
      n.parent = parentClone;
      n.left = copyNode(original.left, n);
      n.right = copyNode(original.right, n);
      return n;
    }

    clone.root = copyNode(tree.root, null);
    clone._size = tree.size;
    return clone;
  }

  /* ─── Derive visual state per step ─── */

  /* Given the raw step list from tree-model, build a "visual step" list where
     each step carries:
       - all original step fields
       - currentValue: the node currently being compared (the step nodeValue,
         or for insert/found final steps, the inserted/found value)
       - visitedValues: array of node values already traversed (for coloring)
       - selectedValue: node to highlight as "found/selected" (final success)
       - msg: human explanation
       - stepType: semantic type used to color the current node
  */

  function buildVisualSteps(rawSteps, opts) {
    var operation = opts.operation; // "insert" | "search" | "delete"
    var target = opts.target;
    var visited = [];
    var resultSteps = [];

    for (var i = 0; i < rawSteps.length; i++) {
      var s = rawSteps[i];
      var currentValue = null;
      var selectedValue = null;
      var stepType = s.type;

      /* Determine current node for coloring */
      if (s.type === "compare" && s.nodeValue !== null && s.nodeValue !== undefined) {
        currentValue = s.nodeValue;
      } else if (s.type === "go_left" || s.type === "go_right") {
        currentValue = s.nodeValue; // the node we're leaving from
      } else if (s.type === "insert") {
        currentValue = s.nodeValue; // the newly inserted node
      } else if (s.type === "found") {
        currentValue = s.nodeValue;
      } else if (s.type === "find_successor") {
        currentValue = s.nodeValue;
      } else if (s.type === "delete_leaf" || s.type === "delete_one_child") {
        currentValue = s.nodeValue;
      } else if (s.type === "replace_value") {
        currentValue = s.nodeValue;
      }

      /* Track visited nodes (nodes we've compared/traversed so far) */
      if (s.type === "compare" && currentValue !== null) {
        visited.push(currentValue);
      } else if ((s.type === "go_left" || s.type === "go_right") && currentValue !== null) {
        /* the departure node is already visited via its compare step (insert/delete)
           but for search the go step follows the compare step; dedupe below */
        visited.push(currentValue);
      }

      /* Dedupe visited */
      var uniqVisited = [];
      for (var v = 0; v < visited.length; v++) {
        if (uniqVisited.indexOf(visited[v]) === -1) uniqVisited.push(visited[v]);
      }
      visited = uniqVisited;

      /* Determine selected (final success node) */
      if (s.type === "found") {
        selectedValue = s.nodeValue;
        stepType = "found";
      } else if (operation === "insert" && s.type === "insert") {
        /* highlight newly inserted node as selected at the end */
        selectedValue = s.nodeValue;
        stepType = "insert";
      }

      resultSteps.push({
        type: stepType,
        rawType: s.type,
        operation: operation,
        nodeValue: s.nodeValue !== undefined ? s.nodeValue : null,
        targetValue: s.targetValue !== undefined ? s.targetValue : target,
        direction: s.direction !== undefined ? s.direction : null,
        parentId: s.parentId !== undefined ? s.parentId : null,
        phase: s.phase,
        msg: s.msg,
        currentValue: currentValue,
        visitedValues: uniqVisited.slice(),
        selectedValue: selectedValue,
      });
    }

    return resultSteps;
  }

  /* ─── Operations ─── */

  function runInsert(tree, value, callbacks) {
    var clone = cloneBst(tree);
    if (!clone) return { ok: false, error: "Model unavailable" };

    var rawSteps = [];
    var inserted = clone.insert(value, rawSteps);

    /* Determine if the last step indicates duplicate */
    var isDuplicate = false;
    if (rawSteps.length > 0) {
      var last = rawSteps[rawSteps.length - 1];
      if (last.type === "duplicate") isDuplicate = true;
    }

    var visualSteps = buildVisualSteps(rawSteps, {
      operation: "insert",
      target: value,
    });

    var committed = false;
    if (!isDuplicate && inserted !== null) {
      /* Commit to production tree once */
      tree.insert(value);
      committed = true;
    }

    return {
      ok: true,
      committed: committed,
      duplicate: isDuplicate,
      steps: visualSteps,
      targetNode: inserted ? inserted.value : null,
    };
  }

  function runSearch(tree, value) {
    var clone = cloneBst(tree);
    if (!clone) return { ok: false, error: "Model unavailable" };

    var rawSteps = [];
    var found = clone.search(value, rawSteps);

    var visualSteps = buildVisualSteps(rawSteps, {
      operation: "search",
      target: value,
    });

    return {
      ok: true,
      found: found !== null,
      steps: visualSteps,
      targetNode: found ? found.value : null,
    };
  }

  function runDelete(tree, value) {
    var clone = cloneBst(tree);
    if (!clone) return { ok: false, error: "Model unavailable" };

    var rawSteps = [];
    var deleted = clone.delete(value, rawSteps);

    var visualSteps = buildVisualSteps(rawSteps, {
      operation: "delete",
      target: value,
    });

    var committed = false;
    if (deleted) {
      tree.delete(value);
      committed = true;
    }

    return {
      ok: true,
      committed: committed,
      found: deleted,
      steps: visualSteps,
    };
  }

  /* ─── Exports ─── */

  var exportsObj = {
    runInsert: runInsert,
    runSearch: runSearch,
    runDelete: runDelete,
    buildVisualSteps: buildVisualSteps,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.BSTOperations = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
