const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const dotenv = require("dotenv");
const webpack = require("webpack");

const env = dotenv.config().parsed;

const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = {
  output: {
    path: path.join(__dirname, "/dist"), // the bundle output path
    filename: "bundle.[contenthash].js", // the name of the bundle
    clean: true,
    publicPath: "/", // Ensures proper paths for assets
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html", // to import index.html file inside index.js
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "public", to: "" }, // Copies 'public' directory to 'dist'
      ],
    }),
    new webpack.DefinePlugin(envKeys),
  ],
  devServer: {
    port: 3031, // you can change the port
    historyApiFallback: true, // For single-page applications
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // .js and .jsx files
        exclude: /node_modules/, // excluding the node_modules folder
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.(sa|sc|c)ss$/, // styles files
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/, // to import images and fonts
        loader: "url-loader",
        options: { limit: false },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"], // Automatically resolve certain extensions
    modules: [path.resolve(__dirname, "src"), "node_modules"],
  },
};
