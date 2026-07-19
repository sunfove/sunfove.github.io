/**
 * Arxiv 论文速览生成器
 * 每次 build 时拉取最新超表面相关论文，生成 JSON 数据文件 + 静态展示页
 */

'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');

const QUERIES = [
  { name: '超表面', query: 'all:metasurface' },
  { name: '纳米光子学', query: 'all:nanophotonics' },
  { name: '计算光学', query: 'all:computational+AND+all:imaging+AND+all:optics' },
];

const MAX_PER_QUERY = 6;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 小时缓存

function arxivFetch(queryStr, maxResults) {
  return new Promise((resolve, reject) => {
    const url = `https://export.arxiv.org/api/query?search_query=${queryStr}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseAtom(xml) {
  const papers = [];
  const entries = xml.split('<entry>').slice(1);
  for (const entry of entries) {
    const id = (entry.match(/<id>([^<]+)<\/id>/) || [])[1] || '';
    const title = (entry.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
    const summary = (entry.match(/<summary>([^<]+)<\/summary>/) || [])[1] || '';
    const published = (entry.match(/<published>([^<]+)<\/published>/) || [])[1] || '';
    const arxivId = id.replace('http://arxiv.org/abs/', '').replace('https://arxiv.org/abs/', '');
    const pdfLink = (entry.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/) || [])[1] ||
      `https://arxiv.org/pdf/${arxivId}`;
    const absLink = (entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/) || [])[1] ||
      `https://arxiv.org/abs/${arxivId}`;

    // 提取 authors
    const authorMatches = entry.match(/<author>[\s\S]*?<\/author>/g) || [];
    const authors = authorMatches.map(a => {
      const name = (a.match(/<name>([^<]+)<\/name>/) || [])[1] || '';
      return name;
    });

    // 分类
    const catMatches = entry.match(/<category term="([^"]+)"/g) || [];
    const categories = catMatches.map(c => c.match(/term="([^"]+)"/)?.[1]).filter(Boolean);

    papers.push({
      id: arxivId,
      title: title.replace(/\s+/g, ' ').trim(),
      summary: summary.replace(/\s+/g, ' ').trim().substring(0, 400),
      authors: authors.slice(0, 5),
      date: published,
      absLink,
      pdfLink,
      categories
    });
  }
  return papers;
}

hexo.extend.generator.register('arxiv_papers', async function (locals) {
  const outputPath = path.join(this.public_dir, 'arxiv-papers.json');
  const cachePath = path.join(__dirname, '..', '.arxiv-cache.json');

  // 检查缓存
  let cached = null;
  try {
    if (fs.existsSync(cachePath)) {
      cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      if (Date.now() - cached.ts < CACHE_TTL) {
        console.log('  📡 arxiv: 使用缓存（' + Math.round((Date.now() - cached.ts) / 60000) + '分钟前）');
        return { path: 'arxiv-papers.json', data: JSON.stringify(cached.papers) };
      }
    }
  } catch (e) { /* ignore */ }

  console.log('  📡 arxiv: 拉取最新论文...');

  const allPapers = [];
  for (const q of QUERIES) {
    try {
      const xml = await arxivFetch(q.query, MAX_PER_QUERY);
      const papers = parseAtom(xml);
      papers.forEach(p => p.tag = q.name);
      allPapers.push(...papers);
      console.log(`     ${q.name}: ${papers.length} 篇`);
    } catch (e) {
      console.log(`     ${q.name}: 拉取失败 (${e.message})`);
    }
  }

  // 去重 + 按日期排序
  const seen = new Set();
  const papers = allPapers
    .filter(p => !seen.has(p.id) && seen.add(p.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // 写缓存
  try {
    fs.writeFileSync(cachePath, JSON.stringify({ ts: Date.now(), papers }));
  } catch (e) { /* ignore */ }

  console.log(`  📡 arxiv: 共 ${papers.length} 篇论文`);

  return { path: 'arxiv-papers.json', data: JSON.stringify(papers) };
});
