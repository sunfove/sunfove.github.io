/**
 * 发布仪表盘数据生成器
 * 构建期扫描全部文章，输出 posts-stats.json 供 /stats 页渲染
 */
'use strict';

function countWords(html) {
  const text = (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-zA-Z#0-9]+;/g, ' ');
  const cjk = (text.match(/[一-鿿]/g) || []).length;
  const latin = (text.match(/[a-zA-Z0-9]+/g) || []).length;
  return cjk + latin;
}

function dayKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

hexo.extend.generator.register('posts_stats', function (locals) {
  const posts = locals.posts.toArray().filter(p => p.date);
  const now = new Date();

  const days = {};    // 'YYYY-MM-DD' -> count（仅记录有文章的日期）
  const months = {};  // 'YYYY-MM' -> count
  const categories = {}; // name -> count
  let totalWords = 0;

  for (const p of posts) {
    const d = p.date.toDate ? p.date.toDate() : new Date(p.date);
    const dk = dayKey(d);
    const mk = dk.slice(0, 7);
    days[dk] = (days[dk] || 0) + 1;
    months[mk] = (months[mk] || 0) + 1;
    totalWords += countWords(p.content);
    const cats = (p.categories && p.categories.toArray()) || [];
    if (cats.length) {
      const name = cats[0].name;
      categories[name] = (categories[name] || 0) + 1;
    }
  }

  // 近一年（含今天共 371 天，便于按周对齐）热力图序列
  const heatmapEnd = dayKey(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 370);

  const data = {
    generated: now.toISOString(),
    totalPosts: posts.length,
    totalWords,
    heatmapEnd,
    heatmapStart: dayKey(start),
    days,
    months,
    categories
  };

  return { path: 'posts-stats.json', data: JSON.stringify(data) };
});

/**
 * 那年今日数据生成器
 * 输出全部文章的 [月-日, 年, 标题, 链接, 分类, 光谱色键]，
 * 供首页「那年今日」按访客本地日期过滤
 */
const SPECTRUM_KEYS = ['violet', 'blue', 'cyan', 'green', 'amber', 'red', 'yellow'];
// 与 themes/spectrum/scripts/helper.js 的分类→光谱映射保持一致
const OTD_CATEGORY_MAP = {
  '光学': 'blue', '光学工程': 'blue', '光学理论': 'blue',
  'Optical Engineering': 'blue', 'Optoelectronics': 'blue',
  '光通信': 'amber', '光纤': 'amber',
  '物理原理': 'violet', '物理硬核': 'violet', '硬核物理': 'violet',
  'Physics': 'violet', '量子算法': 'violet', '麦克斯韦方程': 'violet',
  '超表面': 'cyan', '超表面技术': 'cyan', 'Metasurface': 'cyan',
  '半导体': 'green', '半导体工艺': 'green',
  '优化算法': 'red', '算法与数学': 'red',
  'GDS': 'violet',
  '生活物理': 'yellow', 'English Learning': 'green',
  '科研笔记': 'cyan', 'Technical Deep Dive': 'cyan', '技术深度解析': 'cyan', '技术深度': 'cyan',
  'Theoretical Foundations': 'violet', 'Computational Mathematics': 'red',
  'Computer Science': 'blue', 'Artificial Intelligence': 'green', 'Machine Learning': 'green',
  'Theoretical Computer Science': 'violet'
};

function hashName(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function catColorKey(name) {
  if (!name) return 'blue';
  if (OTD_CATEGORY_MAP[name]) return OTD_CATEGORY_MAP[name];
  return SPECTRUM_KEYS[hashName(String(name)) % SPECTRUM_KEYS.length];
}

hexo.extend.generator.register('on_this_day', function (locals) {
  const root = hexo.config.root || '/';
  const rows = [];
  for (const p of locals.posts.toArray()) {
    if (!p.date || !p.title) continue;
    // p.date 是 Moment（站点时区），避免 toDate() 后受构建机时区影响
    const md = p.date.format ? p.date.format('MM-DD') : dayKey(new Date(p.date)).slice(5);
    const yy = p.date.format ? p.date.format('YYYY') : String(new Date(p.date).getFullYear());
    const cat = ((p.categories && p.categories.toArray()) || [])[0];
    rows.push({
      d: md,
      y: Number(yy),
      t: String(p.title),
      u: root + p.path,
      c: cat ? cat.name : '',
      k: catColorKey(cat ? cat.name : '')
    });
  }
  rows.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : b.y - a.y));
  return { path: 'on-this-day-data.json', data: JSON.stringify(rows) };
});
