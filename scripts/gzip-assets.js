/**
 * Pre-compress static assets as .gz files for nginx/Caddy "static gzip" serving.
 * Only compresses files where the .gz version is smaller than the original.
 * Target: .html, .css, .js, .xml, .svg, .json files > 1KB.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const MIN_SIZE = 1024; // 1KB minimum
const COMPRESS_EXTS = ['.html', '.css', '.js', '.xml', '.svg', '.json', '.txt'];

function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip hidden dirs
      if (entry.name.startsWith('.')) continue;
      results.push(...walkDir(fullPath));
    } else if (COMPRESS_EXTS.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// Guard: only run during actual generation
let isGenerating = false;
hexo.on('generateBefore', () => { isGenerating = true; });

hexo.extend.filter.register('before_exit', function () {
  if (!isGenerating) return;
  const publicDir = hexo.public_dir;
  const files = walkDir(publicDir).filter(f => {
    try { return fs.statSync(f).size >= MIN_SIZE; } catch (e) { return false; }
  });

  let compressed = 0;
  let totalOriginal = 0;
  let totalCompressed = 0;

  for (const file of files) {
    try {
      const original = fs.readFileSync(file);
      const gzipped = zlib.gzipSync(original, { level: 9 });
      const gzFile = file + '.gz';

      // Only write .gz if it's actually smaller
      if (gzipped.length < original.length) {
        fs.writeFileSync(gzFile, gzipped);
        totalOriginal += original.length;
        totalCompressed += gzipped.length;
        compressed++;
      }
    } catch (e) {
      // Silently skip files that fail
    }
  }

  if (compressed > 0) {
    const ratio = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
    hexo.log.info(
      '[gzip-assets] Pre-compressed ' + compressed + ' files (' +
      (totalOriginal / 1024).toFixed(0) + 'KB → ' +
      (totalCompressed / 1024).toFixed(0) + 'KB, ' + ratio + '% smaller)'
    );
  } else {
    hexo.log.info('[gzip-assets] No files needed compression');
  }
});
