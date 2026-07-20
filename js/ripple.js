/* Spectrum · 涟漪池引擎 v2（波动方程近似 + 色散光谱环 + 子夜星野）
   色散（dispersion）：每个涟漪环拆为 3 个光谱通道，沿传播方向取微小半径偏移，
   色相随环龄（波场相位 + 时间）缓慢漂移；暗房用 'lighter' 加色混合，稿纸用法线 alpha。
   首页 Hero 与实验室双缝干涉共用。纯 Canvas 2D，无依赖。 */
(function () {
  'use strict';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPREAD = 34;    /* 色散通道间色相角距（度） */
  var DRIFT = 0.10;   /* 色相随环龄漂移速度（度/帧） */
  var CH_OFF = 1.7;   /* 色散通道半径偏移（网格单元） */
  function themeState() {
    var de = document.documentElement;
    return {
      dark: de.getAttribute('data-theme') === 'dark',
      scene: de.getAttribute('data-scene') || 'day'
    };
  }
  function hsl2rgb(h, s, l, out) {
    h = (((h % 360) + 360) % 360) / 60;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h % 2) - 1));
    var m = l - c / 2;
    var r, g, b;
    if (h < 1) { r = c; g = x; b = 0; }
    else if (h < 2) { r = x; g = c; b = 0; }
    else if (h < 3) { r = 0; g = c; b = x; }
    else if (h < 4) { r = 0; g = x; b = c; }
    else if (h < 5) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    out[0] = (r + m) * 255; out[1] = (g + m) * 255; out[2] = (b + m) * 255;
  }
  function Tank(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cell = opts.cell || 5;             /* 网格边长（CSS px） */
    this.damping = opts.damping || 0.986;
    this.sources = (opts.sources || []).slice();
    this.interactive = opts.interactive !== false;
    this.wantStars = !!opts.stars;          /* 子夜星野（仅 Hero 开启） */
    this.stars = null;
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
    if (opts.rain && !REDUCED) this._rain();
    if (opts.ambient && !REDUCED) this._ambientRain();
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
    if (this.wantStars) this._makeStars();
  };
  Tank.prototype._makeStars = function () {
    var cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    var n = Math.max(24, Math.min(150, Math.round(cw * ch / 9000)));
    this.stars = [];
    for (var i = 0; i < n; i++) {
      this.stars.push({
        x: Math.random() * cw,
        y: Math.random() * ch * 0.9,
        r: 0.4 + Math.random() * 0.9,
        a: 0.18 + Math.random() * 0.5
      });
    }
  };
  Tank.prototype._drawStars = function (ctx) {
    var s = this.stars;
    if (!s) return;
    ctx.fillStyle = '#e8e2d4';
    for (var i = 0; i < s.length; i++) {
      ctx.globalAlpha = s[i].a;
      ctx.beginPath();
      ctx.arc(s[i].x, s[i].y, s[i].r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
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
  Tank.prototype._rain = function () {
    var self = this;
    var drops = 5 + Math.floor(Math.random() * 3);
    for (var i = 0; i < drops; i++) {
      (function (i) {
        setTimeout(function () {
          var gx = Math.round(self.w * (0.15 + Math.random() * 0.7));
          var gy = Math.round(self.h * (0.25 + Math.random() * 0.5));
          self.disturb(gx, gy, 5, 3);
        }, 350 + i * 380 + Math.random() * 220);
      })(i);
    }
  };
  Tank.prototype._ambientRain = function () {
    var self = this;
    setInterval(function () {
      if (!self.visible || !self.running || !self.w) return;
      var gx = Math.round(self.w * (0.08 + Math.random() * 0.84));
      var gy = Math.round(self.h * (0.15 + Math.random() * 0.7));
      self.disturb(gx, gy, 3.2 + Math.random() * 2.4, 3);
    }, 3400);
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
  Tank.prototype._magAt = function (fx, fy) {
    var w = this.w, h = this.h, cur = this.cur;
    var x = Math.round(fx), y = Math.round(fy);
    if (x < 1) x = 1; else if (x > w - 2) x = w - 2;
    if (y < 1) y = 1; else if (y > h - 2) y = h - 2;
    var i = y * w + x;
    return Math.abs(cur[i + 1] - cur[i - 1]) + Math.abs(cur[i + w] - cur[i - w]);
  };
  Tank.prototype._render = function () {
    var w = this.w, h = this.h, cur = this.cur, data = this.img.data;
    var st = themeState();
    var dark = st.dark;
    var t = this.t;
    var sat = dark ? 0.85 : 0.62;
    var lum = dark ? 0.60 : 0.40;
    var rgb = [0, 0, 0];
    for (var y = 1; y < h - 1; y++) {
      var row = y * w;
      for (var x = 1; x < w - 1; x++) {
        var i = row + x;
        var o = i * 4;
        var gx = cur[i + 1] - cur[i - 1];
        var gy = cur[i + w] - cur[i - w];
        var mag = Math.abs(gx) + Math.abs(gy);
        if (mag < 0.02) { data[o + 3] = 0; continue; }
        var a = Math.min(1, mag * 1.4);
        var len = Math.sqrt(gx * gx + gy * gy) || 1;
        var dx = gx / len, dy = gy / len;
        var aO = Math.min(1, this._magAt(x + dx * CH_OFF, y + dy * CH_OFF) * 1.4);
        var aI = Math.min(1, this._magAt(x - dx * CH_OFF, y - dy * CH_OFF) * 1.4);
        var hue = cur[i] * 24 + t * DRIFT;
        var R = 0, G = 0, B = 0;
        hsl2rgb(hue + SPREAD, sat, lum, rgb);
        R += rgb[0] * aO; G += rgb[1] * aO; B += rgb[2] * aO;
        hsl2rgb(hue, sat, lum, rgb);
        R += rgb[0] * a; G += rgb[1] * a; B += rgb[2] * a;
        hsl2rgb(hue - SPREAD, sat, lum, rgb);
        R += rgb[0] * aI; G += rgb[1] * aI; B += rgb[2] * aI;
        if (!dark) {
          R = R * 0.6 + 62 * 0.4; G = G * 0.6 + 56 * 0.4; B = B * 0.6 + 50 * 0.4;
        }
        var aMax = Math.max(a, aO, aI);
        data[o] = R > 255 ? 255 : R;
        data[o + 1] = G > 255 ? 255 : G;
        data[o + 2] = B > 255 ? 255 : B;
        data[o + 3] = Math.round(aMax * (dark ? 150 : 100));
      }
    }
    this.offCtx.putImageData(this.img, 0, 0);
    var cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    var ctx = this.ctx;
    ctx.clearRect(0, 0, cw, ch);
    if (this.wantStars && dark && st.scene === 'midnight') this._drawStars(ctx);
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.off, 0, 0, w, h, 0, 0, cw, ch);
    ctx.globalCompositeOperation = 'source-over';
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
    window.SpectrumRipple.mount(hero, { rain: true, ambient: true, stars: true, interactive: true, cell: 5 });
  }
})();