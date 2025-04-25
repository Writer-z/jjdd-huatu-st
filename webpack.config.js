const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';
    
    return {
        entry: path.join(__dirname, 'src/index.js'),
        output: {
            path: path.join(__dirname, 'dist/'),
            filename: `index.js`,
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    options: {
                        cacheDirectory: true,
                        presets: [
                            '@babel/preset-env',
                            ['@babel/preset-react', { runtime: 'automatic' }],
                        ],
                    },
                    loader: 'babel-loader',
                },
                {
                    test: /\.css$/,
                    use: [
                        isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                        'css-loader',
                    ],
                },
            ],
        },
        resolve: {
            extensions: ['.jsx', '.js'],
        },
        plugins: [
            new CleanWebpackPlugin({
                cleanStaleWebpackAssets: true,
            }),
            new MiniCssExtractPlugin({
                filename: 'styles.css',
            }),
        ],
        optimization: {
            minimize: !isDevelopment,
            minimizer: [new TerserPlugin({
                extractComments: false,
            })],
        },
        devtool: isDevelopment ? 'eval-source-map' : false,
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist'),
            },
            compress: true,
            port: 9000,
            hot: true,
        },
        watchOptions: {
            ignored: /node_modules/,
            poll: 1000, // 每秒检查一次变更
        },
    };
};
