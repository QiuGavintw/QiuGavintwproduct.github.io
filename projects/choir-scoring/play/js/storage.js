window.AppStorage = (function () {
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      var value = JSON.parse(raw);
      return value === undefined ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // ignore (private mode / quota)
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  }

  return { load: load, save: save, remove: remove };
})();
