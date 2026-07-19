/**
 * Lightweight particle effect for banner area
 * ~30 particles, no heavy physics, minimal performance impact
 */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var board = document.getElementById('board');
  if (!board) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'particle-bg';
  board.style.position = 'relative';
  board.insertBefore(canvas, board.firstChild);

  var ctx = canvas.getContext('2d');
  var W, H, raf;
  var particles = [];
  var COUNT = 30;
  var mouse = { x: -200, y: -200 };

  function size() {
    var rect = board.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
  }

  function initParticles() {
    particles = [];
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
  });

  board.addEventListener('mouseleave', function () {
    mouse.x = -200;
    mouse.y = -200;
  });

  function loop() {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Gentle attraction toward mouse
      var dx = mouse.x - p.x;
      var dy = mouse.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150 && dist > 0.5) {
        var f = (1.5 - 1.5 * dist / 150) / dist;
        p.vx += dx * f * 0.003;
        p.vy += dy * f * 0.003;
      }

      p.vx *= 0.998;
      p.vy *= 0.998;
      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + p.a + ')';
      ctx.fill();
    }

    // Lines
    for (i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx2 = particles[i].x - particles[j].x;
        var dy2 = particles[i].y - particles[j].y;
        var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (d2 < 80) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.06 * (1 - d2 / 80)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    raf = requestAnimationFrame(loop);
  }

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
  });

  // Cleanup on page navigation (SPA-like)
  window.addEventListener('beforeunload', function () {
    cancelAnimationFrame(raf);
  });
})();
