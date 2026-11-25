// Node.js 測試執行器：node tests/run.js
const path = require('path');

global.window = global;
global.localStorage = (function () {
  const s = {};
  return {
    getItem: (k) => (k in s ? s[k] : null),
    setItem: (k, v) => { s[k] = String(v); },
    removeItem: (k) => { delete s[k]; }
  };
})();

const base = path.join(__dirname, '..');
require(path.join(base, 'js/storage.js'));
require(path.join(base, 'js/timer.js'));
require(path.join(base, 'js/teams.js'));
require(path.join(base, 'js/scoring.js'));
require(path.join(base, 'js/history.js'));
require(path.join(base, 'js/export.js'));
require(path.join(base, 'tests/tests.js'));

const res = global.runTests();
res.results.forEach((r) => {
  console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.name + (r.error ? '  -> ' + r.error : ''));
});
console.log('Tests: ' + res.passed + ' PASS / ' + res.failed + ' FAIL');
process.exit(res.failed > 0 ? 1 : 0);
