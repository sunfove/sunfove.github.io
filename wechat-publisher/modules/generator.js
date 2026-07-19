const config = require('./config');
const logger = require('./logger');

module.exports = {
  async generateArticle({ topicId, title, style = 'general', tone = 'neutral', length = 'medium' }) {
    const { getDb } = require('../database/schema');
    const { v4: uuidv4 } = require('uuid');
    const db = getDb();
    const research = db.prepare('SELECT * FROM research WHERE topic_id = ? ORDER BY created_at DESC LIMIT 5').all(topicId);
    const materials = db.prepare('SELECT * FROM materials WHERE topic_id = ? ORDER BY created_at DESC LIMIT 10').all(topicId);
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);

    const lengths = { short: '600-800字', medium: '1500-2000字', long: '2500-3500字' };
    const prompt = `生成一篇微信公众号文章。风格：${style}，语气：${tone}，长度：${lengths[length] || '1500-2000字'}。标题：${title || topic?.title || '无标题'}。参考素材：${JSON.stringify({ research, materials }).slice(0, 2000)}。输出纯文本 Markdown，含完整的文章标题、正文、段落。`;

    const ai = config.getAI();
    if (!ai.apiKey) throw new Error('AI API Key 未配置');

    try {
      const axios = require('axios');
      const resp = await axios.post(`${ai.apiUrl}/chat/completions`, {
        model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.7
      }, { headers: { 'Authorization': `Bearer ${ai.apiKey}` }, timeout: 120000 });
      const content = resp.data.choices?.[0]?.message?.content || '';
      const id = uuidv4();
      db.prepare('INSERT INTO articles (id, topic_id, title, author, content, summary) VALUES (?, ?, ?, ?, ?, ?)').run(id, topicId, title || topic?.title || 'AI生成', '蘑菇AI', content, content.substring(0, 120));
      return { id, title: title || topic?.title, content };
    } catch (e) { throw new Error('AI 生成失败：' + e.message); }
  },

  async polish(content, instructions) {
    const ai = config.getAI();
    if (!ai.apiKey) throw new Error('AI API Key 未配置');
    const prompt = `润色以下文章。${instructions || ''}。输出润色后的完整文本。\n\n${content}`;
    try {
      const axios = require('axios');
      const resp = await axios.post(`${ai.apiUrl}/chat/completions`, {
        model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.5
      }, { headers: { 'Authorization': `Bearer ${ai.apiKey}` }, timeout: 120000 });
      return { content: resp.data.choices?.[0]?.message?.content || content };
    } catch (e) { throw new Error('润色失败：' + e.message); }
  }
};
