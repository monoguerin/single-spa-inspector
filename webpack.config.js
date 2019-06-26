const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    contentScript: "./src/content_script.js",
    backgroundScript: "./src/background_script.js",
    panel: "./src/panel.js",
    panelApp: "./src/panel-app.js"
  },
  plugins: [
    new CleanWebpackPlugin(["build"]),
    new CopyWebpackPlugin([
      { from: path.resolve(__dirname, "src/panel.html") },
      { from: path.resolve(__dirname, "src/main.html") }
    ])
  ],
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build")
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};
