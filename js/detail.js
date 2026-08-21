/* ============================================================
   作品詳細頁渲染邏輯
   每個作品詳細頁的 index.html 只需：
   1. 載入 js/projects.js
   2. 宣告 <main data-detail="slug"> </main>
   3. 載入 js/detail.js

   本檔負責：
   - 主題切換（與首頁行為一致）
   - Loading 解除（成功 / 失敗都會解除，永不卡住）
   - 詳細內容渲染
   - 錯誤訊息與重新載入按鈕
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- 安全工具 ---------- */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------- Loading 管理 ---------- */
  var LOADER_TIMEOUT = 8000; // 安全上限：8 秒內必定解除
  var loaderHidden = false;

  function hideLoader() {
    if (loaderHidden) return;
    loaderHidden = true;
    var loader = document.querySelector("[data-loader]");
    if (loader) loader.classList.add("is-done");
  }

  function armLoaderTimeout() {
    setTimeout(hideLoader, LOADER_TIMEOUT);
  }

  /* ---------- 主題切換（與 main.js 行為一致） ---------- */
  var THEME_KEY = "qg-theme";
  var themeToggle = document.querySelector("[data-theme-toggle]");

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#000000" : "#fbfbfd");
    }
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "dark" ? "切換為淺色模式" : "切換為深色模式");
    }
  }

  function initTheme() {
    var saved = getSavedTheme();
    var theme = saved === "dark" || saved === "light" ? saved : getSystemTheme();
    applyTheme(theme);

    if (themeToggle) {
      themeToggle.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      });
    }

    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
        if (!getSavedTheme()) applyTheme(e.matches ? "dark" : "light");
      });
    }
  }

  /* ---------- 資料查詢 ---------- */
  function findProject(slug) {
    var list = window.PROJECTS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].slug === slug || list[i].id === slug) return list[i];
    }
    return null;
  }

  /* ---------- 渲染 ---------- */
  function renderFeatures(p) {
    if (!p.features || !p.features.length) return "";
    return '<div class="feature-grid">' +
      p.features.map(function (f) {
        return '<div class="feature-card"><p>' + esc(f) + '</p></div>';
      }).join("") +
      '</div>';
  }

  function renderHowTo(p) {
    if (!p.howToPlay || !p.howToPlay.length) return "";
    return '<div class="detail-cols"><div>' +
      '<h3>操作說明</h3>' +
      '<ol class="steps-list">' +
      p.howToPlay.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("") +
      '</ol>' +
      '</div><div>' +
      '<h3>作品亮點</h3>' +
      '<ul class="highlight-list">' +
      p.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join("") +
      '</ul>' +
      '</div></div>';
  }

  function renderNote(p) {
    if (!p.demoUrl && p.githubUrl) {
      return '<p class="detail-note">此作品為後端服務專案，需 Node.js 環境執行，無法在 GitHub Pages 中直接體驗。您可以透過上方按鈕前往 GitHub 檢視完整原始碼。</p>';
    }
    return "";
  }

  function render(p) {
    var mount = document.querySelector("[data-detail]");
    if (!mount) return;
    var cats = (p.categories || []).map(esc).join(" ・ ");

    mount.innerHTML =
      '<section class="detail-hero" data-reveal>' +
        '<div class="container">' +
          '<div class="detail-hero-cat">' + cats + '</div>' +
          '<h1>' + esc(p.title) + '</h1>' +
          '<p>' + esc(p.description) + '</p>' +
          '<div class="detail-hero-actions">' +
            (p.demoUrl
              ? '<a class="btn btn-primary" href="' + esc(relUrl(p.demoUrl)) + '" target="_blank" rel="noopener noreferrer">立即體驗 <span class="arrow" aria-hidden="true">↗</span></a>'
              : '') +
            '<a class="btn btn-ghost" href="' + esc(p.githubUrl) + '" target="_blank" rel="noopener noreferrer">GitHub <span class="arrow" aria-hidden="true">↗</span></a>' +
            '<a class="btn btn-ghost" href="' + relUrl("index.html") + '">返回作品集</a>' +
          '</div>' +
          '<div class="detail-tech">' +
            (p.technologies || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join("") +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="detail-section" data-reveal>' +
        '<div class="container">' +
          '<h2>作品簡介</h2>' +
          '<p class="lead">' + esc(p.description) + '</p>' +
          '<div class="detail-shot">' +
            '<img src="' + esc(relAsset(p.thumbnail)) + '" alt="' + esc(p.title) + ' 預覽畫面" loading="lazy">' +
          '</div>' +
        '</div>' +
      '</section>' +

      (p.features && p.features.length
        ? '<section class="detail-section" data-reveal><div class="container">' +
          '<h2>功能介紹</h2>' +
          renderFeatures(p) +
          '</div></section>'
        : "") +

      (p.howToPlay && p.howToPlay.length
        ? '<section class="detail-section" data-reveal><div class="container">' +
          renderHowTo(p) +
          '</div></section>'
        : "") +

      '<section class="detail-section" data-reveal><div class="container">' +
        '<h2>使用技術</h2>' +
        '<p class="lead">' +
          (p.technologies || []).map(esc).join(" ・ ") +
        '</p>' +
        '<div class="detail-note">作品採用純前端技術，可直接在 GitHub Pages 靜態環境中運作。</div>' +
        renderNote(p) +
      '</div></section>';

    observeReveal();
  }

  /* ---------- 路徑處理（GitHub Pages Project Pages 相容） ---------- */
  function relAsset(path) {
    if (!path) return "";
    if (/^(https?:)?\/\//.test(path)) return path;
    return "../../" + path.replace(/^\//, "");
  }

  function relUrl(path) {
    if (!path) return "";
    if (/^(https?:)?\/\//.test(path)) return path;
    return "../../" + path.replace(/^\//, "");
  }

  /* ---------- 錯誤畫面 ---------- */
  function renderError(message) {
    var mount = document.querySelector("[data-detail]");
    if (!mount) return;
    mount.innerHTML =
      '<div class="container detail-error" style="padding:120px 24px;text-align:center;">' +
        '<h1>無法載入作品資料</h1>' +
        '<p style="color:var(--text-secondary);margin-bottom:28px;">' + esc(message || "請重新整理頁面。") + '</p>' +
        '<div class="detail-hero-actions">' +
          '<button type="button" class="btn btn-primary" data-retry>重新載入</button>' +
          '<a class="btn btn-ghost" href="' + relUrl("index.html") + '">回到作品集</a>' +
        '</div>' +
      '</div>';
    var retry = document.querySelector("[data-retry]");
    if (retry) {
      retry.addEventListener("click", function () { window.location.reload(); });
    }
  }

  /* ---------- Scroll reveal ---------- */
  var revealObserver = null;
  function observeReveal() {
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]"), function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]:not(.is-visible)"), function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- 初始化（含錯誤處理，Loading 必定解除） ---------- */
  function init() {
    // 先啟動安全 timeout，確保任何情況 Loading 都會消失
    armLoaderTimeout();

    var mount = document.querySelector("[data-detail]");
    if (!mount) {
      hideLoader();
      return;
    }

    var slug = mount.getAttribute("data-detail");

    try {
      var p = findProject(slug);
      if (!p) {
        renderError("找不到此作品（" + esc(slug) + "），作品可能已移除或網址有誤。");
      } else {
        render(p);
      }
    } catch (error) {
      // 不讓任何 exception 造成 Loading 永久停留
      try {
        renderError("載入作品時發生錯誤：" + (error && error.message ? error.message : "未知錯誤"));
      } catch (e) {
        var m = document.querySelector("[data-detail]");
        if (m) m.innerHTML = '<div class="container" style="padding:120px 24px;text-align:center;"><h1>無法載入作品資料</h1></div>';
      }
    } finally {
      hideLoader();
    }
  }

  function bootstrap() {
    initTheme();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  bootstrap();
})();
