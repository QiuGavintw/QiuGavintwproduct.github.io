window.TimerEngine = (function () {
  var READY = 'READY';
  var RUNNING = 'RUNNING';
  var PAUSED = 'PAUSED';

  var state = READY;
  var durationMs = 0;
  var reminderMs = 0;
  var forwardAccum = 0;      // 已累積的正數毫秒（暫停時結算）
  var countdownAccum = 0;    // 已累積的剩餘毫秒（暫停時結算）
  var lastTick = 0;          // 本次 RUNNING 的起始時間戳
  var reminderTriggered = false;

  var onReminderTrigger = null;

  var clock = function () { return performance.now(); };

  function currentForwardMs() {
    if (state === RUNNING) {
      return forwardAccum + (clock() - lastTick);
    }
    return forwardAccum;
  }

  function currentCountdownMs() {
    if (state === RUNNING) {
      return countdownAccum - (clock() - lastTick);
    }
    return countdownAccum;
  }

  function start() {
    if (state === RUNNING) return;
    lastTick = clock();
    state = RUNNING;
  }

  // 每個 animation frame 呼叫一次；僅在 RUNNING 時處理提醒觸發
  function tick() {
    if (state !== RUNNING) return;
    var remaining = countdownAccum - (clock() - lastTick);
    if (!reminderTriggered && reminderMs > 0 && remaining <= reminderMs) {
      reminderTriggered = true;
      if (onReminderTrigger) onReminderTrigger(reminderMs);
    }
  }

  function pause() {
    if (state !== RUNNING) return;
    var now = clock();
    forwardAccum += now - lastTick;
    countdownAccum -= now - lastTick;
    state = PAUSED;
  }

  function reset() {
    state = READY;
    forwardAccum = 0;
    countdownAccum = durationMs;
    reminderTriggered = false;
  }

  function setDuration(ms) {
    durationMs = ms;
    reset();
  }

  function setReminder(ms) {
    reminderMs = ms;
    reminderTriggered = false;
  }

  function snapshot() {
    return {
      state: state,
      forwardMs: currentForwardMs(),
      countdownMs: currentCountdownMs(),
      durationMs: durationMs,
      reminderMs: reminderMs,
      reminderTriggered: reminderTriggered
    };
  }

  return {
    start: start,
    pause: pause,
    reset: reset,
    tick: tick,
    setDuration: setDuration,
    setReminder: setReminder,
    setOnReminderTrigger: function (fn) { onReminderTrigger = fn; },
    snapshot: snapshot,
    getState: function () { return state; },
    currentForwardMs: currentForwardMs,
    currentCountdownMs: currentCountdownMs,
    _setClock: function (fn) { clock = fn || function () { return performance.now(); }; },
    STATES: { READY: READY, RUNNING: RUNNING, PAUSED: PAUSED }
  };
})();
