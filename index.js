'use strict';

const Config = require('./lib/config');
const mergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'ember-service-worker-index',

  included(app) {
    this._super.included && this._super.included.apply(this, arguments);
    this.app = app;
    this.app.options = this.app.options || {};
    this.app.options['esw-prember'] = this.app.options['esw-prember'] || {};
  },

  treeForServiceWorker(swTree, appTree) {
    const premberOptions = this.app.options['prember'];
    // Make sure we only do this stuff if prember is enabled
    if (premberOptions && (premberOptions.enabled || (this.app.env === 'production' || process.env.PREMBER))) {
      const eswPremberOptions = this.app.options['esw-prember'];
      const configFile = new Config(appTree, {env: this.app.env, ...eswPremberOptions});

      return mergeTrees([swTree, configFile]);
    }
  }
};
