var path = require("path"),
    fs = require("fs");

var wwwFolder = path.resolve(__dirname, "www"),
    siblingESFolder = path.resolve(wwwFolder, "esm"),
    externalESFolder = path.resolve(__dirname, "esm"),
    entryPath = fs.existsSync(externalESFolder) ? externalESFolder : siblingESFolder,
    outputPath = path.resolve(wwwFolder, "js"),
    jsBundleName = "app.bundle.js",
    entryFile = path.resolve(entryPath, "index.js");

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
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/
            }
        ]
    }
}