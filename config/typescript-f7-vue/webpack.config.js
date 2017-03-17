var webpackCommonConfig = require("./webpack.common.js");

var dirs = webpackCommonConfig.defaults.dirs;
dirs.aliases = Object.assign({}, dirs.aliases, {
    "components": "$JS/components",
    "vue$": "vue/dist/vue.esm.js"
});

// NOTE: if you need to override any configurations, please see webpack.common.js
// and then override here!
var webpackConfig = webpackCommonConfig.config(
    {
        allowTypeScript: true,
        allowScss: true,
        cssFallbackLoader: "vue-style-loader",
        transpiler: "ts-loader",
        dirs: dirs,
        extensions: [".vue"].concat(webpackCommonConfig.defaults.extensions),
        assetsToCopyIfExternal: webpackCommonConfig.defaults.assetsToCopyIfExternal,
        assetsToCopyIfInternal: webpackCommonConfig.defaults.assetsToCopyIfInternal,
        vendor: webpackCommonConfig.defaults.vendor.concat([
            "vue", "framework7", "framework7-vue", "core-js",
        ])
    }
);

webpackConfig.module.rules.push(
    { test: /\.vue$/, use: "vue-loader" }
);

// make additional changes as necessary to the webpack configuration
module.exports = webpackConfig;