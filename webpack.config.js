const path = require('path');

module.exports = {
    entry: './src/liltag.ts',
    output: {
        filename: 'liltag.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'LilTag',
            type: 'umd',
            export: 'default',
        },
        globalObject: 'this',  // Ensure compatibility with various environments
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    mode: 'development',
    devtool: false,
};