const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    mode:
      argv.mode || (env && env.WEBPACK_SERVE ? "development" : "production"),
    entry: "./src/index.ts",
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
      publicPath: isProduction ? "./" : "/",
    },
    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        "@": path.resolve(__dirname, "src/"),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|mp3|wav|ogg|ttf|woff|woff2)$/i,
          type: "asset/resource",
          generator: {
            filename: "assets/[hash][ext][query]",
          },
        },
      ],
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      compress: true,
      port: 8080,
      open: true,
      hot: true,
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        filename: "index.html",
        inject: "body",
        title: "Phaser Game",
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "src/assets", to: "assets", noErrorOnMissing: true },
        ],
      }),
    ],
    performance: {
      hints: isProduction ? "warning" : false,
    },
    stats: "minimal",
  };
};
