var OPMODE_SIBLING = "sibling",
    OPMODE_EXTERNAL = "external";

var meta = require("../package.json");

var baseDeps = {
                   "copy-webpack-plugin": "@4.0.1",
                   "css-loader": "@0.27.3",
                   "extract-text-webpack-plugin": "@2.0.0-rc.3",
                   "file-loader": "@0.10.1",
                   "json5": "@0.4.0",
                   "json5-loader": "@1.0.1",
                   "html-webpack-plugin": "@2.28.0",
                   "imports-loader": "@0.7.1",
                   "node-sass": "@4.5.0",
                   "raw-loader": "@0.5.1",
                   "resolve-url-loader": "@2.0.2",
                   "sass-loader": "@6.0.3",
                   "style-loader": "@0.13.2",
                   "webpack": "@2.2.1",
                   "worker-loader": "@0.8.0",
               };

function projectHasPackageJSON(ctx) {
    var path = ctx.requireCordovaModule("path"),
        fs = ctx.requireCordovaModule("fs");

    return (fs.existsSync(path.join(ctx.opts.projectRoot, "package.json")));
}

function installPackageJSON(ctx) {
    var shell = ctx.requireCordovaModule("shelljs");

    return (shell.exec("npm init -y").code === 0);
}

function installPackageJSONIfNecessary(ctx) {
    var events = ctx.requireCordovaModule("cordova-common").events;

    events.emit("verbose", "Checking for existence of package.json");

    if (projectHasPackageJSON(ctx)) {
        events.emit("verbose", "not overwriting existing package.json!");
        return;
    }

    events.emit("info", "... forcing npm init...");
    if (!installPackageJSON(ctx)) {
        throw new Error("Could not init project; make sure node and npm are installed and available in the PATH");
    }
}

function projectHasRequiredDependencies(ctx, config) {
    var fs = ctx.requireCordovaModule("fs"),
        path = ctx.requireCordovaModule("path");

    var deps = Object.assign({}, baseDeps, require(path.join("..", "config", config, "dependencies.js")));

    var allDepsPresent = Object.keys(deps).reduce(function (acc, dep) {
        if (acc === false) { return acc; } // once one module is missing, don't check more
        try {
            // we count a module as present if it is in node_modules
            return (fs.existsSync(path.join(ctx.opts.projectRoot, "node_modules", dep)));
        } catch (err) {
            // if an error occurs here, the module is probably missing
            return false;
        }
    }, true);

    return allDepsPresent;
}

function installRequiredDependencies(ctx, config) {
    var shell = ctx.requireCordovaModule("shelljs"),
        path = ctx.requireCordovaModule("path");

    var deps = Object.assign({}, baseDeps, require(path.join("..", "config", config, "dependencies.js")));
    deps = Object.keys(deps).map(function(dep) {
        return dep + deps[dep];
    });
    return (shell.exec("npm install --save-dev " + deps.join(" ")).code === 0);
}

function installRequiredDependenciesIfNecessary(ctx, config) {
    var events = ctx.requireCordovaModule("cordova-common").events;

    events.emit("verbose", "Checking if we need to install any dependencies...");
    if (projectHasRequiredDependencies(ctx, config)) {
        events.emit("Verbose", "...dependencies met; no need to install");
        return;
    }
    events.emit("info", "... running npm install");
    if (!installRequiredDependencies(ctx, config)) {
        throw new Error("Could not install dependencies; verify your internet connection");
    }
    events.emit("verbose", "... npm install finished");
}

function projectHasRequiredConfigFiles(ctx, config) {
    var fs = ctx.requireCordovaModule("fs"),
        path = ctx.requireCordovaModule("path");

    var assets = require(path.join("..", "config", config, "assets.js"));

    var allAssetsPresent = assets.reduce(function (acc, asset) {
        if (acc === false) { return acc; } // once one asset is missing, don't check more
        try {
            // we count an asset as present if it is in the project root
            return (fs.existsSync(path.join(ctx.opts.projectRoot, asset)));
        } catch (err) {
            // if an error occurs here, the asset is probably missing
            return false;
        }
    }, true)

    return allAssetsPresent;
}

function installRequiredConfigFiles(ctx, config) {
    var shell = ctx.requireCordovaModule("shelljs"),
        fs = ctx.requireCordovaModule("fs"),
        path = ctx.requireCordovaModule("path"),
        events = ctx.requireCordovaModule("cordova-common").events;

    var assets = require(path.join("..", "config", config, "assets.js"));
    return (assets.reduce(function cp(errAcc, asset) {
                var cpFrom = path.join(__dirname, "..", "config", config, asset),
                    cpTo = path.join(ctx.opts.projectRoot, path.basename(asset));
                try {
                    // check for existence first! if present, don't overwrite
                    if (!fs.existsSync(cpTo)) {
                        events.emit("verbose", "copying " + cpFrom + " to " + cpTo);
                        shell.cp(cpFrom, cpTo);
                    } else {
                        events.emit("verbose", "Exists; not overwriting " + cpTo);
                    }
                } catch (err) {
                    throw new Error("Could not copy" + asset);
                }
                return errAcc;
            }, undefined) !== undefined);
}

function installRequiredConfigFilesIfNecessary(ctx, config) {
    var events = ctx.requireCordovaModule("cordova-common").events;
    events.emit("verbose", "Checking webpack and transpiler configurations...");
    if (projectHasRequiredConfigFiles(ctx, config)) {
        events.emit("verbose", "... all files present; not copying");
        return;
    }
    events.emit("info", "... copying configuration files...");
    installRequiredConfigFiles(ctx, config);
    events.emit("verbose", "... configurations copied successfully");
}

function getPluginVariables(ctx) {
    var path = ctx.requireCordovaModule("path");

    var cordovaCommon = ctx.requireCordovaModule("cordova-common"),
        ConfigParser = cordovaCommon.ConfigParser,
        config = new ConfigParser(path.join(ctx.opts.projectRoot, "config.xml")),
        plugin = config.getPlugin(meta.name),
        varConfig = "typescript";

    if (plugin && plugin.variables) {
        varConfig = plugin.variables.CONFIG || "typescript";
    }

    return {
        config: varConfig
    };
}

function detectOperatingMode(ctx) {
    var fs = ctx.requireCordovaModule("fs"),
        path = ctx.requireCordovaModule("path");
    if (fs.existsSync(path.join(ctx.opts.projectRoot, "www.src"))) {
        return OPMODE_EXTERNAL;
    }
    return OPMODE_SIBLING;
}

module.exports = {
    projectHasPackageJSON: projectHasPackageJSON,
    installPackageJSON: installPackageJSON,
    installPackageJSONIfNecessary: installPackageJSONIfNecessary,
    projectHasRequiredDependencies: projectHasRequiredDependencies,
    installRequiredDependencies: installRequiredDependencies,
    installRequiredDependenciesIfNecessary: installRequiredDependenciesIfNecessary,
    projectHasRequiredCOnfigFiles: projectHasRequiredConfigFiles,
    installRequiredConfigFiles: installRequiredConfigFiles,
    installRequiredConfigFilesIfNecessary: installRequiredConfigFilesIfNecessary,
    getPluginVariables: getPluginVariables,
    detectOperatingmode: detectOperatingMode,
    OPMODE: {
        EXTERNAL: OPMODE_EXTERNAL,
        SIBLING: OPMODE_SIBLING
    }
};