window.UI = (function () {
  var overlay = document.getElementById('modal-overlay');
  var dialog = document.getElementById('modal-dialog');
  var titleEl = document.getElementById('modal-title');
  var bodyEl = document.getElementById('modal-body');
  var actionsEl = document.getElementById('modal-actions');
  var toastEl = document.getElementById('toast');

  var toastTimer = null;
  var lastFocus = null;
  var onHideCb = null;

  function focusableEls() {
    return dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var els = Array.prototype.slice.call(focusableEls());
    if (els.length === 0) return;
    var first = els[0];
    var last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function keyHandler(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
    }
  }

  function show(opts) {
    titleEl.textContent = opts.title || '';
    bodyEl.innerHTML = '';
    if (typeof opts.body === 'string') {
      bodyEl.textContent = opts.body;
    } else if (opts.body) {
      bodyEl.appendChild(opts.body);
    }
    actionsEl.innerHTML = '';
    (opts.buttons || []).forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn ' + (b.className || 'btn-manage');
      btn.textContent = b.text;
      btn.addEventListener('click', function () {
        if (b.onClick) b.onClick();
      });
      actionsEl.appendChild(btn);
    });

    overlay.hidden = false;
    dialog.addEventListener('keydown', trapFocus);
    overlay.addEventListener('keydown', keyHandler);

    lastFocus = document.activeElement;
    var f = focusableEls();
    if (f.length) f[0].focus();

    onHideCb = opts.onHide || null;
  }

  function hide() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    dialog.removeEventListener('keydown', trapFocus);
    overlay.removeEventListener('keydown', keyHandler);
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch (e) { /* ignore */ }
    }
    if (onHideCb) {
      var cb = onHideCb;
      onHideCb = null;
      cb();
    }
  }

  overlay.addEventListener('mousedown', function (e) {
    if (e.target === overlay) hide();
  });

  function confirm(opts) {
    return new Promise(function (resolve) {
      var done = false;
      var finish = function (val) {
        if (done) return;
        done = true;
        resolve(val);
        hide();
      };
      var body = document.createElement('p');
      body.textContent = opts.message || '';
      show({
        title: opts.title || '請確認',
        body: body,
        buttons: [
          { text: opts.cancelText || '取消', className: 'btn-manage', onClick: function () { finish(false); } },
          { text: opts.okText || '確定', className: opts.danger ? 'btn-danger' : 'btn-primary', onClick: function () { finish(true); } }
        ],
        onHide: function () { resolve(false); }
      });
    });
  }

  function promptInput(opts) {
    return new Promise(function (resolve) {
      var done = false;
      var finish = function (val) {
        if (done) return;
        done = true;
        resolve(val);
        hide();
      };
      var box = document.createElement('div');
      var field = document.createElement('div');
      field.className = 'field';
      var label = document.createElement('label');
      label.setAttribute('for', 'modal-input');
      label.textContent = (opts.label || '') + '：';
      var input = document.createElement('input');
      input.id = 'modal-input';
      input.type = opts.type || 'text';
      input.value = opts.value != null ? opts.value : '';
      if (opts.placeholder) input.placeholder = opts.placeholder;
      var err = document.createElement('div');
      err.className = 'modal-error';
      field.appendChild(label);
      field.appendChild(input);
      box.appendChild(field);
      box.appendChild(err);

      function submit() {
        var val = input.value;
        if (opts.validate) {
          var res = opts.validate(val);
          if (res !== true) {
            err.textContent = res || '輸入無效';
            input.focus();
            return;
          }
        }
        finish(val);
      }

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });

      show({
        title: opts.title || '輸入',
        body: box,
        buttons: [
          { text: opts.cancelText || '取消', className: 'btn-manage', onClick: function () { finish(null); } },
          { text: opts.okText || '確定', className: 'btn-primary', onClick: submit }
        ],
        onHide: function () { resolve(null); }
      });

      input.focus();
    });
  }

  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, ms || 2200);
  }

  return {
    show: show,
    hide: hide,
    confirm: confirm,
    promptInput: promptInput,
    toast: toast
  };
})();
