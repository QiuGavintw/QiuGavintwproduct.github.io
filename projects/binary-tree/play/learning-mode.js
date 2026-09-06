(function (global) {
  "use strict";

  /* ─── Interactive Learning Mode ───
     Phase 8: a pre-arranged teaching flow (9 lessons) built ON TOP of the
     existing Unified Workspace. This module is a PURE data + state machine:
     it does NOT contain renderer code, does NOT re-implement any BST or
     traversal algorithm, and does NOT create a second AnimationController.

     Lessons are DATA-DRIVEN. Each "step" inside a lesson is either:
       - { kind: "concept", title, text, rule?, highlight: [values] }
         → show text + reuse the renderer's setNodeState() for highlights.
       - { kind: "op", op: "search"|"insert"|"delete"|"traversal",
           value?, traversal?, tree: [initial values], text, rule? }
         → index.html drives the SINGLE existing workspace controller with
           BSTOperations / TraversalOperations (via workspace.runX()).

     Tree isolation: captureFreeTree() snapshots the free-mode tree state
     (BST level-order values reconstruct the exact same structure), and
     restoreFreeWorkspace() rebuilds it on exit. Lesson trees are therefore
     confined to the lesson and never pollute the free workspace.

     Depth/Height convention preserved (shared with Phase 1/2/7):
       Empty tree = -1, single node = 0, Root depth = 0, Height = max depth.
  */

  var DEFAULT = [50, 30, 70, 20, 40, 60, 80];
  var ONECHILD = [50, 30, 40];

  var LESSONS = [
    {
      id: "lesson-1-binary-tree",
      number: 1,
      title: "什麼是二元樹？",
      english: "Binary Tree",
      kind: "concept",
      description: "認識二元樹的節點、Left Child 與 Right Child。",
      tree: DEFAULT,
      steps: [
        {
          kind: "concept",
          title: "二元樹是什麼？",
          text: "「二元樹」是一種樹狀資料結構：每個節點最多可以有兩個子節點。\n它由很多「節點（Node）」與「邊（Edge）」組成，像倒過來的樹。",
          highlight: [50],
          rule: "每個節點最多有 2 個子節點：Left Child 與 Right Child。",
        },
        {
          kind: "concept",
          title: "Left Child（左子節點）",
          text: "每個節點最多可以有兩個子節點，位在左邊的叫做「Left Child」。\n以這棵樹為例，50 的左子節點是 30。",
          highlight: [30],
          rule: "Left Child 位在節點的左下方。",
        },
        {
          kind: "concept",
          title: "Right Child（右子節點）",
          text: "位在右邊的子節點叫做「Right Child」。\n以這棵樹為例，50 的右子節點是 70。",
          highlight: [70],
          rule: "Right Child 位在節點的右下方。",
        },
      ],
      completeText: "你已認識二元樹的 Node、Left Child 與 Right Child！",
    },
    {
      id: "lesson-2-root-parent-child",
      number: 2,
      title: "Root、Parent、Child",
      english: "Root · Parent · Child",
      kind: "concept",
      description: "了解 Root、Parent 與 Child 之間的關係。",
      tree: DEFAULT,
      steps: [
        {
          kind: "concept",
          title: "Root（根節點）",
          text: "一棵樹最上方的節點叫「Root」。\n這棵樹的 Root 是 50，它沒有 Parent。",
          highlight: [50],
          rule: "Root = 樹的最頂端，Depth = 0。",
        },
        {
          kind: "concept",
          title: "Children（子節點）",
          text: "直接連在 Root 下方的是它的「Children」。\n50 有兩個 Child：30（Left）與 70（Right）。",
          highlight: [30, 70],
          rule: "50 的 Children = 30、70。",
        },
        {
          kind: "concept",
          title: "Parent 的例子",
          text: "對 30 來說，50 是它的 Parent；對 70 來說，50 也是 Parent。\n「Parent」就是直接連在節點上方的那一層。",
          highlight: [50, 30, 70],
          rule: "Parent = 該節點正上方的直接連接者。",
        },
      ],
      completeText: "你已認識 Root、Parent 與 Child 的關係！",
    },
    {
      id: "lesson-3-leaf",
      number: 3,
      title: "Leaf（葉節點）",
      english: "Leaf",
      kind: "concept",
      description: "認識 Leaf＝沒有任何子節點的節點。",
      tree: DEFAULT,
      steps: [
        {
          kind: "concept",
          title: "什麼是 Leaf？",
          text: "「Leaf（葉節點）」是沒有任何子節點的節點。\n它位在樹的末端，Child Count = 0。",
          highlight: [20, 40, 60, 80],
          rule: "Leaf = 沒有 Left Child 也沒有 Right Child。",
        },
        {
          kind: "concept",
          title: "Leaf Count = 4",
          text: "這棵樹的 Leaf 是 20、40、60、80，共 4 個。\n（下方的 Tree Summary 也會即時顯示 Leaf Count。）",
          highlight: [20, 40, 60, 80],
          rule: "Leaf Count = 4",
        },
      ],
      completeText: "你已能分辨 Leaf（葉節點）！",
    },
    {
      id: "lesson-4-depth-height",
      number: 4,
      title: "Depth 與 Height",
      english: "Depth & Height",
      kind: "concept",
      description: "Depth = 離 Root 幾層；Height = 最大的 Depth。",
      tree: DEFAULT,
      steps: [
        {
          kind: "concept",
          title: "Root 的 Depth = 0",
          text: "Depth 代表節點距離 Root 有幾層。\nRoot 的 Depth = 0，每往下一層 +1。",
          highlight: [50],
          rule: "Root Depth = 0，每往下一層 +1。",
        },
        {
          kind: "concept",
          title: "Depth 1",
          text: "再往下一層的節點，Depth = 1。\n這一層有 30 與 70。",
          highlight: [30, 70],
          rule: "Depth = 1：30、70。",
        },
        {
          kind: "concept",
          title: "Depth 2",
          text: "最底層的節點，Depth = 2。\n這一層有 20、40、60、80。",
          highlight: [20, 40, 60, 80],
          rule: "最大 Depth = 2。",
        },
        {
          kind: "concept",
          title: "Tree Height",
          text: "Tree Height = 所有節點中最大的 Depth。\n這棵樹的最大 Depth 是 2，所以 Height = 2。",
          highlight: [],
          rule: "Empty tree = -1；單一節點 = 0；Height = max(Depth)。",
        },
      ],
      completeText: "你已了解 Depth 與 Height 的定義！",
    },
    {
      id: "lesson-5-bst-rule",
      number: 5,
      title: "什麼是 BST？",
      english: "Binary Search Tree",
      kind: "concept",
      description: "BST 核心規則：左子樹 < 節點 < 右子樹。",
      tree: DEFAULT,
      steps: [
        {
          kind: "concept",
          title: "Binary Search Tree",
          text: "「Binary Search Tree（二元搜尋樹）」是一種特殊的二元樹。\n它的核心規則是：左子樹全部 < 節點 < 右子樹全部。",
          highlight: [50],
          rule: "Left subtree < Node < Right subtree",
        },
        {
          kind: "concept",
          title: "30 < 50",
          text: "Root 是 50，它的左邊是 30。\n因為 30 < 50，所以 30 放在左子樹。",
          highlight: [50, 30],
          rule: "較小的值放左邊。",
        },
        {
          kind: "concept",
          title: "70 > 50",
          text: "Root 的右邊是 70。\n因為 70 > 50，所以 70 放在右子樹。",
          highlight: [50, 70],
          rule: "較大的值放右邊。",
        },
      ],
      completeText: "你已掌握 BST 最核心的排序規則！",
    },
    {
      id: "lesson-6-bst-search",
      number: 6,
      title: "BST Search（搜尋）",
      english: "BST Search",
      kind: "operation",
      description: "用真正的 Search 動畫搜尋 40。",
      tree: DEFAULT,
      steps: [
        {
          kind: "concept",
          title: "我們來搜尋 40",
          text: "現在要用真正的 BST Search 動畫搜尋 40。\n預期路徑：50 → 往左 → 30 → 往右 → 40 → 找到。",
          highlight: [],
          rule: "使用「比較 + 往左 / 往右」縮小範圍。",
        },
        {
          kind: "op",
          title: "搜尋 40",
          op: "search",
          value: 40,
          tree: DEFAULT,
          text: "用真正的 Search 動畫搜尋 40：比較 50（40 < 50 → 往左）、比較 30（40 > 30 → 往右）、比較 40（找到！）。\n請用 ▶ Play 或 Step → 看完動畫。",
          rule: "目標較小往左、較大往右。",
        },
      ],
      completeText: "你已看完 BST Search 動畫！",
    },
    {
      id: "lesson-7-bst-insert",
      number: 7,
      title: "BST Insert（插入）",
      english: "BST Insert",
      kind: "operation",
      description: "用真正的 Insert 動畫插入 45。",
      tree: DEFAULT,
      steps: [
        {
          kind: "concept",
          title: "我們來插入 45",
          text: "現在要用真正的 BST Insert 動畫插入 45。\n預期路徑：45 < 50 → 往左、45 > 30 → 往右、45 > 40 → 往右，插入到 40 的右邊。",
          highlight: [],
          rule: "新值小於節點往左、大於往右，直到第一個空位。",
        },
        {
          kind: "op",
          title: "插入 45",
          op: "insert",
          value: 45,
          tree: DEFAULT,
          text: "用真正的 Insert 動畫插入 45：45 < 50 → 往左、45 > 30 → 往右、45 > 40 → 往右、插入完成。\n插入後 45 會成為 40 的 Right Child。",
          rule: "插入位置：40 的右邊。",
        },
      ],
      completeText: "你已看完 BST Insert 動畫！",
    },
    {
      id: "lesson-8-bst-delete",
      number: 8,
      title: "BST Delete（刪除）",
      english: "BST Delete",
      kind: "operation",
      description: "三種刪除示範：Leaf、只有一子、有兩子。",
      tree: DEFAULT,
      steps: [
        {
          kind: "concept",
          title: "刪除有三種情況",
          text: "刪除節點分成三種情況，我們逐一示範：\n8A 刪除 Leaf、8B 刪除只有一個 Child、8C 刪除有兩個 Child。",
          highlight: [],
          rule: "Leaf 直接刪除；一子由 Child 接替；二子找 Inorder Successor。",
        },
        {
          kind: "op",
          title: "8A 刪除 Leaf：20",
          op: "delete",
          value: 20,
          tree: DEFAULT,
          text: "20 是 Leaf（沒有子節點），因此可以直接刪除。",
          rule: "Leaf 直接刪除即可，不需要調整其他節點。",
        },
        {
          kind: "op",
          title: "8B 刪除只有一個 Child：30",
          op: "delete",
          value: 30,
          tree: ONECHILD,
          text: "30 只有一個 Child（40）。刪除後由 Child（40）直接接替這個位置。",
          rule: "由唯一子節點接替，維持 BST 排序。",
        },
        {
          kind: "op",
          title: "8C 刪除有兩個 Child：50",
          op: "delete",
          value: 50,
          tree: DEFAULT,
          text: "50 有兩個 Children。需要找到它的 Inorder Successor 來維持 BST 排序。",
          rule: "Successor = 右子樹中最小的（最左）節點 = 60。",
        },
      ],
      completeText: "你已完成三種 Delete 示範！",
    },
    {
      id: "lesson-9-traversal",
      number: 9,
      title: "Traversal（四種遍歷）",
      english: "Traversal",
      kind: "operation",
      description: "Preorder / Inorder / Postorder / Level-order 四種遍歷。",
      tree: DEFAULT,
      steps: [
        {
          kind: "op",
          title: "Preorder（前序）",
          op: "traversal",
          traversal: "preorder",
          tree: DEFAULT,
          text: "Preorder：先拜訪 Root，再走左子樹，最後走右子樹。\n訪問順序：50, 30, 20, 40, 70, 60, 80。",
          rule: "Root → Left → Right",
        },
        {
          kind: "op",
          title: "Inorder（中序）",
          op: "traversal",
          traversal: "inorder",
          tree: DEFAULT,
          text: "Inorder：先走左子樹，再拜訪 Root，最後走右子樹。\n訪問順序：20, 30, 40, 50, 60, 70, 80。",
          rule: "Left → Root → Right；對 BST 會得到由小到大。",
        },
        {
          kind: "op",
          title: "Postorder（後序）",
          op: "traversal",
          traversal: "postorder",
          tree: DEFAULT,
          text: "Postorder：先走左子樹，再走右子樹，最後才拜訪 Root。\n訪問順序：20, 40, 30, 60, 80, 70, 50。",
          rule: "Left → Right → Root",
        },
        {
          kind: "op",
          title: "Level-order（層序）",
          op: "traversal",
          traversal: "levelorder",
          tree: DEFAULT,
          text: "Level-order：由上到下、由左到右，使用 Queue。\n訪問順序：50, 30, 70, 20, 40, 60, 80。",
          rule: "使用 Queue 逐層掃描。",
        },
        {
          kind: "concept",
          title: "重點：Inorder = 排序",
          text: "對 BST 做 Inorder Traversal：20, 30, 40, 50, 60, 70, 80。\n看到沒？正好是由小到大！",
          highlight: [],
          rule: "BST 的 Inorder Traversal = 由小到大的排序結果。",
        },
      ],
      completeText: "你已完成四種 Traversal 示範！",
    },
  ];

  /* ─── Tree isolation helpers ─── */
  /* capture: 只讀 tree，取出可完整重建同一結構的 level-order 值序列。
     restore: 透過 workspace 的既有公開 API（buildTree / clearTree）重建，
     不觸碰任何演算法與 renderer。 */

  function captureFreeTree(treeLike) {
    if (!treeLike) return { empty: true, values: [] };
    var values;
    if (typeof treeLike.levelOrder === "function") {
      values = treeLike.levelOrder();
    } else if (typeof treeLike.toArray === "function") {
      values = treeLike.toArray().map(function (n) { return n.value; });
    } else {
      values = [];
    }
    return { empty: values.length === 0, values: values };
  }

  function restoreFreeWorkspace(workspaceLike, snapshot) {
    if (!workspaceLike) return { ok: false, error: "no workspace" };
    if (snapshot && snapshot.values && snapshot.values.length > 0) {
      var r = workspaceLike.buildTree(snapshot.values.slice());
      return { ok: true, restored: !r || r.ok !== false };
    }
    workspaceLike.clearTree();
    return { ok: true, restored: true };
  }

  /* ─── State machine ─── */

  function createLearningMode() {
    var state = {
      active: false,
      currentLesson: -1,
      lessonStep: 0,
      completedLessons: [],
    };

    function lessonAt(i) {
      return LESSONS[i] || null;
    }
    function currentLesson() {
      return lessonAt(state.currentLesson);
    }
    function currentLessonComplete() {
      var l = currentLesson();
      return l !== null && state.lessonStep >= l.steps.length;
    }

    function enterLearningMode() {
      state.active = true;
      state.currentLesson = 0;
      state.lessonStep = 0;
      state.completedLessons = [];
    }

    function exitLearningMode() {
      state.active = false;
      state.currentLesson = -1;
      state.lessonStep = 0;
      state.completedLessons = [];
    }

    function nextLesson() {
      if (!state.active) return { ok: false, error: "not in learning mode" };
      if (state.currentLesson >= LESSONS.length - 1) {
        return { ok: false, error: "already last lesson", boundary: true };
      }
      state.currentLesson++;
      state.lessonStep = 0;
      return { ok: true };
    }

    function previousLesson() {
      if (!state.active) return { ok: false, error: "not in learning mode" };
      if (state.currentLesson <= 0) {
        return { ok: false, error: "already first lesson", boundary: true };
      }
      state.currentLesson--;
      state.lessonStep = 0;
      return { ok: true };
    }

    function nextStep() {
      if (!state.active) return { ok: false, error: "not in learning mode" };
      var l = currentLesson();
      if (!l) return { ok: false, error: "no current lesson" };
      if (state.lessonStep >= l.steps.length) {
        return { ok: false, error: "lesson already complete", complete: true };
      }
      state.lessonStep++;
      if (state.lessonStep >= l.steps.length) {
        markComplete(l);
        return { ok: true, complete: true };
      }
      return { ok: true, complete: false };
    }

    function previousStep() {
      if (!state.active) return { ok: false, error: "not in learning mode" };
      if (state.lessonStep <= 0) return { ok: false, error: "already at first step" };
      state.lessonStep--;
      return { ok: true };
    }

    function resetLesson() {
      if (!state.active) return { ok: false, error: "not in learning mode" };
      var l = currentLesson();
      if (!l) return { ok: false, error: "no current lesson" };
      state.lessonStep = 0;
      return { ok: true };
    }

    function markComplete(l) {
      if (state.completedLessons.indexOf(l.id) === -1) state.completedLessons.push(l.id);
    }

    function completeLesson() {
      if (!state.active) return { ok: false, error: "not in learning mode" };
      var l = currentLesson();
      if (!l) return { ok: false, error: "no current lesson" };
      state.lessonStep = l.steps.length;
      markComplete(l);
      return { ok: true };
    }

    function getCurrentStep() {
      var l = currentLesson();
      if (!l) return null;
      if (state.lessonStep < l.steps.length) {
        return {
          index: state.lessonStep,
          step: l.steps[state.lessonStep],
          total: l.steps.length,
          isLast: state.lessonStep === l.steps.length - 1,
        };
      }
      return { index: state.lessonStep, step: null, total: l.steps.length, isLast: false };
    }

    return {
      enterLearningMode: enterLearningMode,
      exitLearningMode: exitLearningMode,
      isInLearningMode: function () { return state.active; },

      getLessons: function () { return LESSONS.slice(); },
      getLessonCount: function () { return LESSONS.length; },
      getLessonByIndex: lessonAt,
      getCurrentLessonIndex: function () { return state.currentLesson; },
      getCurrentLesson: currentLesson,

      getLessonStep: function () { return state.lessonStep; },
      getLessonStepCount: function () {
        var l = currentLesson();
        return l ? l.steps.length : 0;
      },
      getCurrentStep: getCurrentStep,

      nextLesson: nextLesson,
      previousLesson: previousLesson,
      nextStep: nextStep,
      previousStep: previousStep,
      resetLesson: resetLesson,
      completeLesson: completeLesson,
      isCurrentLessonComplete: currentLessonComplete,

      getCompletedLessons: function () { return state.completedLessons.slice(); },
      isCompleted: function (id) { return state.completedLessons.indexOf(id) !== -1; },
    };
  }

  /* ─── Exports ─── */

  var exportsObj = {
    createLearningMode: createLearningMode,
    captureFreeTree: captureFreeTree,
    restoreFreeWorkspace: restoreFreeWorkspace,
    LESSONS: LESSONS,
    DEFAULT_VALUES: DEFAULT,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.LearningMode = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);