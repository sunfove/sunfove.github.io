const { getDb } = require('../database/schema');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

// 动态导入 ESM 渲染器
let rendererCache = null;
async function loadRenderer() {
  if (rendererCache) return rendererCache;
  const mod = await import('../wechat_formatter_mdnice.mjs');
  rendererCache = { mdToWeChat: mod.mdToWeChat, renderFormulasAndImages: mod.renderFormulasAndImages };
  return rendererCache;
}

const DIAGRAM_URLS = {
  shg_experiment: "http://mmbiz.qpic.cn/sz_mmbiz_png/5VDLx328UjggIgVb9V6laY7Euy2VXjibHXuPAZeBesqwcBPYHopceUCOamlrtUGEeVlxHjfyGtZaKT4pEl4qIOjbpqHpFiblnJXuYkoZtaj68/0?from=appmsg",
  linear_vs_nonlinear: "http://mmbiz.qpic.cn/mmbiz_png/5VDLx328UjhmzJSyuCMB3c78KaLgGVUFSN57bnbFCIRdLTtoRvraFBAw8SNw83JP5upR29iaiccWBITwXQqbRJtcI7TswX6atXPCBXBgCk2iaI/0?from=appmsg",
  shg_sfg_dfg: "http://mmbiz.qpic.cn/mmbiz_png/5VDLx328UjiaeTOxBRFMC0lmEQm01AQH6GThYNN5jf0lQl99YrHl9Ficxe35dKnDGhavN7875gMhofU8xBGRba5ERZ2KIaTT8gxF6N8EtBaR4/0?from=appmsg",
  ppln_phasematching: "http://mmbiz.qpic.cn/mmbiz_png/5VDLx328UjgVL283DbicyFBD8S4ONg20tHIFiab6YOYBlu1DriarXvxos2ibDDylJSicicE1uI9eAhy3I6w6rUFIA2GVrmR6C7dyz04vfXLIpj5lo/0?from=appmsg"
};

// 发布管理
const publishModule = {
  // 发布历史
  history({ page = 1, pageSize = 20 } = {}) {
    const db = getDb();
    const items = db.prepare(`SELECT pl.*, a.title as article_title, a.status as article_status
      FROM publish_log pl LEFT JOIN articles a ON pl.article_id = a.id
      ORDER BY pl.published_at DESC LIMIT ? OFFSET ?`).all(pageSize, (page - 1) * pageSize);
    const total = db.prepare('SELECT COUNT(*) as c FROM publish_log').get();
    return { items, total: total.c, page, pageSize };
  },

  // 获取 Access Token
  async getAccessToken() {
    const wechat = config.getWechat();
    if (!wechat.appId || !wechat.appSecret) {
      throw new Error('请先在系统设置中配置微信公众号 AppID 和 AppSecret，或设置环境变量 WECHAT_APP_ID / WECHAT_APP_SECRET');
    }
    const resp = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechat.appId}&secret=${wechat.appSecret}`,
      { timeout: 10000 }
    );
    if (resp.data.errcode && resp.data.errcode !== 0) {
      throw new Error(`获取 Access Token 失败: ${resp.data.errmsg}`);
    }
    return resp.data.access_token;
  },

  // 使用新渲染器将文章转换为微信 HTML
  async renderArticleForWechat(article) {
    if (!article || !article.content) throw new Error('文章内容为空');
    const token = await this.getAccessToken();
    const { mdToWeChat, renderFormulasAndImages } = await loadRenderer();
    const { html: rawHtml, formulas, imageUrls } = await mdToWeChat(article.content, { title: article.title });
    return await renderFormulasAndImages(rawHtml, formulas, imageUrls, token);
  },

  // 发布到微信公众号
  async publishToWechat(articleId, accessToken) {
    const db = getDb();
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
    if (!article) throw new Error('文章不存在');
    if (article.status !== 'review_approved') throw new Error('文章未通过审核，无法发布');

    const token = accessToken || await this.getAccessToken();
    const logId = uuidv4();
    db.prepare(`INSERT INTO publish_log (id, article_id, platform, status, message)
      VALUES (?, ?, 'wechat', 'pending', '发布中')`).run(logId, articleId);

    try {
      const html = await this.renderArticleForWechat(article);
      const resp = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=***}`,
        { articles: [{ title: article.title, author: article.author || '蘑菇', content: html, digest: (article.summary || article.content?.substring(0, 120)).substring(0, 120), thumb_media_id: article.cover_image || '', need_open_comment: 1, only_fans_can_comment: 0 }] },
        { timeout: 300000 }
      );
      if (resp.data.errcode && resp.data.errcode !== 0) { throw new Error(`微信API错误: ${resp.data.errmsg}`); }
      const mediaId = resp.data.media_id;
      db.prepare(`UPDATE publish_log SET status = 'success', message = ?, published_url = ?, published_at = datetime('now','localtime') WHERE id = ?`).run(`发布成功，media_id: ${mediaId}`, `media_id:${mediaId}`, logId);
      const articleUrl = await this._createWechatPermanentUrl(token, mediaId);
      db.prepare(`UPDATE articles SET status = 'published', published_at = datetime('now','localtime') WHERE id = ?`).run(articleId);
      return { success: true, mediaId, articleUrl, logId };
    } catch (err) {
      db.prepare(`UPDATE publish_log SET status = 'failed', message = ?, published_at = datetime('now','localtime') WHERE id = ?`).run(err.message, logId);
      throw err;
    }
  },

  // 仅生成微信 HTML 预览，不发布
  async previewWechatHtml(articleId) {
    const db = getDb();
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
    if (!article) throw new Error('文章不存在');
    return await this.renderArticleForWechat(article);
  },

  // 本地预览（不调微信 API，公式用 SVG，图片用原地址）
  async previewLocalHtml(articleId) {
    const db = getDb();
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
    if (!article) throw new Error('文章不存在');
    const { mdToWeChat, renderFormulasAndImages } = await loadRenderer();
    const { html: rawHtml, formulas, imageUrls, digest } = await mdToWeChat(article.content, { title: article.title });
    const html = await renderFormulasAndImages(rawHtml, formulas, imageUrls, null);
    return { html, digest, title: article.title, author: article.author };
  },

  // 旧版兼容转换
  _articleToWechatHtml(content) {
    if (!content) return '<p>内容为空</p>';
    let html = content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');
    return `<section><p>${html}</p></section>`;
  },

  async _createWechatPermanentUrl(accessToken, mediaId) {
    try {
      const resp = await axios.post(`https://api.weixin.qq.com/cgi-bin/draft/get?access_token=***}`, { media_id: mediaId }, { timeout: 10000 });
      return resp.data.article_url || '';
    } catch { return `https://mp.weixin.qq.com/s?media_id=${mediaId}`; }
  },

  stats() {
    const db = getDb();
    return {
      total: db.prepare('SELECT COUNT(*) as c FROM publish_log').get().c,
      success: db.prepare("SELECT COUNT(*) as c FROM publish_log WHERE status='success'").get().c,
      failed: db.prepare("SELECT COUNT(*) as c FROM publish_log WHERE status='failed'").get().c,
      pending: db.prepare("SELECT COUNT(*) as c FROM publish_log WHERE status='pending'").get().c,
      lastPublish: db.prepare("SELECT published_at FROM publish_log WHERE status='success' ORDER BY published_at DESC LIMIT 1").get(),
    };
  }
};

module.exports = publishModule;
