const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {

    mode: 'none',
    target: 'node',
    externals: [nodeExternals()],
    entry: path.join(__dirname, '../src/server.ts'),
    output: {
        filename: 'server.bundle.js',
        path: path.join(__dirname, '../dist/')
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    module: {
        exprContextCritical: false,
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: ['ts-loader']
            }
        ]
    }
};
