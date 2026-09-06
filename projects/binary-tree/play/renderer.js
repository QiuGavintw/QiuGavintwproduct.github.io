(function (global) {
  "use strict";

  /* ─── Tree Canvas Renderer ─── */
  /* Receives a Layout Result and renders it to a Canvas.
     Responsibilities: draw nodes, draw edges, handle view transform,
     hit testing, hover/select states, pan/zoom, responsive, DPR. */

  /* ─── Node State Colors ─── */

  var STATE_COLORS = {
    normal: { fill: "#2563eb", stroke: "#0f172a", text: "#ffffff" },
    root: { fill: "#4f46e5", stroke: "#0f172a", text: "#ffffff" },
    leaf: { fill: "#16a34a", stroke: "#0f172a", text: "#ffffff" },
    hover: { fill: "#7c3aed", stroke: "#0f172a", text: "#ffffff" },
    selected: { fill: "#e11d48", stroke: "#0f172a", text: "#ffffff" },
    active: { fill: "#d97706", stroke: "#0f172a", text: "#ffffff" },
    visited: { fill: "#64748b", stroke: "#0f172a", text: "#ffffff" },
    current: { fill: "#e11d48", stroke: "#0f172a", text: "#ffffff" },
    compare: { fill: "#2563eb", stroke: "#0f172a", text: "#ffffff" },
    found: { fill: "#16a34a", stroke: "#0f172a", text: "#ffffff" },
    notfound: { fill: "#e11d48", stroke: "#0f172a", text: "#ffffff" },
  };

  var DEFAULTS = {
    minScale: 0.15,
    maxScale: 4,
    zoomFactor: 1.1,
    padding: 50,
    edgeColor: "#94a3b8",
    edgeWidth: 2,
    emptyMessage: "目前沒有節點",
    emptyMessageColor: "#94a3b8",
  };

  /* ─── Helpers ─── */

  function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
  }

  function isFiniteNum(v) {
    return typeof v === "number" && isFinite(v);
  }

  function dist(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ─── createTreeRenderer ─── */

  function createTreeRenderer(canvas, options) {
    var opts = {};
    for (var k in DEFAULTS) {
      opts[k] =
        options && options[k] !== undefined ? options[k] : DEFAULTS[k];
    }
    opts.onSelect =
      options && typeof options.onSelect === "function" ? options.onSelect : null;

    var ctx = canvas.getContext("2d");

    var state = {
      layout: null,
      view: { scale: 1, offsetX: 0, offsetY: 0 },
      nodeStates: {},
      hoveredValue: null,
      selectedValue: null,
      dpr: 1,
      canvasWidth: 0,
      canvasHeight: 0,
      panning: false,
      panStart: { x: 0, y: 0 },
      panStartOffset: { x: 0, y: 0 },
      destroyed: false,
      _onPointerDown: null,
      _onPointerMove: null,
      _onPointerUp: null,
      _onWheel: null,
    };

    /* ─── DPR ─── */

    function getDpr() {
      if (typeof window !== "undefined" && window.devicePixelRatio) {
        return window.devicePixelRatio;
      }
      return 1;
    }

    /* ─── Resize ─── */

    function resize() {
      if (state.destroyed) return;
      var dpr = getDpr();
      state.dpr = dpr;
      var cssW = canvas.clientWidth || canvas.width;
      var cssH = canvas.clientHeight || canvas.height;
      state.canvasWidth = cssW;
      state.canvasHeight = cssH;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    }

    /* ─── Coordinate Transforms ─── */

    function worldToScreen(wx, wy) {
      return {
        x: wx * state.view.scale + state.view.offsetX,
        y: wy * state.view.scale + state.view.offsetY,
      };
    }

    function screenToWorld(sx, sy) {
      return {
        x: (sx - state.view.offsetX) / state.view.scale,
        y: (sy - state.view.offsetY) / state.view.scale,
      };
    }

    /* ─── Drawing ─── */

    function clearCanvas() {
      ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
    }

    function drawEmptyMessage() {
      ctx.fillStyle = opts.emptyMessageColor;
      ctx.font = "16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        opts.emptyMessage,
        state.canvasWidth / 2,
        state.canvasHeight / 2
      );
    }

    function drawEdges() {
      if (!state.layout || state.layout.edges.length === 0) return;
      ctx.strokeStyle = opts.edgeColor;
      ctx.lineWidth = opts.edgeWidth;
      for (var i = 0; i < state.layout.edges.length; i++) {
        var e = state.layout.edges[i];
        var from = worldToScreen(e.fromX, e.fromY);
        var to = worldToScreen(e.toX, e.toY);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    function getNodeColor(nodeValue, nodeType) {
      if (state.selectedValue === nodeValue) return STATE_COLORS.selected;
      if (state.hoveredValue === nodeValue) return STATE_COLORS.hover;
      if (state.nodeStates[nodeValue]) {
        var s = state.nodeStates[nodeValue];
        if (STATE_COLORS[s]) return STATE_COLORS[s];
      }
      if (nodeType === "root") return STATE_COLORS.root;
      if (nodeType === "leaf") return STATE_COLORS.leaf;
      return STATE_COLORS.normal;
    }

    function drawNodes() {
      if (!state.layout || state.layout.nodes.length === 0) return;
      var R = (state.layout.options && state.layout.options.nodeRadius) || 24;
      var fontSize = Math.max(12, Math.min(R * 0.65, 20));

      for (var i = 0; i < state.layout.nodes.length; i++) {
        var n = state.layout.nodes[i];
        var sp = worldToScreen(n.x, n.y);
        var color = getNodeColor(n.value, n.type);

        /* Node circle */
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, R, 0, Math.PI * 2);
        ctx.fillStyle = color.fill;
        ctx.fill();
        ctx.strokeStyle = color.stroke;
        ctx.lineWidth = state.selectedValue === n.value ? 3 : 2;
        ctx.stroke();

        /* Hover ring */
        if (state.hoveredValue === n.value) {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, R + 4, 0, Math.PI * 2);
          ctx.strokeStyle = color.fill;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        /* Node label */
        ctx.fillStyle = color.text;
        ctx.font = "bold " + fontSize + "px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(n.value), sp.x, sp.y);
      }
    }

    /* ─── Render ─── */

    function render() {
      clearCanvas();
      if (!state.layout || state.layout.nodeCount === 0) {
        drawEmptyMessage();
        return;
      }
      drawEdges();
      drawNodes();
    }

    /* ─── View Controls ─── */

    function resetView() {
      state.view.scale = 1;
      state.view.offsetX = 0;
      state.view.offsetY = 0;
      render();
    }

    function fitToView() {
      if (!state.layout || state.layout.nodeCount === 0) {
        resetView();
        return;
      }
      var R = (state.layout.options && state.layout.options.nodeRadius) || 24;
      var pad = opts.padding;
      var treeW = state.layout.width + R * 2 + pad * 2;
      var treeH = state.layout.height + R * 2 + pad * 2;
      var cw = state.canvasWidth;
      var ch = state.canvasHeight;

      if (treeW <= 0 || treeH <= 0 || cw <= 0 || ch <= 0) {
        resetView();
        return;
      }

      var scaleX = cw / treeW;
      var scaleY = ch / treeH;
      var scale = Math.min(scaleX, scaleY);
      scale = clamp(scale, opts.minScale, opts.maxScale);

      /* Center the tree */
      var treeCenterX = state.layout.width / 2;
      var treeCenterY = state.layout.height / 2;
      var offsetX = cw / 2 - treeCenterX * scale;
      var offsetY = ch / 2 - treeCenterY * scale;

      state.view.scale = scale;
      state.view.offsetX = offsetX;
      state.view.offsetY = offsetY;
      render();
    }

    function zoom(factor, centerX, centerY) {
      if (centerX === undefined) centerX = state.canvasWidth / 2;
      if (centerY === undefined) centerY = state.canvasHeight / 2;
      var newScale = clamp(
        state.view.scale * factor,
        opts.minScale,
        opts.maxScale
      );
      var ratio = newScale / state.view.scale;
      state.view.offsetX = centerX - (centerX - state.view.offsetX) * ratio;
      state.view.offsetY = centerY - (centerY - state.view.offsetY) * ratio;
      state.view.scale = newScale;
      render();
    }

    function pan(dx, dy) {
      state.view.offsetX += dx;
      state.view.offsetY += dy;
      render();
    }

    /* ─── Hit Test ─── */

    function hitTest(screenX, screenY) {
      if (!state.layout || state.layout.nodes.length === 0) return null;
      var R = (state.layout.options && state.layout.options.nodeRadius) || 24;
      var world = screenToWorld(screenX, screenY);
      var closest = null;
      var closestDist = Infinity;

      for (var i = 0; i < state.layout.nodes.length; i++) {
        var n = state.layout.nodes[i];
        var d = dist(world.x, world.y, n.x, n.y);
        if (d <= R && d < closestDist) {
          closest = n;
          closestDist = d;
        }
      }
      return closest;
    }

    /* ─── Node States ─── */

    function setNodeState(value, nodeState) {
      state.nodeStates[value] = nodeState;
      render();
    }

    function clearNodeStates() {
      state.nodeStates = {};
      render();
    }

    function selectNode(value) {
      state.selectedValue = value;
      render();
    }

    function clearSelection() {
      state.selectedValue = null;
      render();
    }

    /* ─── Interaction Handlers ─── */

    function getCanvasPos(e) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    function onPointerDown(e) {
      if (state.destroyed) return;
      state.panning = true;
      var pos = getCanvasPos(e);
      state.panStart.x = pos.x;
      state.panStart.y = pos.y;
      state.panStartOffset.x = state.view.offsetX;
      state.panStartOffset.y = state.view.offsetY;
      canvas.style.cursor = "grabbing";
    }

    function onPointerMove(e) {
      if (state.destroyed) return;
      var pos = getCanvasPos(e);

      if (state.panning) {
        var dx = pos.x - state.panStart.x;
        var dy = pos.y - state.panStart.y;
        state.view.offsetX = state.panStartOffset.x + dx;
        state.view.offsetY = state.panStartOffset.y + dy;
        render();
      } else {
        var hit = hitTest(pos.x, pos.y);
        var newHovered = hit ? hit.value : null;
        if (newHovered !== state.hoveredValue) {
          state.hoveredValue = newHovered;
          canvas.style.cursor = newHovered ? "pointer" : "default";
          render();
        }
      }
    }

    function onPointerUp(e) {
      if (state.destroyed) return;
      if (state.panning) {
        state.panning = false;
        canvas.style.cursor = "default";
        var pos = getCanvasPos(e);
        var dx = Math.abs(pos.x - state.panStart.x);
        var dy = Math.abs(pos.y - state.panStart.y);
        if (dx < 3 && dy < 3) {
          var hit = hitTest(pos.x, pos.y);
          if (hit) {
            if (state.selectedValue === hit.value) {
              clearSelection();
            } else {
              selectNode(hit.value);
            }
          } else {
            clearSelection();
          }
          if (typeof opts.onSelect === "function") opts.onSelect(state.selectedValue);
        }
      }
    }

    function onWheel(e) {
      if (state.destroyed) return;
      e.preventDefault();
      var pos = getCanvasPos(e);
      var factor = e.deltaY < 0 ? opts.zoomFactor : 1 / opts.zoomFactor;
      zoom(factor, pos.x, pos.y);
    }

    /* ─── Attach Events ─── */

    state._onPointerDown = onPointerDown;
    state._onPointerMove = onPointerMove;
    state._onPointerUp = onPointerUp;
    state._onWheel = onWheel;

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", function () {
      if (state.destroyed) return;
      if (!state.panning) {
        state.hoveredValue = null;
        canvas.style.cursor = "default";
        render();
      }
    });
    canvas.addEventListener("wheel", onWheel, { passive: false });

    /* ─── Destroy ─── */

    function destroy() {
      state.destroyed = true;
      canvas.removeEventListener("pointerdown", state._onPointerDown);
      canvas.removeEventListener("pointermove", state._onPointerMove);
      canvas.removeEventListener("pointerup", state._onPointerUp);
      canvas.removeEventListener("wheel", state._onWheel);
      canvas.style.cursor = "default";
    }

    /* ─── Init ─── */

    resize();

    /* ─── Public API ─── */

    return {
      setLayout: function (layout) {
        state.layout = layout;
        state.nodeStates = {};
        state.hoveredValue = null;
        state.selectedValue = null;
        render();
      },
      render: render,
      resize: resize,
      resetView: resetView,
      fitToView: fitToView,
      zoom: zoom,
      pan: pan,
      hitTest: hitTest,
      selectNode: selectNode,
      clearSelection: clearSelection,
      setNodeState: setNodeState,
      clearNodeStates: clearNodeStates,
      destroy: destroy,
      getView: function () {
        return {
          scale: state.view.scale,
          offsetX: state.view.offsetX,
          offsetY: state.view.offsetY,
        };
      },
      getDpr: function () {
        return state.dpr;
      },
      getState: function () {
        return {
          hoveredValue: state.hoveredValue,
          selectedValue: state.selectedValue,
          nodeStates: state.nodeStates,
        };
      },
    };
  }

  /* ─── Exports ─── */

  var exportsObj = {
    createTreeRenderer: createTreeRenderer,
    STATE_COLORS: STATE_COLORS,
    DEFAULTS: DEFAULTS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.TreeRenderer = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
