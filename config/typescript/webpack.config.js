var webpackCommonConfig = require("./webpack.common.js");

// NOTE: if you need to override any configurations, please see webpack.common.js
// and then override here!
module.exports = webpackCommonConfig.config(
    {
        allowTypeScript: true,
        allowScss: true,
        transpiler: "ts-loader",
        dirs: webpackCommonConfig.defaults.dirs,
        assetsToCopyIfExternal: webpackCommonConfig.defaults.assetsToCopyIfExternal,
        assetsToCopyIfInternal: webpackCommonConfig.defaults.assetsToCopyIfInternal,
        vendor: webpackCommonConfig.defaults.vendor
    }
);