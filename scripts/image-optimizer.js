/**
 * Image optimizer for built output.
 * Compresses PNG and JPG images using ImageMagick/Sharp if available.
 * Falls back to a warning if no tools are found.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walkDir(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function getFileSize(filePath) {
  return fs.statSync(filePath).size;
}

// Check if ImageMagick 'magick' or 'convert' is available
function getMagickCmd() {
  try {
    execSync('magick --version', { stdio: 'ignore' });
    return 'magick';
  } catch (e) {
    try {
      execSync('convert --version', { stdio: 'ignore' });
      return 'convert';
    } catch (e2) {
      return null;
    }
  }
}

// Guard: only run during actual generation
let isGenerating = false;
hexo.on('generateBefore', () => { isGenerating = true; });

hexo.extend.filter.register('before_exit', function () {
  if (!isGenerating) return;
  const publicDir = hexo.public_dir;
  const magick = getMagickCmd();

  // ── Find large images (skip gif, svg) ──
  const imageFiles = walkDir(publicDir, ['.png', '.jpg', '.jpeg', '.webp']);
  const LARGE_THRESHOLD = 50 * 1024; // 50KB
  const largeImages = imageFiles.filter(f => getFileSize(f) > LARGE_THRESHOLD);

  if (largeImages.length === 0) {
    hexo.log.info('[image-optimizer] No large images found, skipping');
    return;
  }

  let totalSaved = 0;

  for (const file of largeImages) {
    const ext = path.extname(file).toLowerCase();
    const originalSize = getFileSize(file);

    try {
      if (magick) {
        // Use ImageMagick to compress
        const tmpFile = file + '.tmp_opt';
        if (ext === '.png') {
          // PNG: reduce colors + strip metadata
          execSync(
            magick + ' "' + file + '" -strip -colors 128 -quality 85 "' + tmpFile + '"',
            { stdio: 'ignore', timeout: 10000 }
          );
        } else if (ext === '.jpg' || ext === '.jpeg') {
          // JPEG: quality 80 + strip metadata + progressive
          execSync(
            magick + ' "' + file + '" -strip -interlace Plane -quality 80 "' + tmpFile + '"',
            { stdio: 'ignore', timeout: 10000 }
          );
        }

        if (fs.existsSync(tmpFile)) {
          const newSize = getFileSize(tmpFile);
          if (newSize < originalSize) {
            fs.renameSync(tmpFile, file);
            totalSaved += originalSize - newSize;
          } else {
            // Don't replace if not smaller
            fs.unlinkSync(tmpFile);
          }
        }
      }
    } catch (e) {
      // Silently skip on error (e.g., corrupt image, timeout)
      // Clean up temp file if it exists
      const tmpFile = file + '.tmp_opt';
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  }

  if (totalSaved > 0) {
    hexo.log.info(
      '[image-optimizer] Compressed ' + largeImages.length + ' images, saved ' +
      (totalSaved / 1024).toFixed(1) + 'KB'
    );
  } else if (!magick) {
    hexo.log.warn('[image-optimizer] ImageMagick not available, skipping image compression');
  } else {
    hexo.log.info('[image-optimizer] All images already optimized');
  }
});
