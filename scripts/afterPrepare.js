#!/usr/bin/env node

var common = require("./common.js");

module.exports = function(ctx) {
    var shell = ctx.requireCordovaModule("shelljs"),
        path = ctx.requireCordovaModule("path"),
        events = ctx.requireCordovaModule("cordova-common").events;

    var vars = common.getPluginVariables(ctx);

    if (vars.mode !== "sibling") {
        // no need to delete anything!
        return;
    }

    var filesToDelete;

    if (ctx.opts.projectRoot) {
        events.emit("info", "Removing bundle artifacts from prepared platforms...");
        try {
            filesToDelete = shell.find(path.join(ctx.opts.projectRoot))
                          .filter(function(file) {
                              return file.match(/platforms[\/|\\].+[\/|\\]www[\/|\\]esm[\/|\\].+\.(js|ts)$/);
                          });
            if (filesToDelete.length > 0) {
                filesToDelete = filesToDelete.map(function (file) {
                    return path.resolve(file);
                });
                shell.rm(filesToDelete);
            }
        } catch (err) {
            events.emit("verbose", "... could not remove bundle artifacts from platforms!");
        }
    }
}