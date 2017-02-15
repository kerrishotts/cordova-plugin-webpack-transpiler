#!/usr/bin/env node


/**
 *
 * Returns a prettified stringified representation of item
 * @param {any} item    the item to pretty print
 * @returns {string}    the pretty printed transformation
 */
function prettyPrint(item) {
    return JSON.stringify(item, null, 2);
}

module.exports = function(ctx) {

    /* eslint-disable global-require */
    // why? Because if we are linked to the plugin, node doesn't know how to find our
    // modules! So we have to have the project root directory and then resolve where
    // webpack lives. Fun, fun, fun!
    var webpack = require(ctx.opts.projectRoot + "/node_modules/webpack/lib/webpack.js");

    /* eslint-enable global-require */
    var path = ctx.requireCordovaModule("path"),
        fs = ctx.requireCordovaModule("fs"),
        Q = ctx.requireCordovaModule("q"),
        events = ctx.requireCordovaModule("cordova-common").events;

    var debugWebpackConfigPath = path.join(ctx.opts.projectRoot, "webpack.config.js"),
        releaseWebpackConfigPath = path.join(ctx.opts.projectRoot, "webpack.release.config.js"),
        webpackConfig,
        deferral = Q.defer();

    /* eslint-disable global-require */
    var debugWebpackConfig = require(debugWebpackConfigPath);
    var releaseWebpackConfig;

    /* eslint-enable global-require */

    events.emit("info", "Starting webpack bundling and typescript transpilation phase...");

    if (ctx.cmdLine.toLowerCase().indexOf("--release") > -1) {
        // release mode gets different settings
        events.emit("verbose", "... building release bundle");
        if (fs.existsSync(releaseWebpackConfigPath)) {
            // use user-provided webpack settings if they exist

            /* eslint-disable global-require */
            releaseWebpackConfig = require(releaseWebpackConfigPath);

            /* eslint-enable global-require */
            events.emit("verbose", "... ... with existing release webpack config");
            webpackConfig = Object.assign({}, debugWebpackConfig, releaseWebpackConfig);
        } else {
            // otherwise use some basic defaults (uglify & no source maps)
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
        // use the debug configuration
        events.emit("verbose", "... building debug bundle");
        webpackConfig = debugWebpackConfig;
    }

    webpack(webpackConfig, function(err, stats) {
        var prettyStats = stats.toString({chunks: false, colors: false});
        if (err || stats.hasErrors() || stats.hasWarnings()) {
            if (err) {
                events.emit("error", "Webpack generated an error!");
                events.emit("error", prettyPrint(err.stack || err));
                if (err.details) {
                    events.emit("error", prettyPrint(err.details));
                }
                deferral.reject(err);
            }
            if (stats.hasErrors()) {
                events.emit("error", "Webpack generated an error!");
                events.emit("error", prettyStats);
                deferral.reject(stats);
            }
            if (stats.hasWarnings()) {
                events.emit("warn", "Webpack generated warnings!");
                events.emit("warn", prettyStats);
            }
        }
        events.emit("info", "... webpack bundling and typescript transpilation phase complete!");
        events.emit("info", prettyStats);
        deferral.resolve();
    });

    return deferral.promise;
}
