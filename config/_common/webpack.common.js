/*******************************************************************************
 *
 * cordova-plugin-webpack-transpiler webpack.config.js
 * ---------------------------------------------------
 *
 * Feel free to modify this file to your needs; it will not be overwritten by
 * the plugin unless you delete the file entirely.
 *
 * Notes:
 *
 *   - External/Sibling mode is detected automatically. When in External mode,
 *     additional assets can be copied (for example, from "www.src -> www").
 *   - The names of all the files and paths are not hard-coded; you can change
 *     them below to match your configuration.
 *
 ******************************************************************************/

// portions based on https://github.com/simonfl3tcher/react-progressive-web-app/blob/master/webpack.config.js

var path = require("path"),
    fs = require("fs"),
    webpack = require("webpack"),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    CopyWebpackPlugin = require("copy-webpack-plugin"),
    HtmlWebpackPlugin = require("html-webpack-plugin");

var extensions = [".js", ".ts", ".jsx", ".es", // typical JS extensions
    ".jsm", ".esm",               // jsm is node's ES6 module ext
    ".json",                      // some modules require json without an extension
    ".css", ".scss",              // CSS & SASS extensions
    "*"];                         // allow extensions on imports

var dirs = {
    css: "css",
    es: "es",
    external: "www.src",
    html: "html",
    img: "img",
    js: "js",
    lib: "lib",
    scss: "scss",
    ts: "ts",
    vendor: "vendor",
    www: "www",
    aliases: {
        Lib: "lib",
        Vendor: "vendor",
        Components: "$JS/components",
        Controllers: "$JS/controllers",
        Models: "$JS/models",
        Pages: "$JS/pages",
        Routes: "$JS/routes",
        Templates: "$JS/templates",
        Utilities: "$JS/util",
        Views: "$JS/views",
    }
}

/*
 * These files and globs will be copied if using the external configuration
 * (www.src -> www).
 *
 * For full information, see https://github.com/kevlened/copy-webpack-plugin
 ******************************************************************************/
var assetsToCopyIfExternal = [
    { from: "*.*" },
    { from: dirs.img + "/**/*" },
    { from: dirs.css + "/**/*" },
    { from: dirs.js + "/**/*" },
    { from: dirs.vendor + "/**/*" },
    { from: dirs.lib + "/**/*" },
    { from: dirs.html + "/**/*" },
];

var assetsToCopyIfSibling = [];

var vendor = [];

/*
 * If you're just changing file and path names, you don't need to proceed any
 * further. If you need to change the logic, proceed.
 ******************************************************************************/


function config(options) {
    var src = options.src,
        allowTypeScript = options.allowTypeScript || false,
        allowScss = options.allowScss || false,
        assetsToCopy = [],
        assetsToCopyIfExternal = options.assetsToCopyIfExternal,
        assetsToCopyIfSibling = options.assetsToCopyIfSibling,
        cssFallbackLoader = options.cssFallbackLoader || "style-loader",
        dirs = options.dirs,
        devtool = options.devtool || "inline-source-map",
        entryFiles = options.entryFiles,
        extensions = options.extensions || [
                ".js", ".ts", ".jsx", ".es", // typical JS extensions
                ".jsm", ".esm",               // jsm is node's ES6 module ext
                ".json",                      // some modules require json without an extension
                ".css", ".scss",              // CSS & SASS extensions
                "*"
                ],                         // allow extensions on imports
        indexes = options.indexes,
        mode = options.mode || process.env.NODE_ENV || "development",
        operatingMode = "external",
        outputFile = options.outputFile,
        outputPaths = options.outputPaths,
        sourcePaths = options.sourcePaths,
        transpiler = options.transpiler || (allowTypeScript ? "ts-loader" : "babel-loader"),
        vendor = options.vendor;

    /*
     * determine operating mode (external vs sibling)
     *****************************************************************************/
    if (!src) {
        src = path.resolve(__dirname, dirs.external);
        assetsToCopy = assetsToCopyIfExternal;
        operatingMode = "external";
    }
    if (!fs.existsSync(src)) {
        src = path.resolve(__dirname, dirs.www);
        assetsToCopy = assetsToCopyIfSibling;
        operatingMode = "sibling"
    }

    /*
    * it is assumed that you will be using "es/*.js" for ES2015+, "ts/*.ts" for
    * TypeScript, and "scss/*.scss" for SASS. You can change these as needed.
    ******************************************************************************/
    sourcePaths = Object.assign({}, {
        src: src,
        es: dirs.es,
        ts: dirs.ts,
        css: dirs.css,
        scss: dirs.scss
    }, sourcePaths ? sourcePaths : {});

    /*
    * It is assumed that your output is going to "www", and that the JavaScript
    * (or TypeScript) should be stored in "www/js", and that any generated CSS
    * should be stored in "www/css".
    ******************************************************************************/
    outputPaths = Object.assign({}, {
        www: dirs.www,
        js: dirs.js,
        css: dirs.css
    }, outputPaths ? outputPaths : {});

    /*
    * Feel free to change the following if these assumptions are incorrect:
    *   - If you are using SASS, the entry file will be named "styles.scss" and
    *     will be copied to bundle.css
    *   - If you are using ES2015+, the entry file will be named "index.js" and
    *     will be copied to bundle.js
    *   - If you are using TypeScript, the entry file will be named "index.ts"
    *     and will be copied to bundle.js
    ******************************************************************************/
    indexes = Object.assign({}, {
        css: { from: path.join(sourcePaths.css, "styles.css"), to: path.join(outputPaths.css, "bundle.css") },
        scss: { from: path.join(sourcePaths.scss, "styles.scss"), to: path.join(outputPaths.css, "bundle.css") },
        es: { from: path.join(sourcePaths.es, "index.js"), to: path.join(outputPaths.js, "bundle.js") },
        ts: { from: path.join(sourcePaths.ts, "index.ts"), to: path.join(outputPaths.js, "bundle.js") },
        vendor: { js: path.join(outputPaths.js, "vendor.js"), css: path.join(outputPaths.css, "vendor.css") }
    }, indexes ? indexes : {});

    // if allowTypeScript is true AND the typescript path in sourcePaths exists,
    // we'll assume we're using typescript
    var usingTypeScript = allowTypeScript && fs.existsSync(path.resolve(sourcePaths.src, sourcePaths.ts));

    // set up our entry files
    var jsEntryFile = usingTypeScript ? indexes.ts.from : indexes.es.from,
        cssEntryFile = allowScss ? indexes.scss.from : indexes.css.from;

    // define our extract plugins for CSS; if allowScss is true, we assume using scss/styles.scss
    var extractCss = new ExtractTextPlugin(allowScss ? indexes.scss.to : indexes.css.to),
        extractVendorCss = new ExtractTextPlugin(indexes.vendor.css);

    // If no output file specified, default to indexes.(es|ts).to
    if (!outputFile) {
        outputFile = usingTypeScript ? indexes.ts.to : indexes.es.to;
    }

    // if no entry files passed in, we need to come up with suitable defaults
    if (!entryFiles) {
        // include the javascript file
        entryFiles = { app: ["./" + jsEntryFile] };

        // and the (s)css file, if present
        if (fs.existsSync(path.resolve(sourcePaths.src, cssEntryFile))) {
            entryFiles.app.push("./" + cssEntryFile);
        }
    }

    // if vendors have been provided, add them to entryFiles
    if (vendor.length > 0) {
        entryFiles.vendor = vendor;
    }

    return {
        context: sourcePaths.src,
        entry: entryFiles,
        devtool: devtool,
        output: {
            filename: outputFile,
            path: outputPaths.www,
        },
        resolve: {
            extensions: extensions,
            modules: [
                path.resolve(sourcePaths.src, dirs.es, "lib"),
                path.resolve(sourcePaths.src, dirs.es, "vendor"),
                path.resolve(sourcePaths.src, dirs.ts, "lib"),
                path.resolve(sourcePaths.src, dirs.ts, "vendor"),
                path.resolve(sourcePaths.src, "lib"),
                path.resolve(sourcePaths.src, "vendor"),
                "node_modules"
            ],
            alias: Object.assign({}, (function getAliases() {
                var k, v, obj = {}, p;
                for (k in dirs.aliases) {
                    if (Object.prototype.hasOwnProperty.call(dirs.aliases, k)) {
                        v = dirs.aliases[k];
                        p = v;
                        if (v.substr(0,4) === "$JS/") {
                            p = path.join(usingTypeScript ? dirs.ts : dirs.es, v.substr(4));
                        }
                        obj["$" + k.toUpperCase()] = p;
                        obj[k] = p;
                    }
                }
                return obj;
            }()))
        },
        module: {
            rules: [
                // HTML & TEXT files should just be loaded as raw (included in bundle)
                { test: /\.(html|txt)$/, use: "raw-loader" },
                // Images and web fonts should be copied & file path returned
                // note: copying only occurs when in external mode
                {
                    test: /\.(png|jpe?g|svg|gif|eot|ttf|woff|woff2)$/,
                    use: ["file-loader?name=[path][name].[ext]&emitFile=" +
                      (operatingMode === "external" ? "true" : "false")]
                },
                // JSON/JSON5 should use the JSON5 loader and be included in bundle
                { test: /\.(json|json5)$/, use: "json5-loader" },
                // Extract our app's CSS into the bundle
                {
                    test: extractCss ? /\.s?css$/ : /\.css$/,
                    exclude: /node_modules\/.*\.css$/,
                    use: extractCss.extract({
                        fallback: cssFallbackLoader,
                        use: ((function () {
                            var arr = [
                                { loader: "css-loader?sourceMap=true" },
                                { loader: "resolve-url-loader?sourceMap=true" },
                            ];
                            if (cssEntryFile === indexes.scss.from && allowScss) {
                                arr.push({ loader: "sass-loader?sourceMap=true" });
                            }
                            return arr;
                        })())
                    })
                },
                // css files in node_modules are put into a vendor bundle
                {
                    test: /node_modules\/.*\.css$/,
                    use: extractVendorCss.extract({
                        fallback: cssFallbackLoader,
                        use: [
                            { loader: "css-loader?sourceMap=true" },
                            { loader: "resolve-url-loader?sourceMap=true" },
                        ]
                    })
                },
                // JavaScript / TypeScript code
                {
                    test: allowTypeScript ? /\.(js|jsx|ts|tsx)$/ : /\.(js|jsx)$/,
                    use: [transpiler + (allowTypeScript ? (usingTypeScript ? "" : "?entryFileIsJs") : "")],
                    exclude: /node_modules/
                },
            ]
        },
        plugins: (function () {
            var plugins = [
                new CopyWebpackPlugin(assetsToCopy),
                extractCss
            ];

            // only generate index.html with dependencies IF we're in external mode --
            // otherwise we'd overwrite our user's own index.html in www
            if (operatingMode === "external") {
                plugins.push(new HtmlWebpackPlugin({
                    filename: "index.html",
                    template: "index.html",
                    inject: true,
                    chunksSortMode: "dependency"
                }));
            }

            // only create the JS vendor chunk if we've been given vendors
            if (vendor.length > 0) {
                plugins.push(new webpack.optimize.CommonsChunkPlugin({
                    name: "vendor",
                    filename: indexes.vendor.js
                }));
            }

            return plugins;
        }())
    };
}

module.exports = {
    defaults: {
        dirs: dirs,
        extensions: extensions,
        assetsToCopyIfExternal: assetsToCopyIfExternal,
        assetsToCopyIfSibling: assetsToCopyIfSibling,
        vendor: vendor,
        transpiler: "ts-loader",
    },
    config: config
}