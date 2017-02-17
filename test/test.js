/* global describe, it, beforeEach, __dirname, tempdir, cd, exec, ls, cp */
var fs = require("fs");
var path = require("path");
require("shelljs/global");

var expect = require("chai").expect;

describe("Create project using default configuration", function() {
    var pluginDir = process.cwd();
    var tmp = tempdir();

    it("Should be able to create and transpile a simple Cordova project", function() {
        cd(tmp);
        exec("cordova create test com.example.test test --verbose");
        cd("test");
        exec("cordova platform add ios --verbose");
        expect(ls("*.*").length).to.be.greaterThan(0);

        it ("Should be able to add this plugin", function() {
            exec("cordova plugin add --verbose --save " + pluginDir);
            expect(ls("plugins/cordova-plugin-webpack-transpiler/*.*").length).to.be.greaterThan(0);
        });

        it ("Should be able to transpile by default", function() {
            // copy assets first
            cp("-rf", path.join(pluginDir, "example-ts", "www", "esm"), path.join(tmp, "test", "www"));

            exec("cordova prepare --verbose");

            // check outputs
            expect(ls("www/js/app.bundle.js").length).to.be.equal(1);
            expect(ls("platforms/ios/www/js/app.bundle.js").length).to.be.equal(1);
            expect(ls("platforms/ios/www/esm").length).to.be.equal(0);
        });

    });

});
