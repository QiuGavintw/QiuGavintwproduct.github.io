/* ============================================================
   作品詳細頁渲染邏輯
   每個作品詳細頁的 index.html 只需：
   1. 載入 js/projects.js
   2. 宣告 <main data-detail="slug"> </main>
   3. 載入 js/detail.js
   ============================================================ */
(function () {
  "use strict";

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function findProject(slug) {
    var list = window.PROJECTS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].slug === slug || list[i].id === slug) return list[i];
    }
    return null;
  }

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
            '<a class="btn btn-ghost" href="../../index.html">返回作品集</a>' +
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

  function relAsset(path) {
    if (!path) return "";
    if (/^(https?:)?\/\//.test(path)) return path;
    if (path.indexOf("/") === 0) return "../../" + path.slice(1);
    return "../../" + path;
  }

  function relUrl(path) {
    if (!path) return "";
    if (/^(https?:)?\/\//.test(path)) return path;
    if (path.indexOf("/") === 0) return "../../" + path.slice(1);
    return "../../" + path;
  }

  /* Scroll reveal（與主站共用行為） */
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

  function init() {
    var mount = document.querySelector("[data-detail]");
    if (!mount) return;
    var slug = mount.getAttribute("data-detail");
    var p = findProject(slug);
    if (!p) {
      mount.innerHTML = '<div class="container" style="padding:120px 24px;text-align:center;">' +
        '<h1>找不到這個作品</h1><p>作品可能已移除或網址有誤。</p>' +
        '<a class="btn btn-primary" href="../../index.html">回到作品集</a></div>';
      return;
    }
    render(p);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
