/* ============================================================
   Qiu Gavin 作品集 — 實驗索引 Experimental Index
   讀取 js/projects.js 的 window.PROJECTS，渲染索引與篩選。
   hidden: true 的專案不顯示（例如開發中的台灣麻將）。
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fmtDate(iso) { return iso ? iso.slice(0, 7).replace("-", ".") : ""; }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function visibleProjects() {
    var list = (window.PROJECTS || []).slice().filter(function (p) { return !p.hidden; });
    list.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    list.forEach(function (p, i) { p._index = "E·" + pad2(i + 1); });
    return list;
  }

  function isDev(p) { return p.status === "in-development"; }

  function primaryHref(p) {
    if (isDev(p)) return null;
    return p.demoUrl || p.detailPage || p.githubUrl || null;
  }
  function secondary(p) {
    if (p.external) return p.githubUrl ? { href: p.githubUrl, label: "程式碼", ext: true } : null;
    if (p.demoUrl && p.detailPage) return { href: p.detailPage, label: "詳情", ext: false };
    if (p.githubUrl && p.githubUrl !== primaryHref(p)) return { href: p.githubUrl, label: "程式碼", ext: true };
    return null;
  }

  function plateHTML(p, i) {
    var dev = isDev(p);
    var primary = primaryHref(p);
    var sec = secondary(p);
    var external = p.external === true;

    var openHTML;
    if (dev) {
      openHTML = '<span class="link-disabled mono">開發中</span>';
    } else if (primary) {
      openHTML = '<a class="link-open" href="' + esc(primary) + '"' +
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>打開 <span aria-hidden="true">↗</span></a>';
    } else { openHTML = ""; }

    var secHTML = sec
      ? '<a class="link-sec" href="' + esc(sec.href) + '"' +
        ((sec.ext || /^https?:/.test(sec.href)) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        esc(sec.label) + '</a>'
      : "";

    var tabHref = dev ? (p.detailPage || "#") : (primary || p.detailPage || "#");
    var tabTarget = (!dev && external) ? ' target="_blank" rel="noopener noreferrer"' : '';
    var badge = dev ? '<span class="badge-dev">開發中</span>' : '';

    var cats = p.categories || [];
    var tech = (p.technologies || []).slice(0, 2).join(" / ");
    var headCat = cats[0] || "";
    var accent = p.accent || "#8b897f";
    var thumb = p.thumbnail
      ? '<img loading="lazy" decoding="async" src="' + esc(p.thumbnail) + '" alt="' + esc(p.title) + ' 預覽畫面">'
      : '<span class="plate-noimg mono">無預覽</span>';

    return '' +
      '<article class="plate" data-cats="' + esc(cats.join(" ")) + '" style="--c:' + esc(accent) + ';--d:' + (i * 55) + 'ms">' +
        '<a class="plate-media" href="' + esc(tabHref) + '"' + tabTarget + ' tabindex="-1" aria-hidden="true">' +
          thumb +
          '<span class="plate-tab">' + esc(p._index) + '</span>' +
          badge +
        '</a>' +
        '<div class="plate-body">' +
          '<h3 class="plate-title"><a href="' + esc(tabHref) + '"' + tabTarget + '>' + esc(p.title) + '</a></h3>' +
          '<p class="plate-desc">' + esc(p.shortDescription) + '</p>' +
          '<div class="plate-meta">' +
            '<span class="dot"></span>' +
            '<span>' + esc(headCat) + '</span>' +
            '<span class="sep">·</span><span>' + esc(tech) + '</span>' +
            '<span class="meta-date"><span class="sep">·</span> ' + esc(fmtDate(p.createdAt)) + '</span>' +
          '</div>' +
          '<div class="plate-actions">' + openHTML + secHTML + '</div>' +
        '</div>' +
      '</article>';
  }

  var grid = document.querySelector("[data-plates]");
  var filtersEl = document.querySelector("[data-filters]");
  var emptyEl = document.querySelector("[data-empty]");
  var countEl = document.querySelector("[data-index-count]");
  if (!grid) return;

  var PROJECTS = visibleProjects();

  /* ---------- Hero / header counts ---------- */
  var catSet = [];
  PROJECTS.forEach(function (p) {
    (p.categories || []).forEach(function (c) { if (catSet.indexOf(c) === -1) catSet.push(c); });
  });
  function setText(sel, txt) { var el = document.querySelector(sel); if (el) el.textContent = txt; }
  setText("[data-total]", String(PROJECTS.length));
  setText("[data-cat-count]", String(catSet.length));
  if (countEl) countEl.textContent = "共 " + PROJECTS.length + " 件";

  // 精選標本框（cephalopod）的索引號
  var featured = PROJECTS.filter(function (p) { return p.id === "cephalopod"; })[0];
  if (featured) {
    var tabEl = document.querySelector("[data-specimen-tab]");
    if (tabEl) tabEl.textContent = featured._index + " · 精選";
  }

  /* ---------- Grid ---------- */
  grid.innerHTML = PROJECTS.map(plateHTML).join("");

  /* ---------- Filters ---------- */
  var preferred = ["遊戲", "教育", "工具", "視覺化", "資料分析", "Web"];
  catSet.sort(function (a, b) {
    var ia = preferred.indexOf(a), ib = preferred.indexOf(b);
    if (ia === -1) ia = 99; if (ib === -1) ib = 99;
    return ia - ib;
  });

  function countOf(cat) {
    return PROJECTS.filter(function (p) { return cat === "全部" || (p.categories || []).indexOf(cat) !== -1; }).length;
  }
  var allCats = ["全部"].concat(catSet);
  filtersEl.innerHTML = allCats.map(function (c, i) {
    return '<li><button class="filter-btn' + (i === 0 ? " is-active" : "") + '" type="button" data-filter="' + esc(c) + '">' +
      '<span class="name">' + esc(c) + '</span><span class="count">' + pad2(countOf(c)) + '</span></button></li>';
  }).join("");

  function applyFilter(cat) {
    var shown = 0;
    Array.prototype.forEach.call(grid.querySelectorAll(".plate"), function (el) {
      var catsAttr = " " + (el.getAttribute("data-cats") || "") + " ";
      var ok = cat === "全部" || catsAttr.indexOf(" " + cat + " ") !== -1;
      el.style.display = ok ? "" : "none";
      if (ok) shown++;
    });
    if (countEl) countEl.textContent = cat === "全部" ? ("共 " + shown + " 件") : (cat + " · " + shown + " 件");
    if (emptyEl) emptyEl.classList.toggle("show", shown === 0);
    reveal();
  }

  filtersEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-filter]");
    if (!btn) return;
    Array.prototype.forEach.call(filtersEl.querySelectorAll(".filter-btn"), function (b) {
      b.classList.toggle("is-active", b === btn);
    });
    applyFilter(btn.getAttribute("data-filter"));
  });

  /* ---------- Reveal（載入後一次性錯位進場，避免漏觸發而空白） ---------- */
  function reveal() {
    var items = Array.prototype.filter.call(grid.querySelectorAll(".plate"), function (el) {
      return el.style.display !== "none";
    });
    if (reduceMotion) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    requestAnimationFrame(function () {
      items.forEach(function (el) { el.classList.add("is-in"); });
    });
  }

  /* ---------- Theme ---------- */
  var tBtn = document.querySelector("[data-theme-btn]");
  var tLabel = document.querySelector("[data-theme-label]");
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    if (tLabel) tLabel.textContent = t === "dark" ? "日間" : "夜讀";
    try { localStorage.setItem("qg-theme", t); } catch (e) {}
  }
  function currentTheme() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  if (tLabel) tLabel.textContent = currentTheme() === "dark" ? "日間" : "夜讀";
  if (tBtn) tBtn.addEventListener("click", function () { setTheme(currentTheme() === "dark" ? "light" : "dark"); });

  /* ---------- Init ---------- */
  applyFilter("全部");
})();
