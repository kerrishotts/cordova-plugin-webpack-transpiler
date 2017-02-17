var meta = require("../package.json");

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

    events.emit("verbose", "no package.json, so forcing npm init");
    if (!installPackageJSON(ctx)) {
        throw new Error("Could not init project; make sure node and npm are installed and available in the PATH");
    }
}

function projectHasRequiredDependencies(ctx, transpiler) {
    var fs = ctx.requireCordovaModule("fs"),
        path = ctx.requireCordovaModule("path");

    var deps = ["webpack"].concat(require(path.join("..", "assets", transpiler, "dependencies.js")));

    var allDepsPresent = deps.reduce(function (acc, dep) {
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

function installRequiredDependencies(ctx, transpiler) {
    var shell = ctx.requireCordovaModule("shelljs"),
        path = ctx.requireCordovaModule("path");

    var deps = ["webpack"].concat(require(path.join("..", "assets", transpiler, "dependencies.js")));

    return (shell.exec("npm install --save-dev " + deps.join(" ")).code === 0);
}

function installRequiredDependenciesIfNecessary(ctx, transpiler) {
    var events = ctx.requireCordovaModule("cordova-common").events;

    events.emit("verbose", "Checking if we need to install any dependencies...");
    if (projectHasRequiredDependencies(ctx, transpiler)) {
        events.emit("Verbose", "...dependencies met; no need to install");
        return;
    }
    events.emit("verbose", "... npm install");
    if (!installRequiredDependencies(ctx, transpiler)) {
        throw new Error("Could not install dependencies; verify your internet connection");
    }
    events.emit("verbose", "... npm install finished");
}

function projectHasRequiredConfigFiles(ctx, transpiler) {
    var fs = ctx.requireCordovaModule("fs"),
        path = ctx.requireCordovaModule("path");

    var assets = require(path.join("..", "assets", transpiler, "assets.js"));

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

function installRequiredConfigFiles(ctx, transpiler) {
    var shell = ctx.requireCordovaModule("shelljs"),
        fs = ctx.requireCordovaModule("fs"),
        path = ctx.requireCordovaModule("path"),
        events = ctx.requireCordovaModule("cordova-common").events;

    var assets = require(path.join("..", "assets", transpiler, "assets.js"));
    return (assets.reduce(function cp(errAcc, asset) {
                var cpFrom = path.join(__dirname, "..", "assets", transpiler, asset),
                    cpTo = path.join(ctx.opts.projectRoot, asset);
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

function installRequiredConfigFilesIfNecessary(ctx, transpiler) {
    var events = ctx.requireCordovaModule("cordova-common").events;
    events.emit("verbose", "Checking webpack and transpiler configurations...");
    if (projectHasRequiredConfigFiles(ctx, transpiler)) {
        events.emit("verbose", "... all files present; not copying");
        return;
    }
    installRequiredConfigFiles(ctx, transpiler);
    events.emit("verbose", "... configurations copied successfully");
}

function getPluginVariables(ctx) {
    var path = ctx.requireCordovaModule("path");

    var cordovaCommon = ctx.requireCordovaModule("cordova-common"),
        ConfigParser = cordovaCommon.ConfigParser,
        config = new ConfigParser(path.join(ctx.opts.projectRoot, "config.xml")),
        plugin = config.getPlugin(meta.name),
        varTranspiler = "typescript",
        varMode = "sibling";

    if (plugin && plugin.variables) {
        varTranspiler = plugin.variables.TRANSPILER || "typescript";
        varMode = plugin.variables.MODE || "sibling";
    }

    return {
        transpiler: varTranspiler,
        mode: varMode
    };
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
};