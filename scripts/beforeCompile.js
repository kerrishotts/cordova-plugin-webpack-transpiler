#!/usr/bin/env node

module.exports = function(ctx) {
    var shell = ctx.requireCordovaModule("shelljs"),
        path = ctx.requireCordovaModule("path"),
        fs = ctx.requireCordovaModule("fs"),
        events = ctx.requireCordovaModule("cordova-common").events;

    if (ctx.opts.projectRoot) {
        events.emit("info", "Removing bundle artifacts from prepared platforms...");
        try {
            var filesToDelete = shell.find(path.join(ctx.opts.projectRoot))
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