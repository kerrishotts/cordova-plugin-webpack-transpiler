#!/usr/bin/env node

module.exports = function(ctx) {
    var shell = ctx.requireCordovaModule("shelljs"),
        path = ctx.requireCordovaModule("path"),
        fs = ctx.requireCordovaModule("fs"),
        events = ctx.requireCordovaModule("cordova-common").events;

    events.emit("info", "Preparing to install dependencies -- this might take a few minutes");

    // check for existing package.json
    if (!fs.existsSync(path.join(ctx.opts.projectRoot, "package.json"))) {
        events.emit("verbose", "no package.json, so forcing npm init");
        if (shell.exec("npm init -y").code !== 0) {
            events.emit("error", "Could not init project; make sure node and npm are installed and available in the PATH");
            return;
        }
    } else {
        events.emit("verbose", "not overwriting existing package.json!");
    }

    // install dependencies
    events.emit("verbose", "npm install");
    if (shell.exec("npm install --save-dev webpack ts-loader typescript core-js").code !== 0) {
        events.emit("error", "Could not install dependencies; verify your internet connection");
        return;
    }

    // copy configurations
    events.emit("info", "Copying webpack and typescript configurations");
    if ([["webpack config", "webpack.config.js"],
         ["typescript config", "tsconfig.json"]]
        .reduce(function cp(errAcc, asset) {
            var cpFrom = path.join(__dirname, "..", "assets", asset[1]),
                cpTo = path.join(ctx.opts.projectRoot, asset[1]);
            try {
                // check for existence first! if present, don't overwrite
                if (!fs.existsSync(cpTo)) {
                    events.emit("verbose", "copying " + cpFrom + " to " + cpTo);
                    shell.cp(cpFrom, cpTo);
                } else {
                    events.emit("verbose", "Exists; not overwriting " + cpTo);
                }
            } catch (err) {
                events.emit("error", "Could not copy" + asset[0]);
                return err;
            }
            return errAcc;
        }, undefined) !== undefined) { return; }

    events.emit("info", "Initialization completed successfully");

    // and if this happens to be during commands, rerun them so that everything looks like it should
    if (["run", "emulate", "prepare", "build"].reduce(function (a, s) {
        if (!a && ctx.cmdLine.toLowerCase().indexOf(s) > -1) {
            return true;
        }
        return a;
    }, false)) {
        shell.exec(ctx.cmdLine);
    }
};