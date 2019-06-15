const merge = require('webpack-merge');
const path = require('path');
const base = require('./base.config');

const config = {

    mode: 'development',
    entry: path.join(__dirname, '../src/specs.ts'),
    output: {
        filename: 'specs.js',
        path: path.join(__dirname, '../dist/')
    }
};

module.exports = merge(base, config);
