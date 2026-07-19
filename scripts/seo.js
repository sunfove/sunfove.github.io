/**
 * SEO 增强脚本
 * 1. 文章自动 description（取正文前 160 字）
 * 2. 文章页 Article JSON-LD 结构化数据
 * 3. 性能：关键资源 preload
 */

'use strict';

hexo.extend.filter.register('after_post_render', function (data) {
  if (!this.execFilter) return data;

  // 自动生成 description
  if (!data.description || data.description === '') {
    const text = data.content
      .replace(/<[^>]+>/g, '')           // 去 HTML
      .replace(/\$\$[\s\S]+?\$\$/g, '')  // 去块级公式
      .replace(/\$.+?\$/g, '')            // 去行内公式
      .replace(/```[\s\S]+?```/g, '')     // 去代码块
      .replace(/[#*\n\r\t]/g, ' ')       // 去 markdown 标记
      .replace(/\s{2,}/g, ' ')            // 压缩空白
      .trim();

    data.description = text.substring(0, 160);
  }

  return data;
});

// 注入文章结构化数据到 head
hexo.extend.injector.register('head_end', function () {
  const page = this.page;
  if (!page || !page.__post) return '';  // 只对文章页生效

  const title = (page.title || '').replace(/"/g, '\\"');
  const desc = (page.description || '').replace(/"/g, '\\"').substring(0, 200);
  const url = this.url_for(page.path);
  const date = page.date ? page.date.toISOString() : '';
  const updated = page.updated ? page.updated.toISOString() : '';

  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${title}",
  "description": "${desc}",
  "url": "${url}",
  "datePublished": "${date}",
  "dateModified": "${updated || date}",
  "author": { "@type": "Person", "name": "Sunfove" },
  "publisher": { "@type": "Person", "name": "Sunfove" }
}
</script>`;
});
