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
 *     additional assets can be copied (for example, from "src -> www").
 *   - The names of all the files and paths are not hard-coded; you can change
 *     them below to match your configuration.
 *
 ******************************************************************************/

var path = require("path"),
    fs = require("fs"),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    CopyWebpackPlugin = require("copy-webpack-plugin");

var src = path.resolve(__dirname, "www.src"),
    assetsToCopy = [];

/*
 * These files and globs will be copied if using the external configuration
 * (src -> www).
 *
 * For full information, see https://github.com/kevlened/copy-webpack-plugin
 ******************************************************************************/
var assetsToCopyIfExternal = [
    { from: "*.html" },
    { from: "img/**/*" },
    { from: "css/**/*" },
    { from: "js/**/*" },
    { from: "vendor/**/*" },
    { from: "lib/**/*" },
    { from: "html/**/*" },
];

if (!fs.existsSync(src)) {
    src = path.resolve(__dirname, "www");
} else {
    assetsToCopy = assetsToCopyIfExternal;
}

/*
 * it is assumed that you will be using "es/*.js" for ES2015+, "ts/*.ts" for
 * TypeScript, and "scss/*.scss" for SASS. You can change these as needed.
 ******************************************************************************/
var sourcePaths = {
    src: src,
    es: "es",
    ts: "ts",
    scss: "scss"
};

/*
 * It is assumed that your output is going to "www", and that the JavaScript
 * (or TypeScript) should be stored in "www/js", and that any generated CSS
 * should be stored in "www/css".
 ******************************************************************************/
var outputPaths = {
    www: "www",
    js: "js",
    css: "css"
}

/*
 * Feel free to change the following if these assumptions are incorrect:
 *   - If you are using SASS, the entry file will be named "styles.scss" and
 *     will be copied to bundle.css
 *   - If you are using ES2015+, the entry file will be named "index.js" and
 *     will be copied to bundle.js
 *   - If you are using TypeScript, the entry file will be named "index.ts"
 *     and will be copied to bundle.js
 ******************************************************************************/
var indexes = {
    scss: { from: path.join(sourcePaths.scss, "styles.scss"), to: path.join(outputPaths.css, "bundle.css") },
      es: { from: path.join(sourcePaths.es, "index.js"), to: path.join(outputPaths.js, "bundle.js") },
      ts: { from: path.join(sourcePaths.ts, "index.ts"), to: path.join(outputPaths.js, "bundle.js") },
}

/*
 * If you're just changing file and path names, you don't need to proceed any
 * further. If you need to change the logic, proceed.
 ******************************************************************************/

var usingTypeScript = fs.existsSync(path.resolve(sourcePaths.src, sourcePaths.ts));

var jsEntryFile = usingTypeScript ? indexes.ts.from : indexes.es.from,
    sassEntryFile = indexes.scss.from,
    outputFile = usingTypeScript ? indexes.ts.to : indexes.es.to,
    extractSass = new ExtractTextPlugin(indexes.scss.to);

var entryFiles = ["./" + jsEntryFile];

if (fs.existsSync(path.resolve(sourcePaths.src, sassEntryFile))) {
    entryFiles.push("./" + sassEntryFile);
}

module.exports = {
    context: sourcePaths.src,
    entry: entryFiles,
    devtool: "inline-source-map",
    output: {
        filename: outputFile,
        path: outputPaths.www,
    },
    module: {
        rules: [
            { test: /\.(html|txt)$/, use: "raw-loader" },
            { test: /\.(png|jpg|svg)$/, use: ["file-loader"]},
            { test: /\.(json|json5)$/, use: "json5-loader" },
            {
                test: /\.scss$/,
                use: extractSass.extract({
                    fallback: "style-loader",
                    use: [
                             { loader: "css-loader?sourceMap=true&import=false&url=false"},
                             { loader: "resolve-url-loader?sourceMap=true"},
                             { loader: "sass-loader?sourceMap=true"}
                            ]
                })
            },
            {
                test: /\.(ts|js)$/,
                use: [ "ts-loader" + (usingTypeScript ? "" : "?entryFileIsJs") ],
                exclude: /node_modules/
            },
        ]
    },
    plugins: [
        extractSass,
        new CopyWebpackPlugin(assetsToCopy)
    ]
}