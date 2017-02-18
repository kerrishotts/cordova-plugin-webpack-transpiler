var path = require("path"),
    fs = require("fs");

var wwwFolder = path.resolve(__dirname, "www"),
    siblingESFolder = path.resolve(wwwFolder, "esm"),
    externalESFolder = path.resolve(__dirname, "esm"),
    entryPath = fs.existsSync(externalESFolder) ? externalESFolder : siblingESFolder,
    tsEntry = path.resolve(entryPath, "index.ts"),
    jsEntry = path.resolve(entryPath, "index.js"),
    outputPath = path.resolve(wwwFolder, "js"),
    jsBundleName = "app.bundle.js",
    entryFile = fs.existsSync(tsEntry) ? tsEntry : jsEntry;

module.exports = {
    context: entryPath,
    entry: entryFile,
    devtool: "inline-source-map",
    output: {
        filename: jsBundleName,
        path: outputPath
    },
    module: {
        loaders: [
            {
                test: /\.(ts|js)$/,
                loader: "ts-loader",
                exclude: /node_modules/,
                options: {
                    entryFileIsJs: entryFile === jsEntry
                }
            }
        ]
    }
}