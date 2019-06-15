const puppeteer = require('puppeteer');
const webpack = require('./webpack/testing.config');
const entry = './src/specs.ts';

process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = function (config) {

    config.set({

        webpack,
        basePath: '',
        files: [entry],
        preprocessors: {
            [entry]: ['webpack', 'sourcemap']
        },
        webpackMiddleware: {
            noInfo: true,
            stats: { chunks: false }
        },
        autoWatch: true,
        browsers: ['ChromeHeadless'],
        frameworks: ['mocha', 'chai', 'sinon'],
        reporters: ['mocha'],
        mochaReporter: {
            colors: {
                success: 'green',
                info: 'blue',
                warning: 'cyan',
                error: 'red'
            },
            symbols: {
                success: '+',
                info: '#',
                warning: '!',
                error: 'x'
            }
        },
        plugins: [
            'karma-webpack',
            'karma-mocha',
            'karma-chai',
            'karma-sinon',
            'karma-mocha-reporter',
            'karma-sourcemap-loader',
            'karma-chrome-launcher'
        ]
    });
}
