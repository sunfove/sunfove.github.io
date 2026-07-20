/**
 * Spectrum · 涟漪池引擎（色散光谱环 + 子夜星野）
 * 首页 Hero 与实验室双缝干涉共用。纯 Canvas 2D，无依赖。
 */
(function () {
  'use strict';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPREAD = 34;
  var DRIFT = 0.10;
  var CH_OFF = 1.7;
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
    this.cell = opts.cell || 5;
    this.damping = opts.damping || 0.986;
    this.sources = (opts.sources || []).slice();
    this.interactive = opts.interactive !== false;
    this.wantStars = !!opts.stars;
    this.stars = null;
    this.t = 0;
    this.running = false;
    this._onFrame = this._onFrame.bind(this);
    this._onPointer = this._onPointer.bind(this);
    var self = this;
    this._resize = function () {
      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      var w = rect.width, h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      self.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      self.cols = Math.ceil(w / self.cell);
      self.rows = Math.ceil(h / self.cell);
      self.w = w; self.h = h;
      self._initGrid();
    };
    this._resize();
    window.addEventListener('resize', this._resize);
    if (this.interactive) {
      canvas.addEventListener('pointermove', this._onPointer);
      canvas.addEventListener('pointerdown', this._onPointer);
      canvas.addEventListener('pointerleave', function () { self._mx = self._my = -1000; });
    }
  }
  Tank.prototype._initGrid = function () {
    var cols = this.cols, rows = this.rows;
    this.buf0 = new Float32Array(cols * rows);
    this.buf1 = new Float32Array(cols * rows);
    this.buf2 = new Float32Array(cols * rows);
    for (var i = 0; i < cols * rows; i++) {
      this.buf0[i] = this.buf1[i] = this.buf2[i] = 0;
    }
  };
  Tank.prototype._onPointer = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    var cx = (e.clientX - rect.left) / this.cell;
    var cy = (e.clientY - rect.top) / this.cell;
    var cols = this.cols, rows = this.rows;
    var r = 4;
    var x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(cols - 1, Math.ceil(cx + r));
    var y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(rows - 1, Math.ceil(cy + r));
    for (var x = x0; x <= x1; x++) {
      for (var y = y0; y <= y1; y++) {
        var dx = x - cx, dy = y - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r) {
          var v = e.type === 'pointerdown' ? 1.8 : 0.7;
          this.buf0[y * cols + x] = v * (1 - dist / r);
        }
      }
    }
  };
  Tank.prototype._onFrame = function () {
    if (!this.running) return;
    this.t++;
    var cols = this.cols, rows = this.rows;
    var b0 = this.buf0, b1 = this.buf1, b2 = this.buf2;
    var damp = this.damping;
    for (var y = 1; y < rows - 1; y++) {
      for (var x = 1; x < cols - 1; x++) {
        var i = y * cols + x;
        b2[i] = (b0[i - 1] + b0[i + 1] + b0[i - cols] + b0[i + cols]) / 2 - b1[i];
        b2[i] *= damp;
      }
    }
    var tmp = b0; b0 = b1; b1 = b2; b2 = tmp;
    this.buf0 = b0; this.buf1 = b1; this.buf2 = b2;
    this._draw();
    requestAnimationFrame(this._onFrame);
  };
  Tank.prototype._draw = function () {
    var ctx = this.ctx, w = this.w, h = this.h;
    var cols = this.cols, rows = this.rows;
    var b1 = this.buf1, cell = this.cell;
    var ts = themeState();
    var dark = ts.dark, scene = ts.scene;
    ctx.clearRect(0, 0, w, h);
    var img = ctx.createImageData(w, h);
    var data = img.data;
    var rgb = [0, 0, 0];
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var v = b1[y * cols + x];
        var abs = Math.abs(v);
        if (abs < 0.008) continue;
        var px = x * cell, py = y * cell;
        var hue = (180 + v * 800 + this.t * DRIFT) % 360;
        if (dark) {
          var l = Math.min(abs * 5, 0.6);
          hsl2rgb(hue, 0.7, l, rgb);
          var alpha = Math.min(abs * 400, 200);
          for (var dy = 0; dy < cell && (py + dy) < h; dy++) {
            for (var dx = 0; dx < cell && (px + dx) < w; dx++) {
              var di = ((py + dy) * w + (px + dx)) * 4;
              data[di] = Math.min(255, data[di] + rgb[0]);
              data[di + 1] = Math.min(255, data[di + 1] + rgb[1]);
              data[di + 2] = Math.min(255, data[di + 2] + rgb[2]);
              data[di + 3] = Math.min(255, data[di + 3] + alpha);
            }
          }
        } else {
          var gray = Math.floor(45 + abs * 15);
          var a2 = Math.min(abs * 60, 60);
          for (var dy2 = 0; dy2 < cell && (py + dy2) < h; dy2++) {
            for (var dx2 = 0; dx2 < cell && (px + dx2) < w; dx2++) {
              var di2 = ((py + dy2) * w + (px + dx2)) * 4;
              data[di2] = Math.min(255, data[di2] + gray);
              data[di2 + 1] = Math.min(255, data[di2 + 1] + gray);
              data[di2 + 2] = Math.min(255, data[di2 + 2] + gray);
              data[di2 + 3] = Math.min(255, data[di2 + 3] + a2);
            }
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    if (Math.random() < 0.015) {
      var rx = Math.floor(Math.random() * cols);
      var ry = Math.floor(Math.random() * rows);
      for (var rr = -2; rr <= 2; rr++) {
        for (var rc = -2; rc <= 2; rc++) {
          var ri = Math.min(rows - 1, Math.max(0, ry + rr)) * cols + Math.min(cols - 1, Math.max(0, rx + rc));
          var rd = Math.sqrt(rr * rr + rc * rc);
          if (rd < 2.5) this.buf0[ri] = 0.6 * (1 - rd / 2.5);
        }
      }
    }
  };
  Tank.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this._onFrame();
  };
  Tank.prototype.stop = function () {
    this.running = false;
  };
  var tankEl = document.getElementById('rippleTank');
  if (tankEl) {
    var tank = new Tank(tankEl, { stars: true });
    tank.start();
    window.addEventListener('beforeunload', function () { tank.stop(); });
    if (document.addEventListener) {
      document.addEventListener('visibilitychange', function () {
        document.hidden ? tank.stop() : tank.start();
      });
    }
  }
  window.SpectrumRipple = Tank;
})();