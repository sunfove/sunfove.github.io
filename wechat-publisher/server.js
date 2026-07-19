const express = require('express');
const config = require('./modules/config');
const logger = require('./modules/logger');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const topicsModule = require('./modules/topics');
const researchModule = require('./modules/research');
const materialsModule = require('./modules/materials');
const articlesModule = require('./modules/articles');
const imagesModule = require('./modules/images');
const reviewModule = require('./modules/review');
const publishModule = require('./modules/publish');
const generatorModule = require('./modules/generator');
const { getDb } = require('./database/schema');

const app = express();
const PORT = process.env.PORT || 3060;

// 中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// 禁用缓存，防止微信浏览器缓存旧版本
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// 文件上传配置
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

// ==================== API Routes ====================

// Dashboard Stats
app.get('/api/stats', (req, res) => {
  try {
    res.json({
      topics: topicsModule.stats(),
      articles: articlesModule.stats(),
      images: imagesModule.stats(),
      review: reviewModule.stats(),
      publish: publishModule.stats()
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== 选题管理 =====
app.get('/api/topics', (req, res) => {
  try { res.json(topicsModule.list(req.query)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/topics/:id', (req, res) => {
  try { const t = topicsModule.get(req.params.id); t ? res.json(t) : res.status(404).json({ error: '未找到' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/topics', (req, res) => {
  try { res.json(topicsModule.create(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/topics/:id', (req, res) => {
  try { res.json(topicsModule.update(req.params.id, req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/topics/:id', (req, res) => {
  try { res.json(topicsModule.delete(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/topics/stats/all', (req, res) => {
  try { res.json(topicsModule.stats()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== 调研资料 =====
app.get('/api/research/:topicId', (req, res) => {
  try { res.json(researchModule.list(req.params.topicId)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/research', (req, res) => {
  try { res.json(researchModule.create(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/research/:id', (req, res) => {
  try { res.json(researchModule.delete(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/research/crawl', async (req, res) => {
  try { const result = await researchModule.crawl(req.body.url); res.json(result); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/research/summarize', async (req, res) => {
  try { const result = await researchModule.summarize(req.body.text); res.json({ summary: result }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== 素材管理 =====
app.get('/api/materials/:topicId', (req, res) => {
  try { res.json(materialsModule.list(req.params.topicId, req.query)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/materials', (req, res) => {
  try { res.json(materialsModule.create(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/materials/:id', (req, res) => {
  try { res.json(materialsModule.update(req.params.id, req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/materials/:id', (req, res) => {
  try { res.json(materialsModule.delete(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/materials/batch-delete', (req, res) => {
  try { res.json(materialsModule.bulkDelete(req.body.ids)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== 文章管理 =====
app.get('/api/articles', (req, res) => {
  try { res.json(articlesModule.list(req.query)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/articles/:id', (req, res) => {
  try { const a = articlesModule.get(req.params.id); a ? res.json(a) : res.status(404).json({ error: '未找到' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/articles', (req, res) => {
  try { res.json(articlesModule.create(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/articles/:id', (req, res) => {
  try { res.json(articlesModule.update(req.params.id, req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/articles/:id', (req, res) => {
  try { res.json(articlesModule.delete(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// AI 生成文章
app.post('/api/articles/generate', async (req, res) => {
  try {
    const result = await generatorModule.generateArticle(req.body);
    // 自动创建文章
    const article = articlesModule.create({
      topic_id: req.body.topicId,
      title: result.title,
      content: result.content,
      summary: result.summary
    });
    res.json(article);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI 润色
app.post('/api/articles/polish', async (req, res) => {
  try {
    const result = await generatorModule.polish(req.body.content, req.body.instructions);
    res.json({ content: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== 审核管理 =====
app.get('/api/review/queue', (req, res) => {
  try { res.json(reviewModule.queue(req.query)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/review/submit/:articleId', (req, res) => {
  try { res.json(reviewModule.submitForReview(req.params.articleId, req.body.userId)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/review/approve/:articleId', (req, res) => {
  try { res.json(reviewModule.approve(req.params.articleId, req.body.userId, req.body.comment)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/review/reject/:articleId', (req, res) => {
  try { res.json(reviewModule.reject(req.params.articleId, req.body.userId, req.body.comment)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/review/logs/:articleId', (req, res) => {
  try { res.json(reviewModule.getReviewLogs(req.params.articleId)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== 图片管理 =====
app.get('/api/images', (req, res) => {
  try { res.json(imagesModule.list(req.query)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/images/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择图片' });
    const img = imagesModule.addRecord({
      filename: req.file.filename,
      alt_text: req.body.alt_text || '',
      width: 0, height: 0,
      file_size: req.file.size,
      source: 'upload',
      article_id: req.body.article_id || null,
      topic_id: req.body.topic_id || null
    });
    res.json({ ...img, url: `/uploads/${req.file.filename}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/images/crawl', async (req, res) => {
  try {
    const result = await imagesModule.crawlImage(req.body.url, {
      altText: req.body.alt_text,
      topicId: req.body.topic_id,
      articleId: req.body.article_id
    });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/images/search', async (req, res) => {
  try {
    const results = await imagesModule.searchWebImages(req.body.query, req.body.count || 10);
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/images/:id', (req, res) => {
  try { res.json(imagesModule.delete(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== 健康检查 =====
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ===== 发布管理 =====
app.get('/api/publish/history', (req, res) => {
  try { res.json(publishModule.history(req.query)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/publish/wechat/:articleId', async (req, res) => {
  try {
    const token = req.body.access_token || await publishModule.getAccessToken();
    const result = await publishModule.publishToWechat(req.params.articleId, token);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/publish/preview/:articleId', async (req, res) => {
  try {
    const html = await publishModule.previewWechatHtml(req.params.articleId);
    res.json({ html });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/publish/preview/local/:articleId', async (req, res) => {
  try {
    const data = await publishModule.previewLocalHtml(req.params.articleId);
    const db = getDb();
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${data.title}</title>
<style>
body{margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#333;max-width:680px;margin:0 auto;}
h1,h2,h3,h4{color:#2e7d32;}a{color:#1b5e20;}img{max-width:100%;height:auto;}
blockquote{border-left:4px solid #4CAF50;background:#f1f8e9;padding:12px 16px;margin:15px 0;}
pre,code{background:#f1f8e9;}table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #ddd;padding:8px 12px;}</style>
</head>
<body>${data.html}</body>
</html>`;
    const filename = `preview-${req.params.articleId.slice(0,8)}-${Date.now()}.html`;
    const filepath = path.join(__dirname, 'preview', filename);
    const fs = require('fs');
    fs.mkdirSync(path.join(__dirname, 'preview'), { recursive: true });
    fs.writeFileSync(filepath, fullHtml);
    res.json({ ok: true, file: filename, path: `/preview/${filename}`, digest: data.digest });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/publish/token', async (req, res) => {
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) return res.status(404).json({ error: 'Not Found' });
    if (req.headers['x-admin-token'] !== adminToken) return res.status(403).json({ error: 'Forbidden' });
    const token = await publishModule.getAccessToken();
    res.json({ access_token: token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== 系统配置 =====
app.get('/api/config', (req, res) => {
  try {
    const db = getDb();
    const configs = db.prepare('SELECT * FROM config').all();
    const result = {};
    configs.forEach(c => { result[c.key] = c.value; });
    // 敏感字段不在接口返回
    delete result.wechat_app_secret;
    delete result.ai_api_key;
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/config', (req, res) => {
  try {
    config.setBatch(Object.entries(req.body));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== 用户管理 =====
app.get('/api/users', (req, res) => {
  try {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM users ORDER BY username').all());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SPA fallback - 所有非 API 请求返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🍄 蘑菇发布平台运行中: http://localhost:${PORT}`);
  logger.info(`   内网访问: http://$(hostname -I | awk '{print $1}'):${PORT}`);
  logger.info(`   按 Ctrl+C 停止`);
});
