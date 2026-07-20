/* Spectrum · 主脚本：明暗切换 / 移动导航 / 目录滚动监听 */
(function () {
  'use strict';

  /* ---- 明暗主题切换（接入四时场景：会话内手动选择优先） ---- */
  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var root = document.documentElement;
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (window.SpectrumScenes && window.SpectrumScenes.setManual) {
        window.SpectrumScenes.setManual(next);
      } else {
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('spectrum-theme', next); } catch (e) {}
      }
    });
  }

  /* ---- 移动端导航 ---- */
  var burger = document.getElementById('navBurger');
  var links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---- 目录滚动监听（scrollspy） ---- */
  var tocNav = document.getElementById('tocNav');
  if (tocNav) {
    var tocLinks = Array.prototype.slice.call(tocNav.querySelectorAll('a[href^="#"]'));
    var pairs = [];
    tocLinks.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      var heading = document.getElementById(id);
      if (heading) pairs.push({ a: a, h: heading });
    });
    if (pairs.length) {
      var current = null;
      var onScroll = function () {
        var y = window.scrollY + 90;
        var active = pairs[0];
        for (var i = 0; i < pairs.length; i++) {
          if (pairs[i].h.offsetTop <= y) active = pairs[i];
          else break;
        }
        if (active !== current) {
          if (current) current.a.classList.remove('is-active');
          if (active) active.a.classList.add('is-active');
          current = active;
        }
      };
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (!ticking) {
          window.requestAnimationFrame(function () { onScroll(); ticking = false; });
          ticking = true;
        }
      }, { passive: true });
      onScroll();
    }
  }

  /* ---- 窄屏时目录默认折叠，宽屏展开 ---- */
  var tocBox = document.getElementById('tocBox');
  if (tocBox && window.matchMedia) {
    var mq = window.matchMedia('(max-width: 880px)');
    var apply = function () { tocBox.open = !mq.matches; };
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
  }
})();
