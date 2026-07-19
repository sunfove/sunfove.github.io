/**
 * WeChat publisher v6 - 墨滴风格公式+图片处理器
 *
 * 关键改进（对应 墨滴/mdnice 方案）：
 * - 公式：MathJax 服务器端渲染 → 纯 SVG 嵌入（含 path 数据，无外部字体依赖）
 * - 图片：自动上传到微信 CDN 并替换引用
 * - 样式：juice 内联所有 CSS
 */

import crypto from 'crypto';
import { Buffer } from 'buffer';
import {mdToWeChat, renderFormulasAndImages} from './wechat_formatter_mdnice.mjs';
import config from './modules/config.js';
import logger from './modules/logger.js';

// 微信配置从数据库/环境变量读取，不再硬编码
const wechat = config.getWechat();
const APP_ID = wechat.appId;
const APP_SECRET = wechat.appSecret;

if (!APP_ID || !APP_SECRET) {
  logger.error('请先在 config 表或环境变量中配置 WECHAT_APP_ID 和 WECHAT_APP_SECRET');
  process.exit(1);
}

// 预定义的 SVG 图解（已上传到微信 CDN 的永久素材）
const DIAGRAM_URLS = {
  shg_experiment: "http://mmbiz.qpic.cn/sz_mmbiz_png/5VDLx328UjggIgVb9V6laY7Euy2VXjibHXuPAZeBesqwcBPYHopceUCOamlrtUGEeVlxHjfyGtZaKT4pEl4qIOjbpqHpFiblnJXuYkoZtaj68/0?from=appmsg",
  linear_vs_nonlinear: "http://mmbiz.qpic.cn/mmbiz_png/5VDLx328UjhmzJSyuCMB3c78KaLgGVUFSN57bnbFCIRdLTtoRvraFBAw8SNw83JP5upR29iaiccWBITwXQqbRJtcI7TswX6atXPCBXBgCk2iaI/0?from=appmsg",
  shg_sfg_dfg: "http://mmbiz.qpic.cn/mmbiz_png/5VDLx328UjiaeTOxBRFMC0lmEQm01AQH6GThYNN5jf0lQl99YrHl9Ficxe35dKnDGhavN7875gMhofU8xBGRba5ERZ2KIaTT8gxF6N8EtBaR4/0?from=appmsg",
  ppln_phasematching: "http://mmbiz.qpic.cn/mmbiz_png/5VDLx328UjgVL283DbicyFBD8S4ONg20tHIFiab6YOYBlu1DriarXvxos2ibDDylJSicicE1uI9eAhy3I6w6rUFIA2GVrmR6C7dyz04vfXLIpj5lo/0?from=appmsg",
};

const IMG_STYLE = 'style="width:100%;margin:20px 0;border-radius:8px;max-width:100%;"';

async function main() {
  logger.info('Getting token...');
  const tokenResp = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`
  );
  const tokenData = await tokenResp.json();
  const token = tokenData.access_token;
  if (!token) throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  logger.info(`Token: ${token.substring(0, 20)}...`);

  const articles = [
    { id: "f099568f-c4f6-4354-b3e3-77d18a096e28",
      thumb: "Rkxq_NGcS1FMCe1VD5hCDkaaLGp9jWTQjZHjp4302pmKipDPQeZ9Dn7qgvMOpaB4",
      title: "非线性光学入门：光与光如何对话",
      images: [
        { after: "---", url: DIAGRAM_URLS.shg_experiment,
          caption: "图1：Franken 1961 年 SHG 实验。红宝石激光（694.3 nm）通过石英晶体产生倍频信号（347.2 nm）。" },
        { after: "## 2. 二阶非线性", url: DIAGRAM_URLS.linear_vs_nonlinear,
          caption: "图2：线性 vs 非线性极化对比。弱光下电子像理想弹簧，强光下出现非线性效应。" },
        { after: "## 3. 相位匹配", url: DIAGRAM_URLS.shg_sfg_dfg,
          caption: "图3：二阶非线性中的三种频率混频：倍频（SHG）、和频（SFG）和差频（DFG）。" },
        { after: "## 4. 三阶非线性", url: DIAGRAM_URLS.ppln_phasematching,
          caption: "图4：相位匹配与 PPLN 周期性极化结构。周期 Λ = 2Lc 使能量持续增长。" },
      ]
    },
    { id: "71203bb7-6b80-4047-b42b-9f10dff4ba2f",
      thumb: "Rkxq_NGcS1FMCe1VD5hCDqG9a_zstjex2SzNwezHS-shyGk2xzmCZOxXIEhsjerP",
      title: "AI for Science：神经网络如何破解光学难题",
      images: [] },
    { id: "5eb72841-92db-47c3-ad63-3a12efc9849c",
      thumb: "Rkxq_NGcS1FMCe1VD5hCDv-tU-4OqN0Zr2NUkuDrzatwK66q-kN6kF_kznqXhxPB",
      title: "2026年AI大模型趋势：从通用到垂直的进化",
      images: [] },
    { id: "6e58cdd5-0fa5-4fba-963e-40e65bf967d5",
      thumb: "Rkxq_NGcS1FMCe1VD5hCDniOJz8Q0xpoHhv2KKaBrpI7tNWspH-Fu-Ga5fgfke66",
      title: "光子计算：当光取代电，AI算力的下一个十年",
      images: [] },
  ];

  for (const [i, art] of articles.entries()) {
    logger.info(`[${i+1}/${articles.length}] ${art.title}`);

    // 获取文章内容
    const articleResp = await fetch(`http://localhost:3060/api/articles/${art.id}`);
    const articleData = await articleResp.json();
    let content = articleData.content || '';
    logger.info(`  Content: ${content.length} chars`);

    // 插入图解图片到对应章节
    if (art.images) {
      for (const img of art.images) {
        const idx = content.indexOf(img.after);
        if (idx !== -1) {
          const imgHtml = `\n\n<img src="${img.url}" alt="${img.caption}" ${IMG_STYLE} />\n<p style="font-size:13px;color:#64748b;text-align:center;margin:0 0 20px 0;line-height:1.5;">${img.caption}</p>\n\n`;
          content = content.slice(0, idx) + imgHtml + content.slice(idx);
          logger.info(`    📷 ${img.caption.substring(0, 30)}...`);
        }
      }
    }

    // 统计公式数量
    const formulaCount = (content.match(/\$\$/g) || []).length / 2 +
                         (content.match(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g) || []).length;
    logger.info(`  ~${formulaCount} formulas`);

    // ── 核心转换：mdToWeChat（墨滴风格） ──
    logger.info('  Converting with 墨滴-style formatter...');
    const { html: rawHtml, formulas, imageUrls } = await mdToWeChat(content, {accessToken: token});

    // 上传公式与图片到微信 CDN
    logger.info('  Uploading formulas & images to WeChat CDN...');
    const html = await renderFormulasAndImages(rawHtml, formulas, imageUrls, token);

    const htmlSize = Buffer.byteLength(html, 'utf-8');
    logger.info(`  HTML: ${html.length} chars, ~${(htmlSize/1024).toFixed(0)}KB`);

    // 推送到微信草稿箱
    const draftResp = await fetch(
      `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          articles: [{
            title: art.title,
            content: html,
            thumb_media_id: art.thumb,
            need_open_comment: 1,
            only_fans_can_comment: 0,
          }]
        })
      }
    );
    const draftResult = await draftResp.json();
    logger.info(draftResult.media_id
      ? `  ✅ 草稿: ${draftResult.media_id.substring(0, 40)}...`
      : `  ❌ ${JSON.stringify(draftResult)}`);
  }

  logger.info('Done!');
}

main().catch(e => logger.error({ err: e }, 'Fatal error'));
