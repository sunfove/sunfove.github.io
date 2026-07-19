/**
 * 性能优化 + 阅读体验增强脚本
 * 1. 图片 native lazy loading
 * 2. 阅读进度条
 * 3. 预计阅读时间
 * 4. 图片 CLS 防抖
 */
(function () {
  // ── 进度条 ──
  var bar = document.createElement('div');
  bar.id = 'read-progress';
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#66BB6A,#4CAF50);z-index:9999;transition:width .1s linear;border-radius:0 2px 2px 0';
  document.body.appendChild(bar);

  var articleEl = document.querySelector('.post-content, .markdown-body, article');
  window.addEventListener('scroll', function () {
    if (!articleEl) return;
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var articleTop = articleEl.getBoundingClientRect().top + scrollTop;
    if (scrollTop < articleTop) { bar.style.width = '0'; return; }
    var articleHeight = articleEl.offsetHeight;
    var progress = Math.min(1, Math.max(0, (scrollTop - articleTop) / (articleHeight - window.innerHeight)));
    bar.style.width = (progress * 100) + '%';
    bar.style.opacity = progress > 0.02 ? '1' : '0';
  });

  // ── 阅读时间（等 DOM ready） ──
  function addReadTime() {
    var articleEl = document.querySelector('.post-content, .markdown-body');
    if (!articleEl) return;
    var text = articleEl.textContent || '';
    var wordCount = text.replace(/\s+/g, '').length;
    if (wordCount < 100) return;
    var min = Math.max(1, Math.round(wordCount / 400));
    var label = document.createElement('span');
    label.style.cssText = 'display:inline-block;font-size:13px;color:#999;margin:8px 0 0 0;letter-spacing:0.04em';
    label.textContent = '⏱ 预计阅读 ' + min + ' 分钟 · ' + wordCount + ' 字';
    var header = articleEl.querySelector('h1, h2, .post-meta, #seo-header, .note');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(label, header.nextElementSibling || header.nextSibling);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(addReadTime, 100);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(addReadTime, 100); });
  }

  // ── 图片优化 ──
  if (typeof IntersectionObserver === 'undefined') return;
  var images = document.querySelectorAll('.markdown-body img, .post-content img');
  images.forEach(function (img) {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    if (img.naturalWidth && img.naturalHeight && !img.style.aspectRatio) {
      img.style.aspectRatio = img.naturalWidth + '/' + img.naturalHeight;
    }
    img.addEventListener('load', function () { img.style.backgroundColor = ''; });
    if (!img.complete) img.style.backgroundColor = 'rgba(0,0,0,0.03)';
  });

  var iframes = document.querySelectorAll('.markdown-body iframe');
  iframes.forEach(function (el) { el.setAttribute('loading', 'lazy'); });
})();
