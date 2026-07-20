/* Spectrum · 那年今日：列出历年同月日的文章；无精确匹配时取周年历最近的 3 天 */
(function () {
  'use strict';

  var box = document.getElementById('on-this-day');
  if (!box) return;
  var list = document.getElementById('otdList');
  var dateEl = document.getElementById('otdDate');
  var noteEl = document.getElementById('otdNote');
  var url = (window.SPECTRUM_OTD && window.SPECTRUM_OTD.url) || '/on-this-day-data.json';

  /* 以平年计算月-日 → 年积日，做环形距离 */
  var MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function doy(md) {
    var m = +md.slice(0, 2), d = +md.slice(3, 5), n = 0;
    for (var i = 0; i < m - 1; i++) n += MDAYS[i];
    return n + d;
  }
  function circDist(a, b) {
    var d = Math.abs(doy(a) - doy(b));
    return Math.min(d, 365 - d);
  }

  var now = new Date();
  var mm = now.getMonth() + 1, dd = now.getDate();
  var today = (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd;
  if (dateEl) dateEl.textContent = mm + '月' + dd + '日';

  fetch(url)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (rows) {
      var exact = rows.filter(function (r) { return r.d === today; });
      var pick;
      if (exact.length) {
        pick = exact.sort(function (a, b) { return b.y - a.y; });
        if (noteEl) noteEl.textContent = '今日';
      } else {
        pick = rows.slice().sort(function (a, b) {
          return circDist(a.d, today) - circDist(b.d, today) || b.y - a.y;
        }).slice(0, 3);
        if (noteEl) noteEl.textContent = '近日';
      }
      if (!pick.length) throw new Error('empty');
      list.innerHTML = '';
      pick.forEach(function (p) {
        var li = document.createElement('li');
        var y = document.createElement('span');
        y.className = 'otd-year chip-' + (p.k || 'blue');
        y.textContent = p.y;
        var a = document.createElement('a');
        a.className = 'otd-link';
        a.href = p.u;
        a.textContent = p.t;
        var d = document.createElement('span');
        d.className = 'otd-md';
        d.textContent = p.d.replace('-', ' · ');
        li.appendChild(y);
        li.appendChild(a);
        li.appendChild(d);
        list.appendChild(li);
      });
    })
    .catch(function () {
      box.style.display = 'none';
    });
})();
