(function () {
  'use strict';
  var input = document.getElementById('searchInput');
  var status = document.getElementById('searchStatus');
  var results = document.getElementById('searchResults');
  if (!input || !results) return;
  var entries = [];
  function text(node, tag) {
    var n = node.getElementsByTagName(tag)[0];
    return n ? n.textContent : '';
  }
  fetch('/local-search.xml')
    .then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.text();
    })
    .then(function (xml) {
      var doc = new DOMParser().parseFromString(xml, 'text/xml');
      var list = doc.getElementsByTagName('entry');
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        var link = '';
        var linkNode = e.getElementsByTagName('link')[0];
        if (linkNode) link = linkNode.getAttribute('href') || linkNode.textContent || '';
        entries.push({
          title: text(e, 'title'),
          link: link,
          content: text(e, 'content').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        });
      }
      status.textContent = '索引就绪，共 ' + entries.length + ' 篇。';
      var q = new URLSearchParams(location.search).get('q');
      if (q) { input.value = q; run(); }
      input.focus();
    })
    .catch(function () {
      status.textContent = '搜索索引加载失败（/local-search.xml 不可用）。';
    });
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function snippet(content, kw) {
    var i = content.toLowerCase().indexOf(kw.toLowerCase());
    if (i < 0) return escapeHtml(content.slice(0, 120)) + '…';
    var start = Math.max(0, i - 40);
    var seg = content.slice(start, i + kw.length + 80);
    return (start > 0 ? '…' : '') + escapeHtml(seg).replace(
      new RegExp('(&[a-z]+;)|(' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'),
      function (m, entity, hit) { return entity || '<mark>' + hit + '</mark>'; }
    ) + '…';
  }
  function run() {
    var kw = input.value.trim();
    if (!kw) { results.innerHTML = ''; status.textContent = '索引就绪，共 ' + entries.length + ' 篇。'; return; }
    var lower = kw.toLowerCase();
    var hits = entries.filter(function (e) {
      return e.title.toLowerCase().indexOf(lower) >= 0 || e.content.toLowerCase().indexOf(lower) >= 0;
    }).slice(0, 30);
    status.textContent = '找到 ' + hits.length + ' 条与「' + kw + '」相关的结果';
    results.innerHTML = hits.map(function (e) {
      return '<li class="search-hit"><a href="' + escapeHtml(e.link) + '">' + escapeHtml(e.title) + '</a>' +
        '<p>' + snippet(e.content, kw) + '</p></li>';
    }).join('');
  }
  var timer = null;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(run, 160);
  });
})();