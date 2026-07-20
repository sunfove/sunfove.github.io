/**
 * SEO 增强脚本
 * 1. 文章自动 description（取正文前 160 字）
 * 2. 文章页 Article JSON-LD 结构化数据（由 spectrum 主题 head 输出，hexo 8 injector
 *    会在注册时立即求值，无法按页注入，故迁移到模板中）
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
