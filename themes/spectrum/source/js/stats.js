/* Spectrum · 发布仪表盘：读取 posts-stats.json，纯 SVG 手绘 */
(function () {
  'use strict';

  var COLORS = {
    violet: '#6d28d9', blue: '#2563eb', cyan: '#0891b2', green: '#2c6469',
    amber: '#df6536', red: '#b20155', yellow: '#ebb137'
  };
  var KEYS = ['violet', 'blue', 'cyan', 'green', 'amber', 'red', 'yellow'];

  var CATEGORY_MAP = {
    '光学': 'blue', '光学工程': 'blue', '光学理论': 'blue',
    'Optical Engineering': 'blue', 'Optoelectronics': 'blue', '光通信': 'amber',
    '物理原理': 'violet', '物理硬核': 'violet', '硬核物理': 'violet', 'Physics': 'violet',
    '量子算法': 'violet', '麦克斯韦方程': 'violet',
    '超表面': 'cyan', '超表面技术': 'cyan', 'Metasurface': 'cyan',
    '半导体': 'green', '半导体工艺': 'green',
    '优化算法': 'red', '算法与数学': 'red',
    '生活物理': 'yellow', 'English Learning': 'green',
    '科研笔记': 'cyan', 'Technical Deep Dive': 'cyan', '技术深度解析': 'cyan', '技术深度': 'cyan',
    'Theoretical Foundations': 'violet', 'Computational Mathematics': 'red',
    'Computer Science': 'blue', 'Artificial Intelligence': 'green', 'Machine Learning': 'green',
    'Theoretical Computer Science': 'violet'
  };

  function colorKey(name) {
    if (CATEGORY_MAP[name]) return CATEGORY_MAP[name];
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return KEYS[h % KEYS.length];
  }

  function el(tag, attrs) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function heatColor(n) {
    if (!n) return 'hl0';
    if (n === 1) return 'hl1';
    if (n === 2) return 'hl2';
    if (n === 3) return 'hl3';
    return 'hl4';
  }

  fetch('/posts-stats.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      /* ---- 顶部数字 ---- */
      var yearAgo = new Date(); yearAgo.setDate(yearAgo.getDate() - 364);
      var yearPosts = 0, maxStreak = 0, streak = 0;
      var d = new Date(yearAgo);
      var end = new Date();
      while (d <= end) {
        var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        var n = data.days[key] || 0;
        yearPosts += n;
        streak = n ? streak + 1 : 0;
        if (streak > maxStreak) maxStreak = streak;
        d.setDate(d.getDate() + 1);
      }
      var nums = {
        totalPosts: data.totalPosts,
        totalWords: data.totalWords >= 10000 ? (data.totalWords / 10000).toFixed(1) + ' 万' : data.totalWords,
        yearPosts: yearPosts,
        streak: maxStreak
      };
      document.querySelectorAll('#statsNumbers .stat-num').forEach(function (s) {
        s.textContent = nums[s.getAttribute('data-key')];
      });

      /* ---- 热力图（GitHub 风格，周为列） ---- */
      var wrap = document.getElementById('heatmapWrap');
      var cell = 11, gap = 3, step = cell + gap;
      var start = new Date(yearAgo);
      start.setDate(start.getDate() - start.getDay()); /* 对齐到周日 */
      var weeks = Math.ceil((end - start) / (7 * 86400000)) + 1;
      var svgW = weeks * step + 34, svgH = 7 * step + 26;
      var svg = el('svg', { width: svgW, height: svgH, viewBox: '0 0 ' + svgW + ' ' + svgH });
      var dayLabels = ['日', '一', '二', '三', '四', '五', '六'];
      for (var wd = 0; wd < 7; wd += 2) {
        var t = el('text', { x: 0, y: wd * step + cell + 12, 'font-size': 9, fill: 'currentColor', opacity: 0.45 });
        t.textContent = dayLabels[wd + 1] || '';
        svg.appendChild(t);
      }
      var ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
      var dd = new Date(start), col = 0;
      var lastMonth = -1;
      while (dd <= end) {
        var m = dd.getMonth();
        if (m !== lastMonth) {
          var mt = el('text', { x: 18 + col * step, y: 10, 'font-size': 9, fill: ink, opacity: 0.5 });
          mt.textContent = (m + 1) + '月';
          svg.appendChild(mt);
          lastMonth = m;
        }
        for (var row = 0; row < 7 && dd <= end; row++) {
          var key2 = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0');
          var count = data.days[key2] || 0;
          var rect = el('rect', {
            x: 18 + col * step, y: row * step + 16,
            width: cell, height: cell, rx: 2,
            'class': 'heatmap-cell ' + heatColor(count)
          });
          var title = el('title', {});
          title.textContent = key2 + '：' + count + ' 篇';
          rect.appendChild(title);
          svg.appendChild(rect);
          dd.setDate(dd.getDate() + 1);
        }
        col++;
      }
      wrap.appendChild(svg);

      /* ---- 分类横条 ---- */
      var bars = document.getElementById('catBars');
      var cats = Object.keys(data.categories).map(function (k) {
        return { name: k, n: data.categories[k] };
      }).sort(function (a, b) { return b.n - a.n; });
      var top = cats.slice(0, 10);
      var rest = cats.slice(10);
      if (rest.length) {
        top.push({ name: '其他', n: rest.reduce(function (s, c) { return s + c.n; }, 0) });
      }
      var max = top.length ? top[0].n : 1;
      top.forEach(function (c) {
        var rowDiv = document.createElement('div');
        rowDiv.className = 'catbar-row';
        var name = document.createElement('span');
        name.className = 'catbar-name';
        name.textContent = c.name;
        var track = document.createElement('div');
        track.className = 'catbar-track';
        var fill = document.createElement('div');
        fill.className = 'catbar-fill';
        fill.style.background = COLORS[colorKey(c.name)];
        var num = document.createElement('span');
        num.className = 'catbar-num';
        num.textContent = c.n;
        track.appendChild(fill);
        rowDiv.appendChild(name);
        rowDiv.appendChild(track);
        rowDiv.appendChild(num);
        bars.appendChild(rowDiv);
        requestAnimationFrame(function () {
          fill.style.width = Math.max(2, c.n / max * 100) + '%';
        });
      });

      /* ---- 月度柱状（近 12 个月） ---- */
      var mb = document.getElementById('monthBars');
      var months = [];
      var now = new Date();
      for (var i = 11; i >= 0; i--) {
        var dm = new Date(now.getFullYear(), now.getMonth() - i, 1);
        var mk = dm.getFullYear() + '-' + String(dm.getMonth() + 1).padStart(2, '0');
        months.push({ key: mk, label: (dm.getMonth() + 1) + '月', n: data.months[mk] || 0 });
      }
      var mmax = Math.max.apply(null, months.map(function (m) { return m.n; }).concat([1]));
      var bw = 46, bgap = 18, bh = 150;
      var msvg = el('svg', {
        width: months.length * (bw + bgap), height: bh + 34,
        viewBox: '0 0 ' + months.length * (bw + bgap) + ' ' + (bh + 34)
      });
      months.forEach(function (m, i2) {
        var hgt = Math.max(2, m.n / mmax * bh);
        var rect = el('rect', {
          x: i2 * (bw + bgap), y: bh - hgt, width: bw, height: hgt, rx: 2,
          fill: COLORS[KEYS[i2 % KEYS.length]], opacity: 0.85
        });
        var tt = el('title', {});
        tt.textContent = m.key + '：' + m.n + ' 篇';
        rect.appendChild(tt);
        msvg.appendChild(rect);
        var nt = el('text', { x: i2 * (bw + bgap) + bw / 2, y: bh - hgt - 6, 'text-anchor': 'middle', 'font-size': 11, fill: ink });
        nt.textContent = m.n || '';
        msvg.appendChild(nt);
        var lt = el('text', { x: i2 * (bw + bgap) + bw / 2, y: bh + 18, 'text-anchor': 'middle', 'font-size': 10, fill: ink, opacity: 0.55 });
        lt.textContent = m.label;
        msvg.appendChild(lt);
      });
      mb.appendChild(msvg);
    })
    .catch(function () {
      var s = document.getElementById('statsNumbers');
      if (s) s.insertAdjacentHTML('afterend', '<p class="search-status">统计数据加载失败。</p>');
    });
})();
