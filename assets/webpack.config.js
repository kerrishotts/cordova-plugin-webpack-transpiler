var path = require("path"),
    fs = require("fs"),
    wwwFolder = path.resolve(__dirname, "www"),
    entryPath = path.resolve(wwwFolder, "esm");
    tsEntry = path.resolve(entryPath, "index.ts"),
    jsEntry = path.resolve(entryPath, "index.js"),
    outputPath = path.resolve(wwwFolder, "js"),
    jsBundleName = "index.js",
    entryFile = fs.existsSync(tsEntry) ? tsEntry : jsEntry;

module.exports = {
    context: wwwFolder,
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
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    entryFileIsJs: entryFile === jsEntry
                }
            }
        ]
    }
}