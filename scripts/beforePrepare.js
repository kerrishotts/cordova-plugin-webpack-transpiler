#!/usr/bin/env node

var webpack = require("webpack");

module.exports = function(ctx) {
    var shell = ctx.requireCordovaModule("shelljs"),
        path = ctx.requireCordovaModule("path"),
        fs = ctx.requireCordovaModule("fs"),
        Q = ctx.requireCordovaModule("q"),
        events = ctx.requireCordovaModule("cordova-common").events,
        debugWebpackConfigPath = path.join(ctx.opts.projectRoot, "webpack.config.js");
        releaseWebpackConfigPath = path.join(ctx.opts.projectRoot, "webpack.release.config.js");
        debugWebpackConfig = require(debugWebpackConfigPath),
        webpackConfig = undefined,
        deferral = new Q.defer();

    events.emit("info", "Starting webpack bundling and typescript transpilation phase...");
    if (ctx.cmdLine.indexOf("--release") > -1) {
        events.emit("verbose", "... building release bundle");
        if (fs.existsSync(releaseWebpackConfigPath)) {
            events.emit("verbose", "... ... with existing release webpack config");
            var releaseWebpackConfig = require(releaseWebpackConfigPath);
            webpackConfig = Object.assign({}, debugWebpackConfig, releaseWebpacConfig);
        } else {
            events.emit("verbose", "... ... with internal release webpack config");
            webpackConfig = Object.assign({}, debugWebpackConfig, {
                devtool: "none",
                plugins: [
                    new webpack.optimize.UglifyJsPlugin({
                        compress: true
                    })
                ]
            });
        }
    } else {
        events.emit("verbose", "... building debug bundle");
        webpackConfig = debugWebpackConfig;
    }

    webpack(webpackConfig, function(err, stats) {
        if (err || stats.hasErrors() || stats.hasWarnings()) {
            if (err) {
                events.emit("error", "Webpack generated an error!");
                events.emit("error", JSON.stringify(err.stack || err));
                if (err.details) {
                    events.emit("error", JSON.stringify(err.details));
                }
                deferral.reject(err);
            }
            if (stats.hasErrors()) {
                events.emit("error", "Webpack generated an error!");
                events.emit("error", JSON.stringify(stats.toJson().errors));
                deferral.reject(stats.toJson());
            }
            if (stats.hasWarnings()) {
                events.emit("warn", "Webpack generated warnings!");
                events.emit("warn", JSON.stringify(stats.toJson().warnings));
            }
        }
        events.emit("info", "... webpack bundling and typescript transpilation phase complete!");
        deferral.resolve();
    });

    return deferral.promise;
}
