/* ============================================================
   QiuGavintwproduct 個人作品集 - 主邏輯
   主題切換 / Loading / 作品渲染與篩選 / Scroll reveal
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- Theme ---------- */
  var THEME_KEY = "qg-theme";
  var themeToggle = document.querySelector("[data-theme-toggle]");

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
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

  function getSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
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

  /* ---------- Loading ---------- */
  function initLoader() {
    var loader = document.querySelector("[data-loader]");
    if (!loader) return;
    var done = function () {
      loader.classList.add("is-done");
    };
    var minWait = new Promise(function (r) { setTimeout(r, 500); });
    var loaded = document.readyState === "complete"
      ? Promise.resolve()
      : new Promise(function (r) {
          window.addEventListener("load", r, { once: true });
        });
    Promise.all([minWait, loaded]).then(done);
    setTimeout(done, 3500); // 最長等待，避免卡住
  }

  /* ---------- Projects rendering ---------- */
  function sortedProjects() {
    return (window.PROJECTS || []).slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function renderProjects(filter) {
    var grid = document.querySelector("[data-works-grid]");
    var empty = document.querySelector("[data-works-empty]");
    if (!grid) return;
    var projects = sortedProjects().filter(function (p) {
      if (!filter || filter === "all") return true;
      return (p.categories || []).indexOf(filter) !== -1;
    });

    grid.innerHTML = projects.map(function (p) {
      var tags = (p.categories || []).map(function (c) {
        return '<span>' + esc(c) + '</span>';
      }).join("");
      var demo = p.demoUrl
        ? '<a class="btn btn-primary btn-sm" href="' + escAttr(p.demoUrl) + '" target="_blank" rel="noopener noreferrer">立即體驗 <span class="arrow" aria-hidden="true">↗</span></a>'
        : '<a class="btn btn-ghost btn-sm" href="' + escAttr(p.githubUrl) + '" target="_blank" rel="noopener noreferrer">檢視程式碼 <span class="arrow" aria-hidden="true">↗</span></a>';
      return (
        '<article class="work-card" data-reveal>' +
          '<a class="work-card-thumb" href="' + escAttr(p.detailPage) + '" tabindex="-1" aria-hidden="true">' +
            '<img src="' + escAttr(p.thumbnail) + '" alt="' + escAttr(p.title) + ' 預覽畫面" loading="lazy" decoding="async">' +
          '</a>' +
          '<div class="work-card-body">' +
            '<h3 class="work-card-title"><a href="' + escAttr(p.detailPage) + '">' + esc(p.title) + '</a></h3>' +
            '<p class="work-card-desc">' + esc(p.shortDescription) + '</p>' +
            '<div class="work-card-tags">' + tags + '</div>' +
            '<div class="work-card-actions">' +
              '<a class="btn btn-ghost btn-sm" href="' + escAttr(p.detailPage) + '">查看詳情</a>' +
              demo +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join("");

    if (empty) {
      empty.classList.toggle("is-visible", projects.length === 0);
    }
    observeReveal();
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escAttr(str) { return esc(str); }

  /* ---------- Filter ---------- */
  function initFilter() {
    var bar = document.querySelector("[data-filter-bar]");
    if (!bar) return;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      var filter = btn.getAttribute("data-filter");
      Array.prototype.forEach.call(bar.querySelectorAll("[data-filter]"), function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      renderProjects(filter);
    });
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
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]:not(.is-visible)"), function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- Init ---------- */
  function init() {
    initTheme();
    initLoader();
    initFilter();
    renderProjects("all");
    observeReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
