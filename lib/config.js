'use strict';

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const revHash = require('rev-hash');

module.exports = class Config extends Plugin {
  constructor(inputNodes, options) {
    super(inputNodes, {
      name: options && options.name,
      annotation: options && options.annotation
    });

    this.options = options;
  }

  build() {
    let options = this.options;
    let version = options.version || '1';

    const ext = 'index.html';
    const htmlPages = glob.sync('tmp/prember-output*/**/' + ext);
    const cacheMap = htmlPages.reduce((out, filePath) => {
      const buffer = fs.readFileSync(filePath);
      const shortFilePath = filePath.split('.tmp')[1];
      let url = shortFilePath.substring(0, shortFilePath.length - ext.length);
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
