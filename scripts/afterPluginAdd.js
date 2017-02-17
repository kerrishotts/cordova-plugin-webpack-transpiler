#!/usr/bin/env node

module.exports = function(ctx) {
    var shell = ctx.requireCordovaModule("shelljs");

    // we need to rerun if we got added during a discovery phase
    if (["run", "emulate", "prepare", "build"].reduce(function (a, s) {
        if (!a && ctx.cmdLine.toLowerCase().indexOf(s) > -1) {
            return true;
        }
        return a;
    }, false)) {
        shell.exec(ctx.cmdLine);
    }
};