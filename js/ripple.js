/* Spectrum · 首页粒子流场 + 实验室波动模拟，共用引擎
   mode: 'flow' (粒子流场) | 'wave' (波动方程，默认) */
(function () {
  'use strict';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function Tank(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cell = opts.cell || 5;
    this.damping = opts.damping || 0.986;
    this.sources = (opts.sources || []).slice();
    this.interactive = opts.interactive !== false;
    this.mode = opts.mode || 'wave';
    this.t = 0;
    this.running = false;
    this.visible = true;
    this.mx = -1; this.my = -1;
    this._frame = this._frame.bind(this);
    this._resize = this._resize.bind(this);
    this._resize();
    window.addEventListener('resize', this._resize);
    if (this.interactive && !REDUCED) {
      if (this.mode === 'flow') this._bindFlowPointer();
      else this._bindPointer();
    }
    if (REDUCED) {
      this._staticFrame();
    } else {
      this._observe();
      this.start();
    }
  }
  Tank.prototype._resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = Math.max(16, Math.round(w / this.cell));
    this.h = Math.max(16, Math.round(h / this.cell));
    if (this.mode === 'flow') {
      this._initParticles();
    } else {
      this.cur = new Float32Array(this.w * this.h);
      this.prev = new Float32Array(this.w * this.h);
      this.off = document.createElement('canvas');
      this.offCtx = this.off.getContext('2d');
      this.off.width = this.w;
      this.off.height = this.h;
      this.img = this.offCtx.createImageData(this.w, this.h);
    }
  };
  Tank.prototype._observe = function () {
    var self = this;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        self.visible = entries[0].isIntersecting;
      }, { threshold: 0.05 }).observe(this.canvas);
    }
    document.addEventListener('visibilitychange', function () {
      self.visible = !document.hidden;
    });
  };
  Tank.prototype.setSources = function (s) { this.sources = s.slice(); };
  Tank.prototype.clear = function () {
    if (this.cur) this.cur.fill(0);
    if (this.prev) this.prev.fill(0);
    if (this.particles) this._initParticles();
  };
  Tank.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this._frame);
  };
  Tank.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  };
  Tank.prototype._staticFrame = function () {
    if (this.mode === 'flow') this._renderFlow();
    else this._renderWave();
  };
  Tank.prototype._bindPointer = function () {
    var self = this;
    var last = 0;
    this.canvas.addEventListener('pointermove', function (e) {
      var now = performance.now();
      if (now - last < 40) return;
      last = now;
      var p = self._toGrid(e);
      self.disturb(p.x, p.y, 1.6, 2);
    });
    this.canvas.addEventListener('pointerdown', function (e) {
      var p = self._toGrid(e);
      self.disturb(p.x, p.y, 6, 3);
    });
  };
  Tank.prototype._toGrid = function (e) {
    var r = this.canvas.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - r.left) / r.width * this.w),
      y: Math.round((e.clientY - r.top) / r.height * this.h)
    };
  };
  Tank.prototype.disturb = function (gx, gy, strength, radius) {
    radius = radius || 2;
    for (var dy = -radius; dy <= radius; dy++) {
      for (var dx = -radius; dx <= radius; dx++) {
        var x = gx + dx, y = gy + dy;
        if (x < 1 || y < 1 || x >= this.w - 1 || y >= this.h - 1) continue;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d <= radius) {
          this.prev[y * this.w + x] += strength * Math.cos(d / radius * Math.PI / 2);
        }
      }
    }
  };
  Tank.prototype._stepWave = function () {
    var w = this.w, h = this.h, cur = this.cur, prev = this.prev;
    for (var s = 0; s < this.sources.length; s++) {
      var src = this.sources[s];
      var sx = Math.round(src.x * w), sy = Math.round(src.y * h);
      if (sx > 0 && sy > 0 && sx < w - 1 && sy < h - 1) {
        prev[sy * w + sx] = src.amp * Math.sin(this.t * src.freq);
      }
    }
    for (var y = 1; y < h - 1; y++) {
      var row = y * w;
      for (var x = 1; x < w - 1; x++) {
        var i = row + x;
        cur[i] = ((prev[i - 1] + prev[i + 1] + prev[i - w] + prev[i + w]) / 2 - cur[i]) * this.damping;
      }
    }
    var tmp = this.cur; this.cur = prev; this.prev = tmp;
    this.t += 1;
  };
  Tank.prototype._renderWave = function () {
    var w = this.w, h = this.h, cur = this.cur, data = this.img.data;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    for (var y = 1; y < h - 1; y++) {
      var row = y * w;
      for (var x = 1; x < w - 1; x++) {
        var i = row + x, o = i * 4;
        var mag = Math.abs(cur[i + 1] - cur[i - 1]) + Math.abs(cur[i + w] - cur[i - w]);
        if (mag < 0.03) { data[o + 3] = 0; continue; }
        var a = Math.min(1, mag * 1.2);
        data[o] = dark ? 140 : 45;
        data[o + 1] = dark ? 160 : 75;
        data[o + 2] = dark ? 200 : 140;
        data[o + 3] = Math.round(a * (dark ? 90 : 55));
      }
    }
    this.offCtx.putImageData(this.img, 0, 0);
    var cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    var ctx = this.ctx;
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.off, 0, 0, w, h, 0, 0, cw, ch);
  };
  Tank.prototype._initParticles = function () {
    var cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    var n = Math.max(60, Math.min(200, Math.round(cw * ch / 5000)));
    this.particles = [];
    for (var i = 0; i < n; i++) {
      this.particles.push({
        x: Math.random() * cw,
        y: Math.random() * ch,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1.2 + Math.random() * 1.6,
        a: 0.12 + Math.random() * 0.28
      });
    }
  };
  Tank.prototype._bindFlowPointer = function () {
    var self = this;
    this.canvas.addEventListener('pointermove', function (e) {
      var r = self.canvas.getBoundingClientRect();
      self.mx = e.clientX - r.left;
      self.my = e.clientY - r.top;
    });
    this.canvas.addEventListener('pointerleave', function () { self.mx = -1; self.my = -1; });
    this.canvas.addEventListener('pointerdown', function (e) {
      var r = self.canvas.getBoundingClientRect();
      var px = e.clientX - r.left, py = e.clientY - r.top;
      var ps = self.particles;
      if (!ps) return;
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        var dx = p.x - px, dy = p.y - py;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 140) {
          p.vx += (dx / dist) * 2.5;
          p.vy += (dy / dist) * 2.5;
        }
      }
    });
  };
  Tank.prototype._renderFlow = function () {
    var cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    var ctx = this.ctx;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var ps = this.particles;
    var mx = this.mx, my = this.my;
    var t = this.t * 0.003;
    ctx.clearRect(0, 0, cw, ch);
    if (!ps) return;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      p.vx += Math.sin(p.y * 0.008 + t) * 0.01 + Math.cos(p.x * 0.01 + t * 0.7) * 0.008;
      p.vy += Math.cos(p.x * 0.008 + t * 0.9) * 0.01 + Math.sin(p.y * 0.01 + t * 0.6) * 0.008;
      if (mx > 0 && my > 0) {
        var dx = mx - p.x, dy = my - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160 && dist > 1) {
          var force = (1 - dist / 160) * 0.03;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
      p.vx *= 0.996;
      p.vy *= 0.996;
      var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (spd > 1) { p.vx *= 1 / spd; p.vy *= 1 / spd; }
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = cw + 10;
      if (p.x > cw + 10) p.x = -10;
      if (p.y < -10) p.y = ch + 10;
      if (p.y > ch + 10) p.y = -10;
      var alpha = p.a;
      if (mx > 0 && my > 0) {
        var d2 = Math.sqrt((p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my));
        if (d2 < 90) alpha = Math.min(0.75, p.a + (1 - d2 / 90) * 0.45);
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = dark
        ? 'rgba(106,159,192,' + alpha + ')'
        : 'rgba(59,107,139,' + alpha + ')';
      ctx.fill();
    }
    this.t += 1;
  };
  Tank.prototype._frame = function () {
    if (!this.running) return;
    if (this.visible) {
      if (this.mode === 'flow') {
        this._renderFlow();
      } else {
        this._stepWave();
        this._renderWave();
      }
    }
    this.raf = requestAnimationFrame(this._frame);
  };
  window.SpectrumRipple = { mount: function (canvas, opts) { return new Tank(canvas, opts); } };
  var hero = document.getElementById('rippleTank');
  if (hero) {
    window.SpectrumRipple.mount(hero, { mode: 'flow', interactive: true, cell: 5 });
  }
})();