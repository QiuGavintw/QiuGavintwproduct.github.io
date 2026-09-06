(function (global) {
  "use strict";

  /* ─── Educational Learning Layer ───
     Phase 7: derives read-only educational information from the Tree Model
     and the existing visual steps. It NEVER mutates the tree, never
     re-implements BST algorithms or traversal, and never touches canvas.

     Responsibilities:
       - getNodeInfo(tree, value)  : depth/type/parent/children/degree
       - getTreeSummary(tree)      : node count / root / height / leaf count
       - getConceptText(concept)   : static concept explanations
       - explainStep(step)         : turn one existing step into teaching text

     All depth values follow the project convention (Phase 2 layout):
       Root depth = 0, Tree height = max depth, Empty height = -1,
       Single-node height = 0.
  */

  var CONCEPT_KEYS = [
    "root", "parent", "child", "leaf", "degree", "depth", "height",
    "bst", "inorder-sorted", "preorder", "inorder", "postorder", "levelorder",
  ];

  var CONCEPTS = {
    root: {
      title: "Root（根節點）",
      body: ["一棵樹最上方的節點稱為 Root（根節點）。", "它沒有 Parent，也是所有其他節點的共同祖先。"],
      rule: "Depth = 0",
    },
    parent: {
      title: "Parent（父節點）",
      body: ["某個節點的上一層、直接與它相連的節點，稱為它的 Parent（父節點）。"],
      rule: "例如：50 是 30 的 Parent。",
    },
    child: {
      title: "Child（子節點）",
      body: ["某個節點直接連到下一層的節點，稱為它的 Child（子節點）。", "一個節點最多有兩個 Child：Left Child 與 Right Child。"],
      rule: "例如：30 與 70 都是 50 的 Child。",
    },
    leaf: {
      title: "Leaf（葉節點）",
      body: ["沒有任何子節點的節點稱為 Leaf（葉節點）。", "它位在樹的末端，Child Count = 0。"],
      rule: "例如：20、40、60、80 都是 Leaf。",
    },
    degree: {
      title: "Child Count（子節點數量）",
      body: ["子節點數量代表該節點連接著幾個 Child。", "0 = Leaf、1 = 只有一個 Child、2 = 有兩個 Child。"],
      rule: "Child Count ∈ {0, 1, 2}",
    },
    depth: {
      title: "Depth（深度）",
      body: ["Root 的 Depth = 0，每往下一層 Depth 加 1。", "Depth 代表節點離 Root 有幾層。"],
      rule: "Root = 0，其子 = 1，再下一層 = 2",
    },
    height: {
      title: "Height（高度）",
      body: ["Tree Height = 所有節點中最大的 Depth。", "單一節點的樹 Height = 0；空樹 Height = -1。"],
      rule: "Height = max(Depth)",
    },
    bst: {
      title: "BST 規則（Binary Search Tree）",
      body: ["BST 是特殊的二元樹：對任一節點，左子樹的所有值都小於它，右子樹的所有值都大於它。"],
      rule: "Left subtree < Node < Right subtree",
    },
    "inorder-sorted": {
      title: "中序排序特性",
      body: ["對 BST 做 Inorder Traversal，會依序走訪 左 → Root → 右。"],
      rule: "對 BST 做 Inorder 會得到由小到大的排序結果。",
    },
    preorder: {
      title: "Preorder（前序）",
      body: ["先拜訪 Root，再遞迴走左子樹，最後走右子樹。"],
      rule: "Root → Left → Right",
    },
    inorder: {
      title: "Inorder（中序）",
      body: ["先遞迴走左子樹，再拜訪 Root，最後走右子樹。", "對 BST 做 Inorder 會得到由小到大的結果。"],
      rule: "Left → Root → Right",
    },
    postorder: {
      title: "Postorder（後序）",
      body: ["先遞迴走左子樹，再走右子樹，最後才拜訪 Root。"],
      rule: "Left → Right → Root",
    },
    levelorder: {
      title: "Level-order（層序）",
      body: ["由上到下、由左到右逐層拜訪。", "使用 Queue：先處理目前節點，再把它左右的子節點加入 Queue。"],
      rule: "使用 Queue 逐層掃描",
    },
  };

  var TRAVERSAL_LABELS = {
    preorder: "Preorder（前序）：Root → Left → Right",
    inorder: "Inorder（中序）：Left → Root → Right",
    postorder: "Postorder（後序）：Left → Right → Root",
    levelorder: "Level-order（層序）：由上到下、由左到右，使用 Queue",
  };

  function opLabel(operation, target) {
    if (operation === "insert") return "Insert " + target + "（插入）";
    if (operation === "search") return "Search " + target + "（搜尋）";
    if (operation === "delete") return "Delete " + target + "（刪除）";
    return String(operation);
  }

  /* ─── createEducationModule ─── */

  function createEducationModule() {
    return {
      getNodeInfo: getNodeInfo,
      getTreeSummary: getTreeSummary,
      getConceptText: getConceptText,
      explainStep: explainStep,
      listConcepts: function () {
        return CONCEPT_KEYS.slice();
      },
    };
  }

  /* ─── getNodeInfo ─── */

  function getNodeInfo(tree, value) {
    if (!tree || typeof tree.findByValue !== "function") {
      return { found: false };
    }
    var node = tree.findByValue(value);
    if (!node) {
      return { found: false, value: value };
    }

    var depth = 0;
    var p = node.parent;
    while (p !== null) {
      depth++;
      p = p.parent;
    }

    var isRoot = node.parent === null;
    var isLeaf = node.isLeaf();
    var type;
    if (isRoot && isLeaf) type = "root-leaf";
    else if (isRoot) type = "root";
    else if (isLeaf) type = "leaf";
    else type = "internal";

    var typeLabel;
    switch (type) {
      case "root-leaf": typeLabel = "Root（根節點）＋ Leaf（葉節點）"; break;
      case "root": typeLabel = "Root（根節點）"; break;
      case "leaf": typeLabel = "Leaf（葉節點）"; break;
      default: typeLabel = "Internal（內部節點）";
    }

    return {
      found: true,
      value: node.value,
      type: type,
      typeLabel: typeLabel,
      depth: depth,
      parent: node.parent ? node.parent.value : null,
      left: node.left ? node.left.value : null,
      right: node.right ? node.right.value : null,
      childCount: node.childCount(),
      isRoot: isRoot,
      isLeaf: isLeaf,
      hasLeft: node.hasLeft(),
      hasRight: node.hasRight(),
      hasBothChildren: node.hasBothChildren(),
      hasOneChild: node.hasOneChild(),
    };
  }

  /* ─── getTreeSummary ─── */

  function getTreeSummary(tree) {
    if (!tree) {
      return { nodeCount: 0, root: null, height: -1, leafCount: 0, empty: true };
    }

    var nodeCount = tree.size || 0;
    var root = tree.root ? tree.root.value : null;
    /* Phase 1 definition: empty = -1, single node = 0, else max depth */
    var height = typeof tree.height === "number" ? tree.height : (tree.root ? 0 : -1);

    var leafCount = 0;
    if (tree.root) {
      var queue = [tree.root];
      while (queue.length > 0) {
        var n = queue.shift();
        if (n.isLeaf()) leafCount++;
        if (n.left !== null) queue.push(n.left);
        if (n.right !== null) queue.push(n.right);
      }
    }

    return {
      nodeCount: nodeCount,
      root: root,
      height: height,
      leafCount: leafCount,
      empty: nodeCount === 0,
      single: nodeCount === 1,
    };
  }

  /* ─── getConceptText ─── */

  function getConceptText(concept) {
    var c = CONCEPTS[concept];
    if (!c) return null;
    return {
      key: concept,
      title: c.title,
      body: c.body.slice(),
      rule: c.rule,
    };
  }

  /* ─── explainStep ─── */
  /* Translates ONE existing visual step (produced by Phase 4 BST operations
     or Phase 5 traversal operations) into a structured teaching text. Does
     NOT recompute any algorithm: it reads the step's fields (type, rawType,
     operation, nodeValue, targetValue, direction, parentId, childValue,
     successorValue, traversalOrder, visitIndex) and rephrases them. */

  function explainStep(step) {
    if (!step) return null;
    var t = step.type;
    var op = step.operation;
    var nodeValue = step.nodeValue;
    var target = step.targetValue;

    var title = null;
    var lines = [];
    var rule = null;

    if (t === "visit") {
      var order = step.order;
      title = TRAVERSAL_LABELS[order] || order;
      lines.push("訪問節點 " + nodeValue);
      if (step.visitIndex !== undefined && step.traversalOrder && step.traversalOrder.length > 0) {
        lines.push("已訪問 " + (step.visitIndex + 1) + " / " + step.traversalOrder.length);
      }
      if (order === "levelorder") {
        rule = "Level-order 使用 Queue：先處理目前節點，再將它的左右子節點加入 Queue。";
        lines.push(rule);
      }
      if (order === "inorder") {
        rule = "對 BST 做 Inorder 會得到由小到大的排序結果。";
        lines.push(rule);
      }
      return { title: title, lines: lines, rule: rule };
    }

    title = opLabel(op, target);

    switch (t) {
      case "compare":
        lines.push("目前節點：" + nodeValue);
        if (target < nodeValue) {
          lines.push(target + " < " + nodeValue);
          lines.push("→ 往「左」子樹" + (op === "insert" ? "，繼續尋找插入位置。" : "搜尋。"));
        } else if (target > nodeValue) {
          lines.push(target + " > " + nodeValue);
          lines.push("→ 往「右」子樹" + (op === "insert" ? "，繼續尋找插入位置。" : "搜尋。"));
        } else {
          lines.push(target + " = " + nodeValue);
          lines.push("→ 就是它！");
        }
        rule = "BST 規則：左子樹 < 節點 < 右子樹。目標較小往左、較大往右。";
        break;

      case "go_left":
        lines.push("目前節點：" + nodeValue);
        lines.push(target + " < " + nodeValue);
        lines.push("→ 往左子樹" + (op === "insert" ? "，繼續尋找插入位置。" : "繼續搜尋。"));
        break;

      case "go_right":
        lines.push("目前節點：" + nodeValue);
        lines.push(target + " > " + nodeValue);
        lines.push("→ 往右子樹" + (op === "insert" ? "，繼續尋找插入位置。" : "繼續搜尋。"));
        break;

      case "found":
        if (op === "delete") {
          title = "已找到待刪除節點";
          lines.push("找到要刪除的節點 " + nodeValue + "。");
        } else {
          title = "找到目標";
          lines.push("找到 " + target + "！");
        }
        break;

      case "not_found":
        title = "找不到";
        lines.push("找不到 " + target + "（到達了空的位置）。");
        if (op === "delete") lines.push("節點不在樹中，無法刪除，Tree 不變。");
        if (op === "insert") lines.push("BST 不允許重複值，插入已取消。");
        break;

      case "insert":
        title = "插入完成";
        if (step.parentId === null || step.parentId === undefined) {
          lines.push("將 " + nodeValue + " 作為根節點插入。");
          rule = "空樹插入新值時，該值直接成為根節點。";
        } else {
          var side = step.direction === "left" ? "左" : "右";
          lines.push("將 " + nodeValue + " 插入到 " + step.parentId + " 的「" + side + "」子節點位置。");
          rule = "新值與節點比較：小於往左、大於往右，插入到第一個空的位置。";
        }
        lines.push("插入完成！");
        break;

      case "duplicate":
        title = "Duplicate（重複值）";
        lines.push(target + " 已存在。");
        lines.push("BST 不允許重複節點，插入已取消。");
        break;

      case "delete_leaf":
        title = "Leaf 直接刪除";
        lines.push("節點 " + nodeValue + " 是 Leaf（葉節點），沒有子節點。");
        lines.push("可以直接刪除。");
        rule = "移除葉節點即可，不需要調整其他節點。";
        break;

      case "delete_one_child":
        title = "只有一個子節點";
        lines.push("節點 " + nodeValue + " 只有一個子節點" + (step.childValue !== undefined ? "（" + step.childValue + "）" : "") + "。");
        if (step.childValue !== undefined) {
          lines.push("刪除後由它的子節點 " + step.childValue + " 直接接替這個位置，維持 BST 的排序。");
        } else if (step.msg) {
          lines.push(step.msg);
        }
        rule = "由唯一子節點接替，仍符合 BST 排序規則。";
        break;

      case "find_successor":
        title = "兩個子節點 → 找 Inorder Successor";
        lines.push("節點 " + nodeValue + " 有兩個子節點。");
        lines.push("需要找它的 Inorder Successor 來維持 BST 的排序規則。");
        if (step.successorValue !== undefined) {
          lines.push("找到 Successor：" + step.successorValue);
        } else if (step.msg) {
          lines.push(step.msg);
        }
        rule = "Inorder Successor = 該節點右子樹中的最小值（最左節點）。";
        break;

      case "replace_value":
        title = "使用 Successor 取代";
        lines.push("使用 Successor 的值（" + nodeValue + "）取代原節點的值。");
        lines.push("再刪除 Successor 原位置。");
        break;

      default:
        lines.push(step.msg || "");
    }

    return { title: title, lines: lines, rule: rule };
  }

  /* ─── Exports ─── */

  var exportsObj = {
    createEducationModule: createEducationModule,
    getNodeInfo: getNodeInfo,
    getTreeSummary: getTreeSummary,
    getConceptText: getConceptText,
    explainStep: explainStep,
    CONCEPTS: CONCEPTS,
    CONCEPT_KEYS: CONCEPT_KEYS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.Education = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);