/**
 * WeChat Official Account HTML Converter
 * 最终方案：公式 → PNG 图片 → 微信 CDN
 *
 * 流程：
 * 1. Markdown 解析、公式收集（用占位符替换）
 * 2. 调用方提供 accessToken 后，统一把公式渲染成 PNG 并上传到微信 CDN
 * 3. 用 <img> 标签替换占位符
 * 4. 内容自检：字数、段落、公式、图片、摘要等
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import juice from 'juice';
import crypto from 'crypto';
import logger from './modules/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

// ── MathJax 引擎（单例） ──
const mathJaxEngine = (() => {
  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  const texInput = new TeX({ packages: AllPackages });
  const svgOutput = new SVG({ fontCache: 'none', scale: 1.2 });
  const doc = mathjax.document('', { InputJax: texInput, OutputJax: svgOutput });
  return { doc, adaptor };
})();

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function stripMarkdown(content) {
  return content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$\n]+\$/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '$1')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/\|/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateDigest(content) {
  const plain = stripMarkdown(content);
  const firstSentence = plain.match(/^[^。！？]+[。！？]/);
  if (firstSentence) {
    return firstSentence[0].substring(0, 120).trim();
  }
  return plain.substring(0, 120).trim();
}

function addHeaderAndFooter(content, title) {
  const header = `<p style="font-size:15px;line-height:1.8;margin:10px 0;color:#666;">📌 本文探讨「${title}」，适合光学、物理与材料背景的读者阅读。文中公式已转为高清图片，点击图片可放大查看。</p>`;
  const footer = `<p style="font-size:15px;line-height:1.8;margin:10px 0;color:#666;">📮 欢迎在评论区留言交流；如对超表面、微纳光学话题感兴趣，欢迎关注「时帧 time-frame」获取更多内容。</p>`;
  return header + '\n\n' + content + '\n\n' + footer;
}

/**
 * LaTeX → SVG 字符串
 */
function latexToSvg(tex, display) {
  try {
    const node = mathJaxEngine.doc.convert(tex, { display });
    let svgHtml = mathJaxEngine.adaptor.innerHTML(node);

    svgHtml = svgHtml
      .replace(/ role="img"/g, '')
      .replace(/ focusable="false"/g, '')
      .replace(/ data-mjx-\w+(="[^"]*")?/g, '');

    svgHtml = svgHtml.replace(/stroke="currentColor"/g, 'stroke="#000"');
    svgHtml = svgHtml.replace(/fill="currentColor"/g, 'fill="#000"');

    if (!svgHtml.includes('xmlns=')) {
      svgHtml = svgHtml.replace(/<svg\s/, '<svg xmlns="http://www.w3.org/2000/svg" ');
    }

    return svgHtml;
  } catch (e) {
    return `<span style="color:#c00;font-family:monospace;font-size:14px;">${escapeHtml(tex)}</span>`;
  }
}

/**
 * 公式 PNG 化：MathJax SVG → rsvg-convert 高清 PNG
 * rsvg-convert 能正确处理 stretchy 操作符（如 \iint）
 */
let sharpCache = null;
async function loadSharp() {
  if (sharpCache) return sharpCache;
  sharpCache = (await import('sharp')).default;
  return sharpCache;
}

export async function formulaToPngBuffer(tex, display = false) {
  const svg = latexToSvg(tex, display);

  const widthMatch = svg.match(/width="([\d.]+)ex"/);
  const heightMatch = svg.match(/height="([\d.]+)ex"/);
  const wEx = widthMatch ? parseFloat(widthMatch[1]) : 10;
  const hEx = heightMatch ? parseFloat(heightMatch[1]) : 2.5;

  // 1ex ≈ 10px, 渲染目标宽度最大 3000px
  const scale = 2.5;
  const targetWidth = Math.min(3000, Math.max(40, Math.round(wEx * 10 * scale)));

  let buf = execSync(`rsvg-convert -w ${targetWidth} -f png`, {
    input: Buffer.from(svg, 'utf-8'),
    timeout: 15000,
  });

  // 行内公式：裁剪透明边距，按行高缩放，保持宽高比
  if (!display) {
    const sharp = await loadSharp();
    const metadata = await sharp(buf).metadata();
    const targetHeight = 22; // 2x 高清，在微信里按 11px 行内基线显示
    const ratio = metadata.width / metadata.height;
    const newWidth = Math.max(20, Math.round(targetHeight * ratio));
    buf = await sharp(buf)
      .trim() // 裁剪公式 PNG 周围的空白边距
      .resize(newWidth, targetHeight, { fit: 'inside' })
      .png()
      .toBuffer();
  }

  return buf;
}

// ── 图片上传（微信 CDN） ──
async function uploadImageToWeChat(token, imageBuffer, filename = 'img.png') {
  const boundary = '----Boundary' + crypto.randomBytes(16).toString('hex');
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([Buffer.from(header), imageBuffer, Buffer.from(footer)]);

  const resp = await fetch(
    `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`,
    { method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body }
  );
  const result = await resp.json();
  if (result.url) return result.url;
  throw new Error(`上传图片失败: ${JSON.stringify(result)}`);
}

// ── 核心转换入口 ──
export async function mdToWeChat(markdown, options = {}) {
  let content = markdown;
  const { baseStyle, theme: themeName = 'green', title = '文章' } = options;

  const themes = {
    green: { titleColor: '#2e7d32', accentColor: '#4CAF50', quoteBorder: '#4CAF50', quoteBg: '#f1f8e9', codeBg: '#f1f8e9', linkColor: '#1b5e20' },
    blue: { titleColor: '#1565c0', accentColor: '#2196F3', quoteBorder: '#2196F3', quoteBg: '#e3f2fd', codeBg: '#e3f2fd', linkColor: '#0d47a1' },
    dark: { titleColor: '#1976d2', accentColor: '#64b5f6', quoteBorder: '#64b5f6', quoteBg: '#263238', codeBg: '#263238', linkColor: '#90caf9' },
    paper: { titleColor: '#212121', accentColor: '#616161', quoteBorder: '#9e9e9e', quoteBg: '#fafafa', codeBg: '#fafafa', linkColor: '#424242' }
  };
  const theme = themes[themeName] || themes.green;

  const formulas = [];
  content = content.replace(/\$\$(.+?)\$\$/gs, (_, formula) => {
    formulas.push({ tex: formula.trim(), display: true });
    return `\x00FORMULA${formulas.length - 1}\x00`;
  });
  content = content.replace(/(?<!\x00)\$(.+?)\$(?!\x00)/g, (_, formula) => {
    formulas.push({ tex: formula.trim(), display: false });
    return `\x00FORMULA${formulas.length - 1}\x00`;
  });

  const codeBlocks = [];
  content = content.replace(/```[\s\S]*?```/g, m => {
    codeBlocks.push(m.replace(/^```\n?/, '').replace(/```$/, '').trim());
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  const imageUrls = [];
  content = content.replace(/!\[(.*?)\]\(([^)]+)\)/g, (_, alt, url) => {
    imageUrls.push({ url, alt });
    return `\x00IMG${imageUrls.length - 1}\x00`;
  });

  content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" style="color:' + theme.linkColor + ';text-decoration:none;">$1</a>');
  content = content.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  content = content.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  content = content.replace(/^# (.+)$/gm,
    `<h1 style="font-size:22px;font-weight:bold;margin:30px 0 15px 0;text-align:center;color:${theme.titleColor};">$1</h1>`);
  content = content.replace(/^## (.+)$/gm,
    `<h2 style="font-size:18px;font-weight:bold;margin:25px 0 15px 0;padding-bottom:8px;border-bottom:2px solid ${theme.accentColor};color:${theme.titleColor};">$1</h2>`);
  content = content.replace(/^### (.+)$/gm,
    `<h3 style="font-size:16px;font-weight:bold;margin:20px 0 10px 0;color:${theme.titleColor};">$1</h3>`);
  content = content.replace(/^#### (.+)$/gm,
    `<h4 style="font-size:15px;font-weight:bold;margin:15px 0 8px 0;color:${theme.titleColor};">$1</h4>`);
  content = content.replace(/^---+$/gm,
    `<hr style="border:none;border-top:2px solid ${theme.accentColor};margin:25px 0;" />`);
  content = content.replace(/^(>+) (.+)$/gm, (_, level, text) => {
    const depth = level.length;
    const marginLeft = (depth - 1) * 10;
    return `<blockquote style="border-left:4px solid ${theme.quoteBorder};padding:10px 15px;margin:15px 0 ${marginLeft}px;color:#555;background:${theme.quoteBg};">${text}</blockquote>`;
  });
  content = content.replace(/`([^`]+)`/g, (_, code) => {
    const escaped = escapeHtml(code);
    return `<code style="background:${theme.codeBg};padding:2px 6px;border-radius:3px;font-size:14px;color:${theme.titleColor};">${escaped}</code>`;
  });

  content = content.replace(/\n\n((?:\|[^\n]*\|[^\n]*\n?)+)\n\n/g, (_, tblBlock) => {
    const rows = tblBlock.trim().split('\n').filter(l => l.trim() && !/^[\s|:\-]+$/.test(l.trim()));
    if (rows.length < 1) return '\n\n\n\n';
    let html = '<table style="border-collapse:collapse;width:100%;margin:15px 0;font-size:14px;border:1px solid #ddd;">\n';
    rows.forEach((row, i) => {
      const cells = row.split('|').map(c => c.trim()).filter(c => c.length > 0);
      const tag = i === 0 ? 'th' : 'td';
      const bg = i === 0 ? 'background:' + theme.quoteBg + ';' : '';
      html += '  <tr>\n';
      cells.forEach(c => html += `    <${tag} style="border:1px solid #ddd;padding:8px 12px;text-align:left;${bg}">${c}</${tag}>\n`);
      html += '  </tr>\n';
    });
    html += '</table>';
    return '\n\n' + html + '\n\n';
  });

  content = content.replace(/^- (.+)$/gm, '<li style="margin:5px 0;">$1</li>');
  content = content.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul style="padding-left:20px;margin:10px 0;">$1</ul>');

  codeBlocks.forEach((code, i) => {
    const escaped = escapeHtml(code);
    content = content.replace(`\x00CODE${i}\x00`,
      `<pre style="background:${theme.codeBg};border:1px solid #e1e4e8;border-radius:6px;padding:16px;font-size:14px;overflow-x:auto;line-height:1.45;margin:15px 0;"><code>${escaped}</code></pre>`);
  });

  const lines = content.split('\n');
  const result = [];
  for (const line of lines) {
    const s = line.trim();
    if (!s) { result.push(''); continue; }
    if (s.startsWith('<')) { result.push(s); continue; }
    result.push(`<p style="font-size:15px;line-height:1.8;margin:10px 0;letter-spacing:0.5px;">${s}</p>`);
  }
  content = result.join('\n')
    .replace(/<p[^>]*>\s*<\/p>/g, '')
    .replace(/\n{3,}/g, '\n\n');

  content = addHeaderAndFooter(content, title);

  const defaultCSS = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; color: #333; }
    h1, h2, h3, h4 { color: ${theme.titleColor}; }
    strong { color: ${theme.titleColor}; }
    a { color: ${theme.linkColor}; text-decoration: none; }
    blockquote { border-left: 4px solid ${theme.quoteBorder}; background: ${theme.quoteBg}; padding: 12px 16px; margin: 15px 0; font-style: italic; }
    code, pre { background: ${theme.codeBg}; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; }
    img { max-width: 100%; height: auto; }
  `;
  try {
    content = juice.inlineContent(content, baseStyle || defaultCSS, {
      inlinePseudoElements: true, preserveImportant: true, removeStyleTags: false,
    });
  } catch (e) { logger.error({ err: e }, 'juice inline error'); }

  return { html: content, formulas, imageUrls, digest: generateDigest(markdown) };
}

/**
 * 渲染所有公式为 PNG 并上传，替换占位符
 */
export async function renderFormulasAndImages(html, formulas, imageUrls, accessToken) {
  if (!accessToken) {
    // 本地模式：公式用内嵌 SVG
    for (let i = 0; i < formulas.length; i++) {
      const { tex, display } = formulas[i];
      let svg = latexToSvg(tex, display);
      svg = svg.replace("<svg ", `<svg role="img" `);
      const wrapper = display
        ? `<div style="text-align:center;margin:15px 0;">${svg}</div>`
        : `<span style="display:inline-block;vertical-align:middle;">${svg}</span>`;
      html = html.replace(`\x00FORMULA${i}\x00`, wrapper);
    }
    for (let i = 0; i < imageUrls.length; i++) {
      const { url, alt } = imageUrls[i];
      html = html.replace(`\x00IMG${i}\x00`, `<img src="${url}" alt="${escapeHtml(alt)}" style="display:block;margin:15px auto;max-width:100%;height:auto;" />`);
    }
    return html;
  }

  for (let i = 0; i < formulas.length; i++) {
    const { tex, display } = formulas[i];
    try {
      const pngBuffer = await formulaToPngBuffer(tex, display);
      const cdnUrl = await uploadImageToWeChat(accessToken, pngBuffer, `formula_${i}.png`);
  const style = display
        ? 'display:block;margin:15px auto;max-width:100%;height:auto;'
        : 'display:inline-block;vertical-align:middle;height:0.9em;width:auto;max-width:100%;';
      const replacement = `<img src="${cdnUrl}" alt="${escapeHtml(tex)}" style="${style}" />`;
      html = html.replace(`\x00FORMULA${i}\x00`, replacement);
      logger.info(`  ✅ 公式 ${i + 1}/${formulas.length} 上传成功`);
    } catch (e) {
      logger.error({ err: e }, `  ❌ 公式 ${i + 1} 上传失败`);
      html = html.replace(`\x00FORMULA${i}\x00`, `<span style="color:#c00">${escapeHtml(tex)}</span>`);
    }
  }

  for (let i = 0; i < imageUrls.length; i++) {
    const { url, alt } = imageUrls[i];
    try {
      let imageBuffer;
      if (url.startsWith('http')) {
        const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        imageBuffer = Buffer.from(await resp.arrayBuffer());
      } else {
        const localPath = url.startsWith('/')
          ? '/home/ubuntu/time-frame-website/source' + url
          : path.resolve('/home/ubuntu/time-frame-website/source', url);
        imageBuffer = fs.readFileSync(localPath);
      }
      const cdnUrl = await uploadImageToWeChat(accessToken, imageBuffer, `img_${i}.png`);
      html = html.replace(`\x00IMG${i}\x00`, `<img src="${cdnUrl}" alt="${escapeHtml(alt)}" style="display:block;margin:15px auto;max-width:100%;height:auto;" />`);
      logger.info(`  ✅ 图片 ${i + 1}/${imageUrls.length} 上传成功`);
    } catch (e) {
      logger.error({ err: e }, `  ❌ 图片 ${i + 1} 上传失败`);
      html = html.replace(`\x00IMG${i}\x00`, '');
    }
  }

  return html;
}

/**
 * 内容自检函数
 */
export function selfCheck(html, { title, formulas, imageUrls, digest }, { allowPlaceholders = true } = {}) {
  const checks = [];
  const add = (ok, msg, level = 'info') => checks.push({ ok, level, msg });

  const plainText = stripMarkdown(html.replace(/<[^>]+>/g, ''));
  const charCount = plainText.length;
  const imgCount = (html.match(/<img\b/g) || []).length;
  const formulaCount = formulas.length;
  const hasUnclosedTag = /<(?!\/)[^>]+>[^<]*$/.test(html) || /<\w+\b[^>]*>(?![\s\S]*<\/\w*>)/.test(html);

  add(title && title.length >= 5 && title.length <= 64, `标题长度: ${title.length} 字`, title.length > 64 ? 'warn' : 'info');
  add(charCount >= 200, `正文字数: ${charCount} 字`, charCount < 200 ? 'error' : 'info');
  add(charCount <= 30000, `HTML 体积合理: ${charCount} 字`, charCount > 30000 ? 'warn' : 'info');
  add(imgCount >= 1 || imageUrls.length >= 1, `图片资源: ${Math.max(imgCount, imageUrls.length)} 张`, (imgCount === 0 && imageUrls.length === 0) ? 'warn' : 'info');
  add(formulaCount >= 0, `公式数量: ${formulaCount} 个`, 'info');
  add(digest && digest.length >= 10, `摘要长度: ${digest.length} 字`, digest.length < 10 ? 'error' : 'info');
  add(!hasUnclosedTag, 'HTML 标签闭合检查', hasUnclosedTag ? 'error' : 'info');
  add(allowPlaceholders || !html.includes('\x00FORMULA'), '所有公式占位符已替换', html.includes('\x00FORMULA') ? 'error' : 'info');
  add(allowPlaceholders || !html.includes('\x00IMG'), '所有图片占位符已替换', html.includes('\x00IMG') ? 'error' : 'info');
  add(!html.includes('currentColor'), 'SVG currentColor 已清理', html.includes('currentColor') ? 'warn' : 'info');
  add(!html.includes('<script') && !html.includes('<style'), '无 script/style 外联标签', html.includes('<script') || html.includes('<style') ? 'warn' : 'info');

  const okCount = checks.filter(c => c.ok).length;
  const errorCount = checks.filter(c => !c.ok && c.level === 'error').length;
  const warnCount = checks.filter(c => !c.ok && c.level === 'warn').length;

  return {
    ok: errorCount === 0,
    summary: { okCount, total: checks.length, errorCount, warnCount },
    checks,
    meta: { charCount, imgCount, formulaCount, digest }
  };
}

export default mdToWeChat;
