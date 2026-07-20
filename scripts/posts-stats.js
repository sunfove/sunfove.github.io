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
