'use strict';

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function md5Hash(buf) {
  let md5 = crypto.createHash('md5');
  md5.update(buf);
  return md5.digest('hex');
}

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
    let urls = options.urls || [];
    let urlsString = '';
    let hashes = '';
    urls.forEach((url, index) => {
      const withSlash = url.endsWith('/') ? url : `${url}/`;
      const indexPath = path.join(this.inputPaths[0], `${withSlash}index.html`);

      // Add the hash of the file contents to our running hash
      hashes += md5Hash(fs.readFileSync(indexPath).toString());

      if (index < urls.length - 1) {
        urlsString += `'${withSlash}', `;
      } else {
        urlsString += `'${withSlash}'`;
      }
    });

    // Get one final hash of all the concatenated hashes
    const hash = md5Hash(hashes);

    let module = '';
    module += `export const VERSION = '${version}';\n`;
    module += `export const PREMBER_URLS = [${urlsString}];\n`;
    module += `self.FILES_HASH = '${hash}';\n`;

    fs.writeFileSync(path.join(this.outputPath, 'config.js'), module);
  }
};
