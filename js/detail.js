/* ============================================================
   Qiu Gavin 作品集 — 作品介紹頁
   與首頁共用 css/index.css 的實驗索引設計系統。
   每個 projects/<slug>/index.html 只需：
   1. 載入 js/projects.js
   2. 宣告 <div data-detail="slug"></div>
   3. 載入 js/detail.js
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function fmtDate(iso) { return iso ? iso.slice(0, 7).replace("-", ".") : ""; }
  function isExt(url) { return /^(https?:)?\/\//.test(url || ""); }
  function rel(path) {
    if (!path) return "";
    return isExt(path) ? path : "../../" + path.replace(/^\//, "");
  }
  function toRgb(hex) {
    var h = String(hex || "").replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(h)) return "var(--ink-faint)";
    return "rgb(" + parseInt(h.slice(0, 2), 16) + "," + parseInt(h.slice(2, 4), 16) + "," + parseInt(h.slice(4, 6), 16) + ")";
  }

  function visibleProjects() {
    var list = (window.PROJECTS || []).slice().filter(function (p) { return !p.hidden; });
    list.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    list.forEach(function (p, i) { p._index = "E·" + pad2(i + 1); });
    return list;
  }

  function findProject(slug) {
    var list = window.PROJECTS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].slug === slug || list[i].id === slug) return list[i];
    }
    return null;
  }

  function projectIndex(p, visible) {
    for (var i = 0; i < visible.length; i++) {
      if (visible[i].slug === p.slug || visible[i].id === p.id) return visible[i]._index;
    }
    return "E·--";
  }

  function primaryHref(p) {
    if (p.status === "in-development") return null;
    return p.demoUrl || p.githubUrl || null;
  }

  function renderActions(p) {
    var primary = primaryHref(p);
    var html = "";

    if (p.status === "in-development") {
      html += '<span class="link-disabled mono">開發中</span>';
    } else if (primary) {
      var label = p.demoUrl ? "立即體驗" : "查看原始碼";
      html += '<a class="link-open" href="' + esc(rel(primary)) + '"' +
        (isExt(rel(primary)) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        label + ' <span aria-hidden="true">↗</span></a>';
    }

    if (p.githubUrl && rel(p.githubUrl) !== rel(primary)) {
      html += '<a class="link-sec" href="' + esc(p.githubUrl) + '" target="_blank" rel="noopener noreferrer">程式碼 ↗</a>';
    }
    html += '<a class="link-sec" href="../../index.html">返回索引</a>';
    return html;
  }

  function sectionsOf(p) {
    var s = [{ id: "intro", label: "作品簡介" }];
    if (p.features && p.features.length) s.push({ id: "features", label: "功能介紹" });
    if ((p.howToPlay && p.howToPlay.length) || (p.highlights && p.highlights.length)) {
      s.push({ id: "guide", label: "操作與亮點" });
    }
    s.push({ id: "tech", label: "使用技術" });
    return s;
  }

  function sectionContent(id, p) {
    if (id === "intro") {
      return '<p class="plate-desc">' + esc(p.description) + '</p>';
    }
    if (id === "features") {
      return '<div class="feature-grid">' + (p.features || []).map(function (f, i) {
        return '<div class="feature-card"><span class="mono">F·' + pad2(i + 1) + '</span><p>' + esc(f) + '</p></div>';
      }).join("") + '</div>';
    }
    if (id === "guide") {
      var steps = (p.howToPlay && p.howToPlay.length)
        ? '<ol class="steps-list">' + p.howToPlay.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("") + '</ol>'
        : '<p class="rail-note">此作品為後端服務專案，沒有需要操作的畫面。</p>';
      var highlights = (p.highlights && p.highlights.length)
        ? '<ul class="highlight-list">' + p.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join("") + '</ul>'
        : '<p class="rail-note">尚無補充亮點。</p>';
      return '<div class="detail-cols">' +
        '<div><h4 class="sub-title mono">操作說明</h4>' + steps + '</div>' +
        '<div><h4 class="sub-title mono">作品亮點</h4>' + highlights + '</div>' +
        '</div>';
    }
    var note = "";
    if (p.status === "in-development") {
      note = '<p class="detail-note">此作品目前開發中，暫未開放體驗。可前往 GitHub 查看開發進度與原始碼。</p>';
    } else if (!p.demoUrl) {
      note = '<p class="detail-note">此作品為後端服務專案，需 Node.js 環境執行，無法在 GitHub Pages 中直接體驗；原始碼位於獨立 Repository。</p>';
    } else if (p.external) {
      note = '<p class="detail-note">此作品為獨立專案，展示頁面與原始碼皆位於外部 Repository。</p>';
    } else {
      note = '<p class="detail-note">作品採用純前端技術，可直接在 GitHub Pages 靜態環境中運作。</p>';
    }
    return '<div class="tech-list">' + (p.technologies || []).map(function (t) {
      return '<span class="tech-item">' + esc(t) + '</span>';
    }).join("") + '</div>' + note;
  }

  function renderHero(p, idx) {
    var cats = p.categories || [];
    var tech = (p.technologies || []).slice(0, 2).join(" / ");
    var demoHref = p.demoUrl ? rel(p.demoUrl) : "";
    var plateHref = p.status === "in-development" ? rel(p.githubUrl) : (demoHref || rel(p.githubUrl));
    var specimenLink = p.status === "in-development"
      ? '<span class="link-disabled mono">開發中</span>'
      : (demoHref
        ? '<a class="specimen-link" href="' + esc(demoHref) + '"' +
          (isExt(demoHref) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>打開作品 <span aria-hidden="true">↗</span></a>'
        : '<a class="specimen-link" href="' + esc(p.githubUrl) + '" target="_blank" rel="noopener noreferrer">查看原始碼 <span aria-hidden="true">↗</span></a>');

    return '<section class="hero">' +
      '<div class="wrap hero-grid">' +
        '<div>' +
          '<span class="hero-kicker mono">作品檔案 · ' + esc(idx) + ' · ' + esc(cats.join(" / ")) + '</span>' +
          '<h1 class="hero-title">' + esc(p.title) + '</h1>' +
          '<p class="hero-lede">' + esc(p.shortDescription || p.description) + '</p>' +
          '<p class="hero-stats mono">' +
            '<span><b>' + pad2((p.features || []).length) + '</b> 項功能</span>' +
            '<span><b>' + pad2((p.technologies || []).length) + '</b> 項技術</span>' +
            '<span><b>' + esc(fmtDate(p.createdAt)) + '</b> 建立</span>' +
          '</p>' +
          '<div class="detail-actions">' + renderActions(p) + '</div>' +
        '</div>' +
        '<figure class="specimen">' +
          '<a class="specimen-plate" href="' + esc(plateHref) + '"' +
            (isExt(plateHref) ? ' target="_blank" rel="noopener noreferrer"' : '') +
            ' aria-label="打開' + esc(p.title) + '">' +
            (p.thumbnail
              ? '<img src="' + esc(rel(p.thumbnail)) + '" alt="' + esc(p.title) + ' 預覽畫面">'
              : '<span class="plate-noimg mono">無預覽</span>') +
            '<span class="specimen-tab">' + esc(idx) + ' · Specimen</span>' +
          '</a>' +
          '<figcaption class="specimen-label">' +
            '<span class="lbl"><span class="dot" style="--c:' + esc(toRgb(p.accent)) + '"></span> Project Specimen</span>' +
            '<h2>作品預覽</h2>' +
            '<p>' + esc(p.shortDescription || p.description) + '</p>' +
            '<div class="specimen-meta mono">' +
              '<span>' + esc(cats.join(" / ")) + '</span>' +
              '<span>' + esc(tech) + '</span>' +
              '<span>' + esc(fmtDate(p.updatedAt || p.createdAt)) + '</span>' +
            '</div>' +
            specimenLink +
          '</figcaption>' +
        '</figure>' +
      '</div>' +
    '</section>';
  }

  function renderRecord(p, sections) {
    var rail = '<aside class="rail" aria-label="章節索引">' +
      '<p class="rail-label mono">章節</p>' +
      '<ul class="filter-list">' + sections.map(function (s, i) {
        return '<li><a class="filter-btn' + (i === 0 ? " is-active" : "") + '" href="#' + s.id + '">' +
          '<span class="name">' + esc(s.label) + '</span><span class="count">' + pad2(i + 1) + '</span></a></li>';
      }).join("") + '</ul>' +
      '<p class="rail-note mono">點選章節快速跳轉。</p>' +
      '</aside>';

    var records = sections.map(function (s, i) {
      return '<article class="plate plate--text is-in" id="' + s.id + '">' +
        '<span class="plate-tab">' + pad2(i + 1) + ' / ' + esc(s.label) + '</span>' +
        '<div class="plate-body">' +
          '<h3 class="plate-title">' + esc(s.label) + '</h3>' +
          sectionContent(s.id, p) +
        '</div>' +
      '</article>';
    }).join("");

    return '<section class="wrap" aria-labelledby="record-title">' +
      '<div class="index-head">' +
        '<h2 id="record-title">作品內容 · Record</h2>' +
        '<span class="mono">更新 ' + esc(fmtDate(p.updatedAt || p.createdAt)) + '</span>' +
      '</div>' +
      '<div class="index-layout">' + rail + '<div class="detail-content">' + records + '</div></div>' +
    '</section>';
  }

  function render(p, idx) {
    var mount = document.querySelector("[data-detail]");
    if (!mount) return;
    mount.innerHTML = renderHero(p, idx) + renderRecord(p, sectionsOf(p));

    var list = mount.querySelector(".filter-list");
    if (list) {
      list.addEventListener("click", function (e) {
        var a = e.target.closest(".filter-btn");
        if (!a) return;
        Array.prototype.forEach.call(list.querySelectorAll(".filter-btn"), function (el) {
          el.classList.toggle("is-active", el === a);
        });
      });
    }
  }

  function renderError(message) {
    var mount = document.querySelector("[data-detail]");
    if (!mount) return;
    mount.innerHTML = '<section class="wrap"><div class="index-head"><h2>無法載入作品資料</h2></div>' +
      '<p class="detail-note">' + esc(message || "請重新整理頁面。") + '</p>' +
      '<div class="detail-actions"><a class="link-open" href="../../index.html">返回索引 ↗</a></div></section>';
  }

  /* ---------- theme（與首頁一致） ---------- */
  var tBtn = document.querySelector("[data-theme-btn]");
  var tLabel = document.querySelector("[data-theme-label]");
  var metaTheme = document.querySelector('meta[name="theme-color"]');

  function setTheme(t) {
    root.setAttribute("data-theme", t);
    if (tLabel) tLabel.textContent = t === "dark" ? "日間" : "夜讀";
    if (metaTheme) metaTheme.setAttribute("content", t === "dark" ? "#17171a" : "#f3f2ed");
    try { localStorage.setItem("qg-theme", t); } catch (e) { /* ignore */ }
  }
  function currentTheme() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }

  if (tLabel) tLabel.textContent = currentTheme() === "dark" ? "日間" : "夜讀";
  if (tBtn) tBtn.addEventListener("click", function () { setTheme(currentTheme() === "dark" ? "light" : "dark"); });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      var saved = null;
      try { saved = localStorage.getItem("qg-theme"); } catch (err) { /* ignore */ }
      if (saved !== "dark" && saved !== "light") setTheme(e.matches ? "dark" : "light");
    });
  }

  function init() {
    var mount = document.querySelector("[data-detail]");
    if (!mount) return;
    var slug = mount.getAttribute("data-detail");
    try {
      var p = findProject(slug);
      if (!p) {
        renderError("找不到此作品（" + esc(slug) + "），作品可能已移除或網址有誤。");
      } else {
        render(p, projectIndex(p, visibleProjects()));
      }
    } catch (error) {
      renderError("載入作品時發生錯誤：" + (error && error.message ? error.message : "未知錯誤"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
