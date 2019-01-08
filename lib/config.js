'use strict';

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');
const revHash = require('rev-hash');

module.exports = class Config extends Plugin {
  constructor(inputNode, options) {
    super([inputNode], {
      name: options && options.name,
      annotation: options && options.annotation
    });

    this.options = options;
  }

  filterFiles(filterFile, root, directory) {
    const path = directory ? `${root}/${directory}` : root;
    const files = fs.readdirSync(path);
    let results = [];

    for (const file of files) {
      const relPath = directory ? `${directory}/${file}` : file;
      const fullPath = `${root}/${relPath}`;
      const stat = fs.statSync(fullPath);

      if(stat.isFile() && file === filterFile) {
        results.push(relPath);
      } else if (stat.isDirectory()) {
        results = results.concat(this.filterFiles(filterFile, root, relPath));
      }
    }

    return results;
  }

  build() {
    let options = this.options;
    let version = options.version || '1';

    const root = this.inputPaths[0];
    const ext = 'index.html';
    const htmlFiles = this.filterFiles(ext, root, null);

    const cacheMap = htmlFiles.reduce((out, file) => {
      const filePath = `${root}/${file}`;
      const buffer = fs.readFileSync(filePath);
      let url = file.substring(0, file.length - ext.length);
      if (!url.startsWith('/')) {
        url = '/' + url;
      }
      if (!url.endsWith('/')) {
        url += '/';
      }
      out[url] = `esw-prember-${version}-${revHash(buffer)}`;
      return out;
    }, {});

    let module = '';
    module += `export const ENVIRONMENT = '${options.env}';\n`;
    module += `export const HTML_MAPPING = ${JSON.stringify(cacheMap)};\n`;

    fs.writeFileSync(path.join(this.outputPath, 'config.js'), module);
  }
};
