/**
 * Performance + reading experience + elegance enhancements.
 * 1. Reading progress bar (rAF-throttled, ink-glow, amber at 100%)
 * 2. Estimated reading time
 * 3. Image lazy loading + CLS prevention
 * 4. Scroll-reveal animations (IntersectionObserver)
 * 5. Back-to-top button
 */
(function () {
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Reading progress bar (rAF-throttled, glow-enhanced) ──
  var bar = document.createElement('div');
  bar.id = 'read-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:2.5px;background:linear-gradient(90deg,var(--sp-amber,#c4a45a),var(--sp-yellow,#c4a45a));z-index:9999;width:0;border-radius:0 1.5px 1.5px 0;pointer-events:none;box-shadow:0 0 6px rgba(196,164,90,0.35)';
  document.body.appendChild(bar);

  var articleEl = null;
  var ticking = false;
  var lastProgress = 0;
  var hit100 = false;

  function updateProgress() {
    if (!articleEl) articleEl = document.querySelector('.post-content, .markdown-body, article');
    if (!articleEl) return;

    var scrollTop = window.scrollY || window.pageYOffset;
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
      progress = Math.round(progress * 1000) / 1000;
      if (progress !== lastProgress) {
        bar.style.width = (progress * 100) + '%';
        bar.style.opacity = progress > 0.02 ? '1' : '0';
        lastProgress = progress;
      }
      // Flash amber at 100%
      if (progress >= 0.99 && !hit100) {
        hit100 = true;
        bar.style.background = 'var(--seal-red,#c4333e)';
        bar.style.boxShadow = '0 0 10px rgba(196,51,62,0.5)';
        setTimeout(function () {
          bar.style.background = 'linear-gradient(90deg,var(--sp-amber,#c4a45a),var(--sp-yellow,#c4a45a))';
          bar.style.boxShadow = '0 0 6px rgba(196,164,90,0.35)';
        }, 2000);
      }
      if (progress < 0.99) hit100 = false;
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
    label.style.cssText = 'display:inline-block;font-size:13px;color:var(--ink-faint,#9a9180);margin:8px 0 0 0;letter-spacing:0.04em;font-family:var(--sans)';
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
      if (img.naturalWidth && img.naturalHeight) {
        if (!img.style.aspectRatio) {
          img.style.aspectRatio = img.naturalWidth + '/' + img.naturalHeight;
        }
      }
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

  // ── Scroll-Reveal Animations ──
  if (!REDUCED && window.IntersectionObserver) {
    var revealSelector = '.post-content p, .post-content h2, .post-content h3, .post-content h4, .post-content ul, .post-content ol, .post-content figure, .post-content blockquote, .post-content pre, .page-content p, .page-content h2, .page-content h3';
    var revealEls = document.querySelectorAll(revealSelector);

    if (revealEls.length > 4) {
      for (var ri = 0; ri < revealEls.length; ri++) {
        revealEls[ri].classList.add('reveal-hidden');
        revealEls[ri].style.transitionDelay = Math.min(ri * 0.02, 0.3) + 's';
      }

      var observer = new IntersectionObserver(function (entries) {
        for (var ei = 0; ei < entries.length; ei++) {
          if (entries[ei].isIntersecting) {
            entries[ei].target.classList.add('reveal-visible');
            observer.unobserve(entries[ei].target);
          }
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

      for (var si = 0; si < revealEls.length; si++) {
        observer.observe(revealEls[si]);
      }
    }
  }

  // ── Back-to-Top Button ──
  var btt = document.createElement('button');
  btt.id = 'backToTop';
  btt.setAttribute('aria-label', '回到顶部');
  btt.setAttribute('title', '回到顶部');
  btt.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 19V5m-5 5 5-5 5 5"/></svg>';
  btt.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9998;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border:1px solid var(--ink-faint,#a39a8c);border-radius:50%;background:var(--paper-raised,#fdfaf1);color:var(--ink-soft,#6b655c);cursor:pointer;opacity:0;pointer-events:none;transition:opacity 0.3s,border-color 0.25s,color 0.25s;';
  document.body.appendChild(btt);

  btt.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  });

  btt.addEventListener('mouseenter', function () {
    btt.style.borderColor = 'var(--seal-red,#c4333e)';
    btt.style.color = 'var(--seal-red,#c4333e)';
  });
  btt.addEventListener('mouseleave', function () {
    btt.style.borderColor = 'var(--ink-faint,#a39a8c)';
    btt.style.color = 'var(--ink-soft,#6b655c)';
  });

  var bttTicking = false;
  window.addEventListener('scroll', function () {
    if (!bttTicking) {
      requestAnimationFrame(function () {
        var show = window.scrollY > 400;
        btt.style.opacity = show ? '1' : '0';
        btt.style.pointerEvents = show ? 'auto' : 'none';
        bttTicking = false;
      });
      bttTicking = true;
    }
  }, { passive: true });
})();
