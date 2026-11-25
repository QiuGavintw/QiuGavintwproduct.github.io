window.ExportManager = (function () {
  var HEADERS = [
    '序號', '班級',
    '指定曲-音準節奏音色', '指定曲-團體創意', '指定曲得分',
    '自選曲-音準節奏音色', '自選曲-和聲', '自選曲-指揮', '自選曲得分',
    '超時時間', '超時扣分', '總得分', '排名', '最佳指揮獎', '正數時間', '記錄時間'
  ];

  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function num(value) {
    if (value === null || value === undefined || value === '' || !isFinite(value)) return '';
    return String(value);
  }

  function avgOf(breakdown, key) {
    if (!breakdown || !breakdown.averages) return '';
    return num(breakdown.averages[key]);
  }

  function awardOf(breakdown) {
    return breakdown && breakdown.bestConductor === true ? '✓' : '—';
  }

  function buildRows(records) {
    var rows = [HEADERS.slice()];
    (records || []).forEach(function (r, i) {
      var b = r.breakdown || {};
      rows.push([
        i + 1,
        r.teamName || '',
        avgOf(b, 'designatedTone'),
        avgOf(b, 'designatedCreative'),
        num(b.designatedScore),
        avgOf(b, 'selfTone'),
        avgOf(b, 'selfHarmony'),
        avgOf(b, 'selfConductor'),
        num(b.selfScore),
        (r.overtimeMs || 0) > 0 ? formatDuration(r.overtimeMs) : '00:00.00',
        num(b.deduction),
        num(b.total),
        r.rank || '',
        awardOf(b),
        formatDuration(r.forwardMs),
        r.savedAt || ''
      ]);
    });
    return rows;
  }

  function formatDuration(ms) {
    var n = Math.max(0, Math.round(Number(ms) || 0));
    var m = Math.floor(n / 60000);
    var s = Math.floor(n / 1000) % 60;
    var cs = Math.floor(n / 10) % 100;
    function p(v) { return String(v).padStart(2, '0'); }
    return p(m) + ':' + p(s) + '.' + p(cs);
  }

  function csvCell(value) {
    var s = String(value === null || value === undefined ? '' : value);
    if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function buildCSV(records) {
    var body = buildRows(records).map(function (row) {
      return row.map(csvCell).join(',');
    }).join('\r\n');
    return '\uFEFF' + body;
  }

  function tableHtml(records) {
    var rows = buildRows(records);
    var html = '<table><thead><tr>';
    rows[0].forEach(function (h) { html += '<th>' + esc(h) + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.slice(1).forEach(function (row) {
      html += '<tr>';
      row.forEach(function (cell, idx) {
        var cls = (idx === 1 || HEADERS[idx] === '最佳指揮獎') ? '' : ' class="num"';
        html += '<td' + cls + '>' + esc(cell) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function buildXls(records) {
    return '\uFEFF' +
      '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8">' +
      '<title>高一班際合唱比賽 評分紀錄</title>' +
      '<style>table{border-collapse:collapse;width:100%;font-family:"Microsoft JhengHei",sans-serif;font-size:12pt}' +
      'th,td{border:1px solid #999;padding:6px}th{background:#E8A33D;color:#12171B;font-weight:bold}' +
      'td.num{mso-number-format:"General";text-align:right}</style></head><body>' +
      '<h2>高一班際合唱比賽 評分紀錄</h2>' + tableHtml(records) + '</body></html>';
  }

  function buildPrintHtml(records) {
    return '\uFEFF<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>高一班際合唱比賽 評分紀錄</title><style>' +
      'body{font-family:"Microsoft JhengHei",sans-serif;margin:32px;color:#12171B}' +
      'h1{font-family:"Songti TC",serif;font-size:28px;margin:0 0 4px}' +
      '.meta{color:#555;margin-bottom:20px}' +
      '.toolbar{margin-bottom:16px}button{padding:8px 16px;font-size:14px}' +
      'table{border-collapse:collapse;width:100%;font-size:12px}' +
      'th,td{border:1px solid #888;padding:6px;text-align:left}' +
      'th{background:#eee}td.num{text-align:right;font-variant-numeric:tabular-nums}' +
      '@media print{.toolbar{display:none}body{margin:0}table{font-size:10px}}' +
      '</style></head><body><h1>高一班際合唱比賽 評分紀錄</h1>' +
      '<div class="meta">匯出時間：' + esc(new Date().toLocaleString('zh-TW')) + '</div>' +
      '<div class="toolbar"><button type="button" onclick="window.print()">列印 / 另存 PDF</button></div>' +
      tableHtml(records) + '</body></html>';
  }

  function stamp() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportCsv(records) {
    download('合唱比賽紀錄_' + stamp() + '.csv', buildCSV(records), 'text/csv;charset=utf-8');
  }

  function exportXls(records) {
    download('合唱比賽紀錄_' + stamp() + '.xls', buildXls(records), 'application/vnd.ms-excel;charset=utf-8');
  }

  function exportPrint(records) {
    var win = window.open('', '_blank');
    if (!win) return false;
    win.document.open();
    win.document.write(buildPrintHtml(records));
    win.document.close();
    return true;
  }

  return {
    HEADERS: HEADERS,
    buildRows: buildRows,
    buildCSV: buildCSV,
    buildXls: buildXls,
    buildPrintHtml: buildPrintHtml,
    exportCsv: exportCsv,
    exportXls: exportXls,
    exportPrint: exportPrint
  };
})();
