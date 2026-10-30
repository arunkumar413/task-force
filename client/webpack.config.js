const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const dotenv = require("dotenv");
const webpack = require("webpack");

dotenv.config({ path: path.join(__dirname, ".env") });

module.exports = (env, argv) => {
  const mode = argv.mode || "development";
  const isDev = mode === "development";
  const apiUrl = process.env.REACT_APP_API_URL || "/api";

  return {
    mode,
    output: {
      path: path.join(__dirname, "/dist"),
      filename: isDev ? "bundle.js" : "bundle.[contenthash].js",
      clean: !isDev,
      publicPath: "/",
    },
    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 300,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "src/index.html",
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: "public", to: "" }],
      }),
      new webpack.DefinePlugin({
        "process.env": `(${JSON.stringify({
          NODE_ENV: mode,
          REACT_APP_API_URL: apiUrl,
          REACT_APP_API_KEY: process.env.REACT_APP_API_KEY || "",
          IS_RR_BUILD_REQUEST: "",
        })})`,
      }),
      ...(isDev ? [new ReactRefreshWebpackPlugin({ overlay: false })] : []),
    ],
    devServer: {
      port: 3031,
      historyApiFallback: true,
      hot: true,
      liveReload: true,
      watchFiles: {
        paths: ["src/**/*", "public/**/*"],
        options: {
          ignored: /node_modules/,
        },
      },
      proxy: [
        {
          context: ["/api"],
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      ],
      client: {
        overlay: {
          errors: true,
          warnings: false,
          runtimeErrors: false,
        },
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
              plugins: isDev ? ["react-refresh/babel"] : [],
            },
          },
        },
        {
          test: /\.(sa|sc)ss$/,
          use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"],
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
        {
          test: /\.(png|woff|woff2|eot|ttf|svg)$/,
          loader: "url-loader",
          options: { limit: false },
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx"],
      modules: [path.resolve(__dirname, "src"), "node_modules"],
    },
  };
};

