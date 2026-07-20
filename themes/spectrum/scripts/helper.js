/**
 * Spectrum 主题辅助函数
 * - 分类 → 光谱色确定性映射
 * - 字数 / 阅读时长估计
 * - deploy_extras 实验室条目探测
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SPECTRUM_KEYS = ['violet', 'blue', 'cyan', 'green', 'amber', 'red', 'yellow'];
const SPECTRUM_COLORS = {
  violet: '#6d28d9',
  blue: '#2563eb',
  cyan: '#0891b2',
  green: '#2c6469',
  amber: '#df6536',
  red: '#b20155',
  yellow: '#ebb137'
};

// 规范 §2：分类 → 光谱映射（确定性）
const CATEGORY_MAP = {
  '光学': 'blue', '光学工程': 'blue', '光学理论': 'blue',
  'Optical Engineering': 'blue', 'Optoelectronics': 'blue', '光学': 'blue',
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
  if (CATEGORY_MAP[name]) return CATEGORY_MAP[name];
  return SPECTRUM_KEYS[hashName(String(name)) % SPECTRUM_KEYS.length];
}

hexo.extend.helper.register('catColorKey', catColorKey);
hexo.extend.helper.register('catColor', name => SPECTRUM_COLORS[catColorKey(name)]);
hexo.extend.helper.register('spectrumColors', () => SPECTRUM_COLORS);

// 纯文本化
function stripHtml(html) {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-zA-Z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
hexo.extend.helper.register('stripHtml', stripHtml);

function wordCountOf(post) {
  const text = stripHtml(post && post.content);
  const cjk = (text.match(/[一-鿿]/g) || []).length;
  const latin = (text.match(/[a-zA-Z0-9]+/g) || []).length;
  return cjk + latin;
}
hexo.extend.helper.register('wordCount', wordCountOf);
hexo.extend.helper.register('readingTime', post => Math.max(1, Math.round(wordCountOf(post) / 300)));

hexo.extend.helper.register('plainExcerpt', function (post, len) {
  const raw = (post.description && String(post.description).trim()) ||
    (post.excerpt && stripHtml(post.excerpt)) ||
    stripHtml(post.content);
  const limit = len || 140;
  return raw.length > limit ? raw.slice(0, limit) + ' …' : raw;
});

// 相关文章：同分类、按日期倒序、排除自身
hexo.extend.helper.register('relatedPosts', function (post, count) {
  const n = count || 3;
  const cats = (post.categories && post.categories.toArray()) || [];
  if (!cats.length) return [];
  const catId = cats[0]._id;
  return hexo.locals.get('posts').toArray()
    .filter(p => p._id !== post._id &&
      (p.categories.toArray() || []).some(c => c._id === catId))
    .sort((a, b) => b.date - a.date)
    .slice(0, n);
});

// 探测 deploy_extras 下的实验室条目（构建期）
hexo.extend.helper.register('labExtras', function () {
  const base = path.join(hexo.base_dir, 'deploy_extras');
  const desc = {
    ripples: ['涟漪池', '早期 Canvas 水波模拟实验'],
    arxiv: ['arXiv 速览', '超表面 / 纳米光子学论文索引页']
  };
  const out = [];
  if (!fs.existsSync(base)) return out;
  for (const name of fs.readdirSync(base)) {
    const dir = path.join(base, name);
    try {
      if (fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, 'index.html'))) {
        const meta = desc[name] || [name, ''];
        out.push({ name, path: '/' + name + '/', title: meta[0], desc: meta[1] });
      }
    } catch (e) { /* ignore */ }
  }
  return out;
});
