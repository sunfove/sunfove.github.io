/**
 * Fluid 风格标签插件（note / tabs / label）的 Spectrum 实现
 * 旧文章含 7 处 note、3 处 tabs、1 处 label，主题切换后需保留渲染能力
 */
'use strict';

function renderMd(hexo, content) {
  return hexo.render.renderSync({ text: content, engine: 'markdown' });
}

/* {% note [primary|success|danger|warning|info] [no-icon] %} ... {% endnote %} */
hexo.extend.tag.register('note', function (args, content) {
  const cls = args[0] || 'default';
  const html = renderMd(hexo, content);
  return `<div class="note note-${cls}">${html}</div>`;
}, { ends: true });

/* {% tabs 名称 %} <!-- tab 标题 --> ... <!-- endtab --> {% endtabs %} */
let tabSeq = 0;
hexo.extend.tag.register('tabs', function (args, content) {
  const name = (args.join(' ') || 'tabs').trim();
  const id = 'tabs-' + (++tabSeq);
  const parts = content.split(/<!--\s*tab\s+(.+?)\s*-->/).slice(1);
  const tabs = [];
  for (let i = 0; i < parts.length; i += 2) {
    const title = parts[i].trim();
    const body = parts[i + 1].replace(/<!--\s*endtab\s*-->/g, '').trim();
    tabs.push({ title, body });
  }
  if (!tabs.length) return `<div class="tabs"><p>${renderMd(hexo, content)}</p></div>`;

  let inputs = '';
  let labels = '';
  let panes = '';
  tabs.forEach((t, i) => {
    const checked = i === 0 ? ' checked' : '';
    inputs += `<input type="radio" name="${id}" id="${id}-${i}" class="tabs-radio"${checked}>`;
    labels += `<label for="${id}-${i}" class="tabs-label">${t.title}</label>`;
    panes += `<div class="tabs-pane">${renderMd(hexo, t.body)}</div>`;
  });
  return `<div class="tabs">${inputs}${labels}${panes}</div>`;
}, { ends: true });

/* {% label class@text %} */
hexo.extend.tag.register('label', function (args) {
  const joined = args.join(' ');
  const at = joined.indexOf('@');
  if (at < 0) return `<span class="label">${joined}</span>`;
  const cls = joined.slice(0, at).trim() || 'default';
  const text = joined.slice(at + 1).trim();
  return `<span class="label label-${cls}">${text}</span>`;
});
