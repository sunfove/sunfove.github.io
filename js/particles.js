/**
 * Lightweight particle effect for banner area (~30 particles).
 * Optimized: rAF pauses when tab hidden, passive resize, pre-computed constants.
 */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var board = document.getElementById('board');
  if (!board) return;
  var canvas = document.createElement('canvas');
  canvas.id = 'particle-bg';
  canvas.setAttribute('aria-hidden', 'true');
  board.style.position = 'relative';
  board.insertBefore(canvas, board.firstChild);
  var ctx = canvas.getContext('2d');
  var W, H, raf;
  var particles = [];
  var COUNT = 30;
  var mouse = { x: -200, y: -200 };
  var TAU = Math.PI * 2;
  var LINE_DIST = 80;
  var MOUSE_DIST = 150;
  var running = true;
  function size() {
    var rect = board.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
  }
  function initParticles() {
    particles.length = 0;
    for (var i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        a: Math.random() * 0.35 + 0.1
      });
    }
  }
  board.addEventListener('mousemove', function (e) {
    var rect = board.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });
  board.addEventListener('mouseleave', function () {
    mouse.x = -200;
    mouse.y = -200;
  });
  function loop() {
    if (!running) {
      raf = requestAnimationFrame(loop);
      return;
    }
    ctx.clearRect(0, 0, W, H);
    var i, j, p, dx, dy, dist, f;
    for (i = 0; i < COUNT; i++) {
      p = particles[i];
      dx = mouse.x - p.x;
      dy = mouse.y - p.y;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_DIST && dist > 0.5) {
        f = (1.5 - 1.5 * dist / MOUSE_DIST) / dist;
        p.vx += dx * f * 0.003;
        p.vy += dy * f * 0.003;
      }
      p.vx *= 0.998;
      p.vy *= 0.998;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,' + p.a + ')';
      ctx.fill();
    }
    for (i = 0; i < COUNT; i++) {
      for (j = i + 1; j < COUNT; j++) {
        var dx2 = particles[i].x - particles[j].x;
        var dy2 = particles[i].y - particles[j].y;
        var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (d2 < LINE_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.06 * (1 - d2 / LINE_DIST)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
  });
  size();
  initParticles();
  loop();
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      size();
      initParticles();
    }, 200);
  }, { passive: true });
})();