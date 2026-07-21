/* Spectrum · 涟漪池引擎 v3（单色波纹，宁静克制）
   波动方程近似，纯 Canvas 2D，无依赖。
   首页 Hero 与实验室双缝干涉共用。 */
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
    this.ambient = !!opts.ambient;
    this.t = 0;
    this.running = false;
    this.visible = true;
    this._frame = this._frame.bind(this);
    this._resize = this._resize.bind(this);
    this.off = document.createElement('canvas');
    this.offCtx = this.off.getContext('2d');
    this._resize();
    window.addEventListener('resize', this._resize);
    if (this.interactive && !REDUCED) this._bindPointer();
    if (this.ambient && !REDUCED) this._ambientRain();
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
    this.cur = new Float32Array(this.w * this.h);
    this.prev = new Float32Array(this.w * this.h);
    this.off.width = this.w;
    this.off.height = this.h;
    this.img = this.offCtx.createImageData(this.w, this.h);
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
  Tank.prototype._ambientRain = function () {
    var self = this;
    setInterval(function () {
      if (!self.visible || !self.running || !self.w) return;
      var gx = Math.round(self.w * (0.1 + Math.random() * 0.8));
      var gy = Math.round(self.h * (0.2 + Math.random() * 0.6));
      self.disturb(gx, gy, 2.8 + Math.random() * 2, 2);
    }, 5000);
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
  Tank.prototype.setSources = function (sources) { this.sources = sources.slice(); };
  Tank.prototype.clear = function () {
    if (this.cur) this.cur.fill(0);
    if (this.prev) this.prev.fill(0);
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
  Tank.prototype._step = function () {
    var w = this.w, h = this.h, cur = this.cur, prev = this.prev, d = this.damping;
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
        var v = (prev[i - 1] + prev[i + 1] + prev[i - w] + prev[i + w]) / 2 - cur[i];
        cur[i] = v * d;
      }
    }
    this.cur = prev;
    this.prev = cur;
    this.t += 1;
  };
  Tank.prototype._render = function () {
    var w = this.w, h = this.h, cur = this.cur, data = this.img.data;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    for (var y = 1; y < h - 1; y++) {
      var row = y * w;
      for (var x = 1; x < w - 1; x++) {
        var i = row + x;
        var o = i * 4;
        var mag = Math.abs(cur[i + 1] - cur[i - 1]) + Math.abs(cur[i + w] - cur[i - w]);
        if (mag < 0.03) { data[o + 3] = 0; continue; }
        var a = Math.min(1, mag * 1.2);
        data[o]     = dark ? 140 : 45;
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
  Tank.prototype._frame = function () {
    if (!this.running) return;
    if (this.visible) {
      this._step();
      this._render();
    }
    this.raf = requestAnimationFrame(this._frame);
  };
  Tank.prototype._staticFrame = function () {
    var cx = Math.round(this.w / 2), cy = Math.round(this.h / 2);
    for (var r = 4; r < Math.min(this.w, this.h) / 2; r += 6) {
      for (var a = 0; a < Math.PI * 2; a += 0.05) {
        var x = Math.round(cx + r * Math.cos(a));
        var y = Math.round(cy + r * Math.sin(a));
        if (x > 0 && y > 0 && x < this.w - 1 && y < this.h - 1) {
          this.cur[y * this.w + x] = Math.sin(r) * 0.6;
        }
      }
    }
    this._render();
  };
  window.SpectrumRipple = { mount: function (canvas, opts) { return new Tank(canvas, opts); } };
  var hero = document.getElementById('rippleTank');
  if (hero) {
    window.SpectrumRipple.mount(hero, { ambient: true, interactive: true, cell: 5 });
  }
})();