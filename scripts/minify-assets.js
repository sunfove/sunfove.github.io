/**
 * Asset minifier for CSS and JS in the built output.
 * Runs after generation, zero dependencies.
 *
 * CSS: removes comments, whitespace
 * JS: removes comments, whitespace (conservative to avoid breaking code)
 */
'use strict';

const fs = require('fs');
const path = require('path');

// ── CSS minifier ──
function minifyCSS(content) {
  return content
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove whitespace around separators
    .replace(/\s*([{}:;,])\s*/g, '$1')
    // Remove last semicolon in block
    .replace(/;}/g, '}')
    // Collapse multiple whitespace into one
    .replace(/\s{2,}/g, ' ')
    // Remove leading/trailing whitespace
    .replace(/^\s+|\s+$/gm, '')
    // Collapse blank lines
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// ── JS minifier (conservative) ──
function minifyJS(content) {
  const lines = content.split('\n');
  const result = [];

  for (let line of lines) {
    // Remove single-line comments (but not URLs with //)
    line = line.replace(/^\s*\/\/\s.*$/, '');
    // Remove standalone /* ... */ comments on their own line (conservative)
    if (/^\s*\/\*.*\*\/\s*$/.test(line) && line.indexOf('"') === -1 && line.indexOf("'") === -1) {
      continue;
    }
    // Skip purely empty/whitespace lines
    if (/^\s*$/.test(line)) continue;
    result.push(line);
  }

  return result.join('\n').trim();
}

// ── Walk directory ──
function walkDir(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
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
  let totalSaved = 0;

  // Minify CSS
  const cssFiles = walkDir(publicDir, ['.css']);
  for (const file of cssFiles) {
    const original = fs.readFileSync(file, 'utf8');
    const minified = minifyCSS(original);
    if (minified.length < original.length) {
      const saved = original.length - minified.length;
      totalSaved += saved;
      fs.writeFileSync(file, minified, 'utf8');
    }
  }

  // Minify JS (skip already-minified files)
  const jsFiles = walkDir(publicDir, ['.js']);
  for (const file of jsFiles) {
    // Skip files that look pre-minified
    if (file.includes('.min.js')) continue;
    const original = fs.readFileSync(file, 'utf8');
    // Skip very small files or already-minified (avg line > 200 chars)
    if (original.length < 200) continue;
    const avgLineLen = original.length / original.split('\n').length;
    if (avgLineLen > 300) continue; // likely already minified

    const minified = minifyJS(original);
    if (minified.length < original.length) {
      const saved = original.length - minified.length;
      totalSaved += saved;
      fs.writeFileSync(file, minified, 'utf8');
    }
  }

  if (totalSaved > 0) {
    hexo.log.info('[minify-assets] Saved ' + (totalSaved / 1024).toFixed(1) + 'KB across ' +
      cssFiles.length + ' CSS + ' + jsFiles.length + ' JS files');
  }
});
