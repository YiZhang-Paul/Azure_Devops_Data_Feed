const path = require('path');

module.exports = {

    mode: 'none',
    target: 'node',
    entry: {
        server: path.join(__dirname, '../src/server.ts')
    },
    output: {
        filename: '[name].bundle.js',
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
