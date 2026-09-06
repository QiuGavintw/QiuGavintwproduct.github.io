(function (global) {
  "use strict";

  /* ─── Step Animation Controller ─── */
  /* Drives playback of a list of steps. It does NOT mutate the tree model;
     it only tracks which step index is active and calls a callback to apply
     visual state. The actual tree mutation is committed separately by the
     caller when the operation completes. */

  var SPEEDS = {
    0.5: 900,
    1: 600,
    1.5: 400,
    2: 250,
  };

  function createAnimationController(options) {
    var opts = options || {};
    var callback = opts.onStep || null;

    var state = {
      steps: [],
      cursor: -1, // index of current step; -1 means before first
      playing: false,
      complete: false,
      speed: 1,
      timer: null,
      destroyed: false,
    };

    function currentSpeedDelay() {
      return SPEEDS[state.speed] !== undefined ? SPEEDS[state.speed] : 600;
    }

    function clearTimer() {
      if (state.timer !== null) {
        clearTimeout(state.timer);
        state.timer = null;
      }
    }

    function fire() {
      if (callback && !state.destroyed) callback(state.cursor, state.steps);
    }

    function applyStep(index) {
      state.cursor = index;
      if (index >= state.steps.length - 1) {
        state.cursor = state.steps.length - 1;
        state.complete = true;
        state.playing = false;
        clearTimer();
        fire();
        return;
      }
      state.complete = false;
      fire();
    }

    function setSteps(steps) {
      clearTimer();
      state.steps = steps || [];
      state.cursor = -1;
      state.playing = false;
      state.complete = false;
      fire();
    }

    function play() {
      if (state.destroyed) return;
      if (state.steps.length === 0) return;
      if (state.complete) {
        /* finished already: restart from beginning to replay */
        restart();
      }
      if (state.playing) return;
      state.playing = true;
      /* Advance on the first tick (after one speed delay), not synchronously,
         so that pause() immediately after play() preserves the cursor. */
      state.timer = setTimeout(tick, currentSpeedDelay());
    }

    function tick() {
      state.timer = null;
      if (state.destroyed) return;
      if (!state.playing) return;
      if (state.cursor < state.steps.length - 1) {
        applyStep(state.cursor + 1);
        if (state.complete) return;
        state.timer = setTimeout(tick, currentSpeedDelay());
      } else {
        state.playing = false;
        state.complete = true;
        clearTimer();
      }
    }

    function pause() {
      if (state.destroyed) return;
      state.playing = false;
      clearTimer();
    }

    function stepForward() {
      if (state.destroyed) return;
      if (state.steps.length === 0) return;
      pause();
      if (state.cursor >= state.steps.length - 1) {
        state.complete = true;
        return;
      }
      applyStep(state.cursor + 1);
    }

    function stepBackward() {
      if (state.destroyed) return;
      if (state.steps.length === 0) return;
      pause();
      if (state.cursor <= -1) return;
      applyStep(state.cursor - 1);
      state.complete = false;
    }

    function restart() {
      if (state.destroyed) return;
      pause();
      state.cursor = -1;
      state.complete = false;
      fire();
    }

    function reset() {
      if (state.destroyed) return;
      pause();
      state.steps = [];
      state.cursor = -1;
      state.complete = false;
      fire();
    }

    function setSpeed(speed) {
      var s = Number(speed);
      if (!isFinite(s) || s <= 0) return;
      state.speed = s;
      /* Don't reset playback; just change the timing for subsequent ticks */
    }

    function getCurrentStep() {
      return state.cursor;
    }

    function getCurrentStepData() {
      if (state.cursor < 0 || state.cursor >= state.steps.length) return null;
      return state.steps[state.cursor];
    }

    function isPlaying() {
      return state.playing;
    }

    function isComplete() {
      return state.complete;
    }

    function destroy() {
      state.destroyed = true;
      clearTimer();
    }

    return {
      setSteps: setSteps,
      play: play,
      pause: pause,
      stepForward: stepForward,
      stepBackward: stepBackward,
      restart: restart,
      reset: reset,
      setSpeed: setSpeed,
      getCurrentStep: getCurrentStep,
      getCurrentStepData: getCurrentStepData,
      isPlaying: isPlaying,
      isComplete: isComplete,
      destroy: destroy,
    };
  }

  var exportsObj = {
    createAnimationController: createAnimationController,
    SPEEDS: SPEEDS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }

  if (typeof global !== "undefined") {
    global.AnimationController = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
