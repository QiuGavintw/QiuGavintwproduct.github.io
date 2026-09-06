(function (global) {
  "use strict";

  /* ─── TreeNode ─── */

  function TreeNode(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.parent = null;
  }

  TreeNode.prototype.isLeaf = function () {
    return this.left === null && this.right === null;
  };

  TreeNode.prototype.hasLeft = function () {
    return this.left !== null;
  };

  TreeNode.prototype.hasRight = function () {
    return this.right !== null;
  };

  TreeNode.prototype.hasBothChildren = function () {
    return this.left !== null && this.right !== null;
  };

  TreeNode.prototype.hasOneChild = function () {
    return (this.left !== null) !== (this.right !== null);
  };

  TreeNode.prototype.childCount = function () {
    return (this.left !== null ? 1 : 0) + (this.right !== null ? 1 : 0);
  };

  TreeNode.prototype.typeLabel = function () {
    if (this.parent === null) return "root";
    if (this.isLeaf()) return "leaf";
    return "internal";
  };

  /* ─── BinarySearchTree ─── */

  function BinarySearchTree() {
    this.root = null;
    this._size = 0;
  }

  Object.defineProperty(BinarySearchTree.prototype, "size", {
    get: function () {
      return this._size;
    },
  });

  BinarySearchTree.prototype.isEmpty = function () {
    return this._size === 0;
  };

  /* ─── height (recursive helper) ─── */

  function heightOf(node) {
    if (node === null) return -1;
    var lh = heightOf(node.left);
    var rh = heightOf(node.right);
    return 1 + (lh > rh ? lh : rh);
  }

  Object.defineProperty(BinarySearchTree.prototype, "height", {
    get: function () {
      return heightOf(this.root);
    },
  });

  /* ─── findMin / findMax ─── */

  BinarySearchTree.prototype.findMin = function () {
    if (this.root === null) return null;
    var node = this.root;
    while (node.left !== null) node = node.left;
    return node;
  };

  BinarySearchTree.prototype.findMax = function () {
    if (this.root === null) return null;
    var node = this.root;
    while (node.right !== null) node = node.right;
    return node;
  };

  /* ─── findByValue ─── */

  BinarySearchTree.prototype.findByValue = function (value) {
    var node = this.root;
    while (node !== null) {
      if (value === node.value) return node;
      node = value < node.value ? node.left : node.right;
    }
    return null;
  };

  /* ─── INSERT ─── */

  BinarySearchTree.prototype.insert = function (value, steps) {
    var node = new TreeNode(value);

    if (this.root === null) {
      this.root = node;
      this._size = 1;
      if (steps) {
        steps.push({
          type: "insert",
          nodeValue: value,
          targetValue: value,
          direction: null,
          parentId: null,
          msg: "已插入根節點 " + value,
          phase: "inserting",
        });
      }
      return node;
    }

    var current = this.root;
    while (true) {
      if (steps) {
        steps.push({
          type: "compare",
          nodeValue: current.value,
          targetValue: value,
          direction: null,
          parentId: current.parent ? current.parent.value : null,
          msg: "比較 " + value + " 與 " + current.value,
          phase: "inserting",
        });
      }

      if (value === current.value) {
        if (steps) {
          steps.push({
            type: "duplicate",
            nodeValue: current.value,
            targetValue: value,
            direction: null,
            parentId: null,
            msg: value + " 已存在，無法重複插入",
            phase: "inserting",
          });
        }
        return null;
      }

      if (value < current.value) {
        if (steps) {
          steps.push({
            type: "go_left",
            nodeValue: current.value,
            targetValue: value,
            direction: "left",
            parentId: null,
            msg: value + " < " + current.value + "，往左",
            phase: "inserting",
          });
        }
        if (current.left === null) {
          current.left = node;
          node.parent = current;
          this._size++;
          if (steps) {
            steps.push({
              type: "insert",
              nodeValue: value,
              targetValue: value,
              direction: "left",
              parentId: current.value,
              msg: "已插入 " + value + " 到 " + current.value + " 的左子節點",
              phase: "inserting",
            });
          }
          return node;
        }
        current = current.left;
      } else {
        if (steps) {
          steps.push({
            type: "go_right",
            nodeValue: current.value,
            targetValue: value,
            direction: "right",
            parentId: null,
            msg: value + " > " + current.value + "，往右",
            phase: "inserting",
          });
        }
        if (current.right === null) {
          current.right = node;
          node.parent = current;
          this._size++;
          if (steps) {
            steps.push({
              type: "insert",
              nodeValue: value,
              targetValue: value,
              direction: "right",
              parentId: current.value,
              msg: "已插入 " + value + " 到 " + current.value + " 的右子節點",
              phase: "inserting",
            });
          }
          return node;
        }
        current = current.right;
      }
    }
  };

  /* ─── SEARCH ─── */

  BinarySearchTree.prototype.search = function (value, steps) {
    var current = this.root;

    while (current !== null) {
      if (steps) {
        steps.push({
          type: "compare",
          nodeValue: current.value,
          targetValue: value,
          direction: null,
          parentId: current.parent ? current.parent.value : null,
          msg: "比較 " + value + " 與 " + current.value,
          phase: "searching",
        });
      }

      if (value === current.value) {
        if (steps) {
          steps.push({
            type: "found",
            nodeValue: current.value,
            targetValue: value,
            direction: null,
            parentId: null,
            msg: "找到 " + value,
            phase: "searching",
          });
        }
        return current;
      }

      if (value < current.value) {
        if (steps) {
          steps.push({
            type: "go_left",
            nodeValue: current.value,
            targetValue: value,
            direction: "left",
            parentId: null,
            msg: value + " < " + current.value + "，往左",
            phase: "searching",
          });
        }
        current = current.left;
      } else {
        if (steps) {
          steps.push({
            type: "go_right",
            nodeValue: current.value,
            targetValue: value,
            direction: "right",
            parentId: null,
            msg: value + " > " + current.value + "，往右",
            phase: "searching",
          });
        }
        current = current.right;
      }
    }

    if (steps) {
      steps.push({
        type: "not_found",
        nodeValue: null,
        targetValue: value,
        direction: null,
        parentId: null,
        msg: "找不到 " + value,
        phase: "searching",
      });
    }
    return null;
  };

  /* ─── DELETE ─── */

  BinarySearchTree.prototype.delete = function (value, steps) {
    var node = this.findByValue(value);

    if (node === null) {
      if (steps) {
        steps.push({
          type: "not_found",
          nodeValue: null,
          targetValue: value,
          direction: null,
          parentId: null,
          msg: "找不到 " + value + "，無法刪除",
          phase: "deleting",
        });
      }
      return false;
    }

    if (steps) {
      steps.push({
        type: "found",
        nodeValue: node.value,
        targetValue: value,
        direction: null,
        parentId: node.parent ? node.parent.value : null,
        msg: "找到要刪除的節點 " + value,
        phase: "deleting",
      });
    }

    if (node.isLeaf()) {
      this._deleteLeaf(node, steps);
    } else if (node.hasOneChild()) {
      this._deleteOneChild(node, steps);
    } else {
      this._deleteTwoChildren(node, steps);
    }

    this._size--;
    return true;
  };

  BinarySearchTree.prototype._deleteLeaf = function (node, steps) {
    if (steps) {
      steps.push({
        type: "delete_leaf",
        nodeValue: node.value,
        targetValue: node.value,
        direction: null,
        parentId: node.parent ? node.parent.value : null,
        msg: "節點 " + node.value + " 是葉節點，直接刪除",
        phase: "deleting",
      });
    }
    this._detachNode(node);
  };

  BinarySearchTree.prototype._deleteOneChild = function (node, steps) {
    var child = node.left !== null ? node.left : node.right;
    var side = node.left !== null ? "left" : "right";

    if (steps) {
      steps.push({
        type: "delete_one_child",
        nodeValue: node.value,
        targetValue: node.value,
        direction: side,
        parentId: node.parent ? node.parent.value : null,
        childValue: child.value,
        msg:
          "節點 " +
          node.value +
          " 只有一個子節點 (" +
          child.value +
          ")，用子節點替換",
        phase: "deleting",
      });
    }

    child.parent = node.parent;
    if (node.parent === null) {
      this.root = child;
    } else if (node === node.parent.left) {
      node.parent.left = child;
    } else {
      node.parent.right = child;
    }
  };

  BinarySearchTree.prototype._deleteTwoChildren = function (node, steps) {
    var successor = node.right;
    while (successor.left !== null) successor = successor.left;

    if (steps) {
      steps.push({
        type: "find_successor",
        nodeValue: node.value,
        targetValue: node.value,
        direction: null,
        parentId: null,
        successorValue: successor.value,
        msg:
          "節點 " +
          node.value +
          " 有兩個子節點，找到中序後繼 " +
          successor.value,
        phase: "deleting",
      });
    }

    node.value = successor.value;

    if (steps) {
      steps.push({
        type: "replace_value",
        nodeValue: successor.value,
        targetValue: successor.value,
        direction: null,
        parentId: null,
        msg:
          "將 " +
          node.value +
          " 的值替換為後繼 " +
          successor.value +
          " 的值",
        phase: "deleting",
      });
    }

    if (successor.isLeaf()) {
      this._deleteLeaf(successor, steps);
    } else {
      this._deleteOneChild(successor, steps);
    }
  };

  BinarySearchTree.prototype._detachNode = function (node) {
    if (node.parent === null) {
      this.root = null;
    } else if (node === node.parent.left) {
      node.parent.left = null;
    } else {
      node.parent.right = null;
    }
    node.parent = null;
  };

  /* ─── TRAVERSALS (value arrays) ─── */

  function collectPreorder(node, result) {
    if (node === null) return;
    result.push(node.value);
    collectPreorder(node.left, result);
    collectPreorder(node.right, result);
  }

  function collectInorder(node, result) {
    if (node === null) return;
    collectInorder(node.left, result);
    result.push(node.value);
    collectInorder(node.right, result);
  }

  function collectPostorder(node, result) {
    if (node === null) return;
    collectPostorder(node.left, result);
    collectPostorder(node.right, result);
    result.push(node.value);
  }

  BinarySearchTree.prototype.preorder = function () {
    var result = [];
    collectPreorder(this.root, result);
    return result;
  };

  BinarySearchTree.prototype.inorder = function () {
    var result = [];
    collectInorder(this.root, result);
    return result;
  };

  BinarySearchTree.prototype.postorder = function () {
    var result = [];
    collectPostorder(this.root, result);
    return result;
  };

  BinarySearchTree.prototype.levelOrder = function () {
    if (this.root === null) return [];
    var result = [];
    var queue = [this.root];
    while (queue.length > 0) {
      var node = queue.shift();
      result.push(node.value);
      if (node.left !== null) queue.push(node.left);
      if (node.right !== null) queue.push(node.right);
    }
    return result;
  };

  /* ─── STEP-BASED TRAVERSALS ─── */

  function preorderSteps(node, steps, depth) {
    if (node === null) return;
    steps.push({
      type: "visit",
      nodeValue: node.value,
      targetValue: null,
      direction: null,
      parentId: node.parent ? node.parent.value : null,
      msg: "訪問節點 " + node.value,
      phase: "traversing",
      order: "preorder",
      depth: depth,
    });
    preorderSteps(node.left, steps, depth + 1);
    preorderSteps(node.right, steps, depth + 1);
  }

  function inorderSteps(node, steps, depth) {
    if (node === null) return;
    inorderSteps(node.left, steps, depth + 1);
    steps.push({
      type: "visit",
      nodeValue: node.value,
      targetValue: null,
      direction: null,
      parentId: node.parent ? node.parent.value : null,
      msg: "訪問節點 " + node.value,
      phase: "traversing",
      order: "inorder",
      depth: depth,
    });
    inorderSteps(node.right, steps, depth + 1);
  }

  function postorderSteps(node, steps, depth) {
    if (node === null) return;
    postorderSteps(node.left, steps, depth + 1);
    postorderSteps(node.right, steps, depth + 1);
    steps.push({
      type: "visit",
      nodeValue: node.value,
      targetValue: null,
      direction: null,
      parentId: node.parent ? node.parent.value : null,
      msg: "訪問節點 " + node.value,
      phase: "traversing",
      order: "postorder",
      depth: depth,
    });
  }

  BinarySearchTree.prototype.preorderSteps = function () {
    var steps = [];
    preorderSteps(this.root, steps, 0);
    return steps;
  };

  BinarySearchTree.prototype.inorderSteps = function () {
    var steps = [];
    inorderSteps(this.root, steps, 0);
    return steps;
  };

  BinarySearchTree.prototype.postorderSteps = function () {
    var steps = [];
    postorderSteps(this.root, steps, 0);
    return steps;
  };

  BinarySearchTree.prototype.levelOrderSteps = function () {
    var steps = [];
    if (this.root === null) return steps;
    var queue = [{ node: this.root, depth: 0 }];
    while (queue.length > 0) {
      var item = queue.shift();
      var node = item.node;
      var depth = item.depth;
      steps.push({
        type: "visit",
        nodeValue: node.value,
        targetValue: null,
        direction: null,
        parentId: node.parent ? node.parent.value : null,
        msg: "訪問節點 " + node.value,
        phase: "traversing",
        order: "levelorder",
        depth: depth,
      });
      if (node.left !== null) queue.push({ node: node.left, depth: depth + 1 });
      if (node.right !== null)
        queue.push({ node: node.right, depth: depth + 1 });
    }
    return steps;
  };

  /* ─── CLEAR ─── */

  BinarySearchTree.prototype.clear = function () {
    this.root = null;
    this._size = 0;
  };

  /* ─── toArray (for debugging / serialization) ─── */

  BinarySearchTree.prototype.toArray = function () {
    var result = [];
    var queue = this.root !== null ? [this.root] : [];
    while (queue.length > 0) {
      var node = queue.shift();
      result.push({
        value: node.value,
        left: node.left ? node.left.value : null,
        right: node.right ? node.right.value : null,
        parent: node.parent ? node.parent.value : null,
        type: node.typeLabel(),
      });
      if (node.left !== null) queue.push(node.left);
      if (node.right !== null) queue.push(node.right);
    }
    return result;
  };

  /* ─── buildFromSortedArray (utility for testing) ─── */

  BinarySearchTree.prototype.buildFromSortedArray = function (arr) {
    this.clear();
    if (!arr || arr.length === 0) return;

    var sorted = arr.slice().sort(function (a, b) {
      return a - b;
    });

    function insertBalanced(bst, list, start, end) {
      if (start > end) return;
      var mid = Math.floor((start + end) / 2);
      bst.insert(list[mid]);
      insertBalanced(bst, list, start, mid - 1);
      insertBalanced(bst, list, mid + 1, end);
    }

    insertBalanced(this, sorted, 0, sorted.length - 1);
  };

  /* ─── buildFromPreorder (utility for testing specific trees) ─── */

  BinarySearchTree.prototype.buildFromPreorder = function (values) {
    this.clear();
    for (var i = 0; i < values.length; i++) {
      this.insert(values[i]);
    }
  };

  /* ─── Exports ─── */

  var exportsObj = {
    TreeNode: TreeNode,
    BinarySearchTree: BinarySearchTree,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.TreeModel = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
