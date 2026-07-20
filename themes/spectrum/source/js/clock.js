/* Spectrum · 北京时日晷：UTC+8 时钟（每分钟更新）+ 24 小时日/月轮盘
   轮盘每 24 小时旋转一周：正午日在中天，子夜月在中天；6-18 日出于地平，其余月出于地平。 */
(function () {
  'use strict';

  var box = document.getElementById('navClock');
  if (!box) return;
  var timeEl = document.getElementById('navClockTime');
  var sky = document.getElementById('navDialSky');
  var sun = document.getElementById('ndSun');
  var moon = document.getElementById('ndMoon');

  function bjNow() {
    var now = new Date();
    return new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function tick() {
    var bj = bjNow();
    var h = bj.getHours(), m = bj.getMinutes();
    if (timeEl) timeEl.textContent = pad(h) + ':' + pad(m);
    /* 正午 0°（日在顶），每小时 15°，每分钟 0.25° */
    if (sky) sky.setAttribute('transform', 'rotate(' + (((h - 12) * 15) + m * 0.25) + ' 13 13)');
    var day = h >= 6 && h < 18;
    if (sun) sun.setAttribute('opacity', day ? '1' : '0.18');
    if (moon) moon.setAttribute('opacity', day ? '0.18' : '1');
    box.setAttribute('title', '北京时间 ' + pad(h) + ':' + pad(m));
  }

  tick();
  /* 对齐到下一分钟边界后每分钟更新 */
  var delay = 60000 - (Date.now() % 60000) + 120;
  setTimeout(function () {
    tick();
    setInterval(tick, 60000);
  }, delay);
})();
