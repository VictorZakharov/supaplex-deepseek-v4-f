const { merge } = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-cheap-module-source-map",
  devServer: {
    static: false,
    host: "127.0.0.1",
    // Keep 8080 as the default, but fall back to the next free port when it
    // is already in use. PORT can still be supplied when a fixed port is
    // required (for example, PORT=3000 npm start).
    port: process.env.PORT ?? "auto",
    hot: true,
    open: false,
  },
});
