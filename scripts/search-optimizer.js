/**
 * Search index optimizer
 * Strips HTML tags from search XML content to drastically reduce file size.
 * Drops the 3.9MB local-search.xml down to ~500KB-1MB by keeping only plain text.
 */
'use strict';

const fs = require('fs');
const path = require('path');

// Simple but effective HTML stripper (no dependencies)
function stripHtml(html) {
  if (!html) return '';
  return html
    // Remove CDATA wrappers
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    // Remove scripts and styles completely
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Replace block elements with space
    .replace(/<\/(div|p|h[1-6]|li|tr|td|th|blockquote|pre|br|hr|section|article|header|footer|nav|main|aside|table|ul|ol|dl|figure|figcaption|details|summary)[^>]*>/gi, ' ')
    .replace(/<(div|p|h[1-6]|li|tr|td|th|blockquote|pre|br|hr|section|article|header|footer|nav|main|aside|table|ul|ol|dl|figure|figcaption|details|summary)[^>]*>/gi, ' ')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Use before_exit which fires after all files are written to disk
// Guard: only process when we're actually generating (not cleaning)
let isGenerating = false;
hexo.on('generateBefore', () => { isGenerating = true; });

hexo.extend.filter.register('before_exit', function () {
  if (!isGenerating) return;

  const searchPath = path.join(hexo.public_dir, 'local-search.xml');

  if (!fs.existsSync(searchPath)) {
    hexo.log.warn('[search-optimizer] local-search.xml not found, skipping');
    return;
  }

  const original = fs.readFileSync(searchPath, 'utf8');
  const originalSize = Buffer.byteLength(original, 'utf8');

  // Strip HTML from content CDATA sections
  const optimized = original.replace(
    /<content type="html"><!\[CDATA\[([\s\S]*?)\]\]><\/content>/g,
    function (match, content) {
      const stripped = stripHtml(content);
      return '<content type="text"><![CDATA[' + stripped + ']]></content>';
    }
  );

  const optimizedSize = Buffer.byteLength(optimized, 'utf8');
  const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

  fs.writeFileSync(searchPath, optimized, 'utf8');
  hexo.log.info(
    '[search-optimizer] local-search.xml: ' +
    (originalSize / 1024 / 1024).toFixed(2) + 'MB → ' +
    (optimizedSize / 1024 / 1024).toFixed(2) + 'MB (' +
    reduction + '% reduction)'
  );
});
