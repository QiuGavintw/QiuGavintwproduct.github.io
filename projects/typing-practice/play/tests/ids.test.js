'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

const htmlIds = new Set();
const re = /id="([^"]+)"/g;
let m;
while ((m = re.exec(html))) htmlIds.add(m[1]);

const jsIds = new Set();
const re2 = /\$\('#([A-Za-z0-9_-]+)'\)/g;
while ((m = re2.exec(js))) jsIds.add(m[1]);

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) { pass += 1; console.log('  PASS', name); }
  else { fail += 1; console.log('  FAIL', name); }
}

console.log('--- IDS: index.html <-> app.js ---');
const missing = [...jsIds].filter(id => !htmlIds.has(id));
ok(missing.length === 0, `all ${jsIds.size} JS-referenced ids exist in HTML` +
  (missing.length ? ` (missing: ${missing.join(', ')})` : ''));

console.log('--- IDS: phase3 screens present ---');
['screen-stats', 'screen-ach'].forEach(id => ok(htmlIds.has(id), `#${id} exists`));
['home-level', 'level-bar', 'streak-text', 'task-list', 'btn-speed-challenge'].forEach(id =>
  ok(htmlIds.has(id), `#${id} exists`));

console.log('--- RESULT ---');
console.log(`Ids: pass = ${pass} fail = ${fail}`);
process.exit(fail > 0 ? 1 : 0);
