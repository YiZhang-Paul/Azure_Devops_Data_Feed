const merge = require('webpack-merge');
const development = require('./development.config');

module.exports = merge(development, { mode: 'production' });
