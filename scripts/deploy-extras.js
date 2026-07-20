/**
 * deploy_extras 拷贝机制
 * 把仓库根目录 deploy_extras/ 下的静态文件原样纳入构建产物，
 * 保证 /ripples/、/arxiv/ 等既有外链不失效。
 */
'use strict';

const fs = require('fs');
const path = require('path');

hexo.extend.generator.register('deploy_extras', function () {
  const base = path.join(hexo.base_dir, 'deploy_extras');
  const routes = [];
  if (!fs.existsSync(base)) return routes;

  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        routes.push({
          path: path.relative(base, full).split(path.sep).join('/'),
          data: () => fs.createReadStream(full)
        });
      }
    }
  })(base);

  return routes;
});
