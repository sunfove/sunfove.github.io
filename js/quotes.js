/**
 * Spectrum · 今日之光 — 随机物理学箴言
 */
(function () {
  var quotes = [
    { text: '光，是宇宙的信使。它穿越了亿万年，只为抵达你的眼睛。', author: 'Carl Sagan 意译' },
    { text: '我们称之为光的东西，是一个更深层实在的影子——我们看见的，只是电磁之海中最浅的一捧涟漪。', author: 'Sunfove' },
    { text: '光线在引力场中弯曲，正如同旅人在沙漠中绕行。空间告诉光如何走，光告诉空间如何弯。', author: 'John Wheeler 意译' },
    { text: '每一个光子都记得它走过的每一条路径——只是大多数相互抵消，只剩下最短的那条。', author: 'Feynman 意译' },
    { text: '凿户牖以为室，当其无，有室之用。故有之以为利，无之以为用。', author: '老子《道德经》' },
    { text: 'Nature uses only the longest threads to weave her patterns, so that each small piece of her fabric reveals the organization of the entire tapestry.', author: 'Richard Feynman' },
    { text: '光在大气中的每一次散射都是天空写给大地的信。瑞利散射是短笺，米氏散射是长信。', author: 'Sunfove' },
    { text: '在纳米尺度上，光不再是一条直线——它变得柔软，可以弯曲、折叠、甚至停下脚步。这就是超表面的世界。', author: 'Sunfove' },
    { text: '不要把光看作粒子，也不要把光看作波。把它看作一种存在——一种同时属于两个世界的存在。', author: 'Niels Bohr 意译' },
    { text: '临万物之镜，而不随物迁。光如是，心亦如是。', author: '庄子 意' },
    { text: 'You are not a drop in the ocean. You are the entire ocean in a drop.', author: 'Rumi' },
    { text: '夫光者，无形而有象，不触而能感。其理至妙，其用至广。', author: '《墨经》光学八条 意' },
    { text: '光速不变不是爱因斯坦的假设——而是宇宙的法则。我们只是花了 1905 年才发现它。', author: 'Sunfove' },
    { text: 'The most beautiful experience we can have is the mysterious. It is the fundamental emotion that stands at the cradle of true art and true science.', author: 'Albert Einstein' },
    { text: '从蜡烛到激光，人类驯服光的旅程不过两千年。从激光到量子光，我们走了六十年。下一步去哪？', author: 'Sunfove' }
  ];
  var container = document.getElementById('lightQuote');
  if (!container) return;
  var idx = Math.floor(Math.random() * quotes.length);
  var q = quotes[idx];
  container.innerHTML =
    '<blockquote class="light-quote-text">' + q.text + '</blockquote>' +
    '<cite class="light-quote-author">—— ' + q.author + '</cite>';
  var btn = document.getElementById('lightQuoteBtn');
  if (btn) {
    btn.addEventListener('click', function () {
      var newIdx;
      do { newIdx = Math.floor(Math.random() * quotes.length); } while (newIdx === idx && quotes.length > 1);
      idx = newIdx;
      var nq = quotes[idx];
      container.innerHTML =
        '<blockquote class="light-quote-text">' + nq.text + '</blockquote>' +
        '<cite class="light-quote-author">—— ' + nq.author + '</cite>';
    });
  }
})();