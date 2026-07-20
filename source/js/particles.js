/**
 * Spectrum · 星空粒子系统
 * Hero 涟漪池上方漂浮的微光粒子 —— 浅色如阳光尘埃，深色如银河星点。
 * 粒子间有极淡连线（星座感），鼠标靠近时微偏移。
 * 尊重 prefers-reduced-motion。
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var tank = document.querySelector('.hero-tank');
  if (!tank) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'starfield';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1';
  tank.style.position = 'relative';
  tank.insertBefore(canvas, tank.firstChild);

  var ctx = canvas.getContext('2d');
  var W, H, raf;
  var COUNT = 80;
  var stars = [];
  var mouse = { x: -300, y: -300 };
  var TAU = Math.PI * 2;
  var running = true;
  var t = 0;

  function size() {
    var rect = tank.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = rect.width * dpr;
    H = canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width;
    H = rect.height;
  }

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function initStars() {
    stars.length = 0;
    var dark = isDark();
    for (var i = 0; i < COUNT; i++) {
      stars.push({
        x: Math.random() * (W || 1200),
        y: Math.random() * (H || 400),
        r: Math.random() * 1.2 + 0.3,
        baseAlpha: dark ? Math.random() * 0.3 + 0.2 : Math.random() * 0.15 + 0.05,
        phase: Math.random() * TAU,        // twinkle phase offset
        speed: Math.random() * 0.02 + 0.008, // twinkle speed
        vy: -(Math.random() * 0.15 + 0.04), // slow upward drift
        vx: (Math.random() - 0.5) * 0.08
      });
    }
  }

  tank.addEventListener('mousemove', function (e) {
    var rect = tank.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });

  tank.addEventListener('mouseleave', function () {
    mouse.x = -300;
    mouse.y = -300;
  });

  function loop() {
    if (!running) { raf = requestAnimationFrame(loop); return; }
    t++;
    ctx.clearRect(0, 0, W, H);

    var dark = isDark();
    var i, j, s, dx, dy, dist, alpha;

    // Draw constellation lines first (behind stars)
    var LINE_DIST = dark ? 130 : 100;
    var lineAlpha = dark ? 0.06 : 0.03;
    for (i = 0; i < stars.length; i++) {
      for (j = i + 1; j < stars.length; j++) {
        dx = stars[i].x - stars[j].x;
        dy = stars[i].y - stars[j].y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINE_DIST) {
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          alpha = lineAlpha * (1 - dist / LINE_DIST);
          ctx.strokeStyle = dark
            ? 'rgba(180,200,240,' + alpha + ')'
            : 'rgba(196,164,90,' + alpha + ')';
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }
    }

    // Draw stars
    for (i = 0; i < stars.length; i++) {
      s = stars[i];

      // Gentle mouse attraction
      dx = mouse.x - s.x;
      dy = mouse.y - s.y;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180 && dist > 0.5) {
        var f = (1 - dist / 180) * 0.003;
        s.vx += dx * f;
        s.vy += dy * f * 0.5;
      }

      // Drift
      s.x += s.vx;
      s.y += s.vy;

      // Damping
      s.vx *= 0.999;
      s.vy *= 0.999;

      // Wrap around edges
      if (s.x < -10) s.x = W + 10;
      if (s.x > W + 10) s.x = -10;
      if (s.y < -20) s.y = H + 20;
      if (s.y > H + 20) { s.y = -20; s.x = Math.random() * W; }

      // Twinkle
      alpha = s.baseAlpha + Math.sin(t * s.speed + s.phase) * s.baseAlpha * 0.6;
      alpha = Math.max(0.03, Math.min(0.9, alpha));

      // Draw glow + core
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, TAU);
      ctx.fillStyle = dark
        ? 'rgba(180,200,240,' + (alpha * 0.25) + ')'
        : 'rgba(196,164,90,' + (alpha * 0.2) + ')';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fillStyle = dark
        ? 'rgba(220,230,255,' + alpha + ')'
        : 'rgba(220,200,160,' + alpha + ')';
      ctx.fill();
    }

    raf = requestAnimationFrame(loop);
  }

  // Pause when tab hidden
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
  });

  size();
  initStars();
  loop();

  // Resize
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      size();
      initStars();
    }, 300);
  }, { passive: true });

  // Watch theme changes (dark/light switching)
  var observer = new MutationObserver(function () {
    initStars();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
