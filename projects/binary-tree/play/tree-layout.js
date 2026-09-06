(function (global) {
  "use strict";

  /* ─── Tree Layout System ─── */
  /* Calculates x/y coordinates for each node based on tree structure.
     Uses inorder traversal index for x-positioning (guarantees no overlap)
     and depth for y-positioning. */

  var DEFAULTS = {
    nodeRadius: 24,
    horizontalGap: 80,
    verticalGap: 90,
  };

  /* ─── calculateLayout ─── */

  function calculateLayout(tree, options) {
    var opts = {};
    opts.nodeRadius =
      options && options.nodeRadius !== undefined
        ? options.nodeRadius
        : DEFAULTS.nodeRadius;
    opts.horizontalGap =
      options && options.horizontalGap !== undefined
        ? options.horizontalGap
        : DEFAULTS.horizontalGap;
    opts.verticalGap =
      options && options.verticalGap !== undefined
        ? options.verticalGap
        : DEFAULTS.verticalGap;

    if (tree === null || tree === undefined || tree.isEmpty()) {
      return { nodes: [], edges: [], width: 0, height: 0 };
    }

    /* Step 1: Assign inorder indices and depths */
    var inorderIndex = 0;
    var nodeInfoMap = {};

    function assignInorder(node, depth) {
      if (node === null) return;
      assignInorder(node.left, depth + 1);
      nodeInfoMap[node.value] = { index: inorderIndex, depth: depth };
      inorderIndex++;
      assignInorder(node.right, depth + 1);
    }

    assignInorder(tree.root, 0);

    /* Step 2: Calculate node coordinates */
    var nodes = [];
    var maxDepth = 0;

    function collectNodes(node) {
      if (node === null) return;
      var info = nodeInfoMap[node.value];
      var x = info.index * opts.horizontalGap;
      var y = info.depth * opts.verticalGap;
      if (info.depth > maxDepth) maxDepth = info.depth;
      nodes.push({
        value: node.value,
        x: x,
        y: y,
        depth: info.depth,
        type: node.typeLabel(),
        hasLeft: node.hasLeft(),
        hasRight: node.hasRight(),
        isLeaf: node.isLeaf(),
      });
      collectNodes(node.left);
      collectNodes(node.right);
    }

    collectNodes(tree.root);

    /* Step 3: Generate edges */
    var edges = [];

    function collectEdges(node) {
      if (node === null) return;
      if (node.left !== null) {
        var fromInfo = nodeInfoMap[node.value];
        var toInfo = nodeInfoMap[node.left.value];
        edges.push({
          fromValue: node.value,
          toValue: node.left.value,
          fromX: fromInfo.index * opts.horizontalGap,
          fromY: fromInfo.depth * opts.verticalGap,
          toX: toInfo.index * opts.horizontalGap,
          toY: toInfo.depth * opts.verticalGap,
        });
        collectEdges(node.left);
      }
      if (node.right !== null) {
        var fromInfo2 = nodeInfoMap[node.value];
        var toInfo2 = nodeInfoMap[node.right.value];
        edges.push({
          fromValue: node.value,
          toValue: node.right.value,
          fromX: fromInfo2.index * opts.horizontalGap,
          fromY: fromInfo2.depth * opts.verticalGap,
          toX: toInfo2.index * opts.horizontalGap,
          toY: toInfo2.depth * opts.verticalGap,
        });
        collectEdges(node.right);
      }
    }

    collectEdges(tree.root);

    /* Step 4: Calculate dimensions */
    var nodeCount = nodes.length;
    var width = nodeCount > 1 ? (nodeCount - 1) * opts.horizontalGap : 0;
    var height = maxDepth * opts.verticalGap;

    return {
      nodes: nodes,
      edges: edges,
      width: width,
      height: height,
      nodeCount: nodeCount,
      maxDepth: maxDepth,
      options: {
        nodeRadius: opts.nodeRadius,
        horizontalGap: opts.horizontalGap,
        verticalGap: opts.verticalGap,
      },
    };
  }

  /* ─── validateLayout ─── */
  /* Checks that no two nodes overlap. */

  function validateLayout(result, options) {
    var nodeRadius = (options && options.nodeRadius) || DEFAULTS.nodeRadius;
    var minDistance = nodeRadius * 2 + 4;
    var violations = [];

    for (var i = 0; i < result.nodes.length; i++) {
      for (var j = i + 1; j < result.nodes.length; j++) {
        var a = result.nodes[i];
        var b = result.nodes[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          violations.push({
            nodeA: a.value,
            nodeB: b.value,
            distance: dist,
            required: minDistance,
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations: violations,
    };
  }

  /* ─── Exports ─── */

  var exportsObj = {
    calculateLayout: calculateLayout,
    validateLayout: validateLayout,
    DEFAULTS: DEFAULTS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.TreeLayout = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
