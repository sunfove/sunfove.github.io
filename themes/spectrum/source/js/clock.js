/* Spectrum · 北京时间显示（每分钟更新） */
(function () {
  'use strict';

  var timeEl = document.getElementById('navClockTime');
  if (!timeEl) return;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function tick() {
    var now = new Date();
    var bj = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
    var h = bj.getHours(), m = bj.getMinutes();
    timeEl.textContent = pad(h) + ':' + pad(m);
  }

  tick();
  var delay = 60000 - (Date.now() % 60000) + 120;
  setTimeout(function () {
    tick();
    setInterval(tick, 60000);
  }, delay);
})();
