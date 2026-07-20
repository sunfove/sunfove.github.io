/**
 * Performance + reading experience enhancements.
 * 1. Reading progress bar (rAF-throttled)
 * 2. Estimated reading time
 * 3. Image lazy loading + CLS prevention
 * 4. Native lazy loading for iframes
 */
(function () {
  // ── Reading progress bar (rAF-throttled) ──
  var bar = document.createElement('div');
  bar.id = 'read-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#66BB6A,#4CAF50);z-index:9999;width:0;border-radius:0 2px 2px 0;pointer-events:none';
  document.body.appendChild(bar);

  var articleEl = null;
  var ticking = false;
  var lastProgress = 0;

  function updateProgress() {
    if (!articleEl) articleEl = document.querySelector('.post-content, .markdown-body, article');
    if (!articleEl) return;

    var scrollTop = window.scrollY || window.pageYOffset;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var articleTop = articleEl.getBoundingClientRect().top + scrollTop;

    if (scrollTop < articleTop) {
      if (lastProgress !== 0) {
        bar.style.width = '0';
        bar.style.opacity = '0';
        lastProgress = 0;
      }
    } else {
      var articleHeight = articleEl.offsetHeight;
      var progress = Math.min(1, Math.max(0, (scrollTop - articleTop) / (articleHeight - window.innerHeight)));
      progress = Math.round(progress * 1000) / 1000; // quantize for fewer repaints
      if (progress !== lastProgress) {
        bar.style.width = (progress * 100) + '%';
        bar.style.opacity = progress > 0.02 ? '1' : '0';
        lastProgress = progress;
      }
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });

  // ── Estimated reading time ──
  function addReadTime() {
    articleEl = document.querySelector('.post-content, .markdown-body');
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
      header.parentNode.insertBefore(label, header.nextSibling);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(addReadTime, 100);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(addReadTime, 100); });
  }

  // ── Image & iframe lazy loading ──
  function setupLazyMedia() {
    var images = document.querySelectorAll('.markdown-body img, .post-content img');
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      // CLS prevention: set aspect-ratio from natural dimensions
      if (img.naturalWidth && img.naturalHeight) {
        if (!img.style.aspectRatio) {
          img.style.aspectRatio = img.naturalWidth + '/' + img.naturalHeight;
        }
      }
      // Placeholder background while loading
      img.addEventListener('load', function () { this.style.backgroundColor = ''; }, { once: true });
      if (!img.complete) img.style.backgroundColor = 'rgba(0,0,0,0.03)';
    }

    var iframes = document.querySelectorAll('.markdown-body iframe, .post-content iframe');
    for (var j = 0; j < iframes.length; j++) {
      iframes[j].setAttribute('loading', 'lazy');
    }
  }

  if (document.readyState === 'complete') {
    setupLazyMedia();
  } else {
    window.addEventListener('DOMContentLoaded', setupLazyMedia, { once: true });
  }
})();
