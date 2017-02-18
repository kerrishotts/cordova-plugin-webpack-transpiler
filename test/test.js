/* global describe, it, beforeEach, afterEach, __dirname, tempdir, cd, exec, ls, cp, rm */
require("shelljs/global");
var path = require("path");
var expect = require("chai").expect;

var pluginDir = process.cwd();
var tmp = tempdir();

var PROJECT_NAME = "test";

function createCordovaProject() {
    cd(tmp);
    exec("cordova create " + PROJECT_NAME + " com.example." + PROJECT_NAME + " " + PROJECT_NAME + " ");
    cd(path.join(tmp, PROJECT_NAME));
    exec("cordova platform add ios android");
    expect(ls("*.*").length).to.be.greaterThan(0);
}

function removeCordovaProject() {
    cd(tmp);
    rm("-rf", path.join(tmp, PROJECT_NAME));
}

function addPlugin(transpiler, mode) {
    if (!transpiler && !mode) {
        exec("cordova plugin add --save " + pluginDir);
        transpiler = "typescript";
        mode = "sibling";
    } else {
        if (!transpiler) { transpiler = "typescript"; }
        if (!mode) { mode = "sibling"; }
        exec("cordova plugin add --save " + pluginDir + " --variable TRANSPILER=" + transpiler + " --variable MODE=" + mode);
    }
    expect(ls("plugins/cordova-plugin-webpack-transpiler/*.*").length).to.be.greaterThan(0);
}

function copyAssets(whichExample, mode) {
    if (!whichExample) {
        whichExample = "example-ts"
    }
    if (!mode) {
        mode = "sibling"
    }
    if (mode === "sibling") {
        cp("-rf", path.join(pluginDir, whichExample, "www", "esm"), path.join(tmp, PROJECT_NAME, "www"));
    } else {
        cp("-rf", path.join(pluginDir, whichExample, "www", "esm"), path.join(tmp, PROJECT_NAME));
    }
}

function checkTranspileOutputs(transpiler) {
    // make sure configuration is present
    expect(ls("webpack.config.js").length).to.be.greaterThan(0);
    switch (transpiler) {
        case "babel":
            expect(ls(".babelrc").length).to.be.greaterThan(0);
            break;
        case "typescript":
        default:
            expect(ls("tsconfig.json").length).to.be.greaterThan(0);
            break;
    }

    // make sure transpilation happened
    it("should have generated a bundle", function() {
        expect(ls(path.join(tmp, "www","js","app.bundle.js")).length).to.be.equal(1);
    });
    expect(ls("platforms/ios/www/js/app.bundle.js").length).to.be.equal(1);
    expect(ls("platforms/ios/www/esm").length).to.be.equal(0);
}

function transpile(whichExample, transpiler, mode) {
    copyAssets(whichExample, mode);
    var r = exec("cordova prepare");
    expect(r.stdout.match(/app\.bundle\.js.*emitted/)).to.not.be.null();
    checkTranspileOutputs(transpiler);
}

describe ("Black box tests", function () {

    describe("Create project using default configuration", function() {
        this.timeout(1200000); // 2 minutes
        it("Should be able to create a Cordova project", function() { createCordovaProject(); });
        it("Should be able to add this plugin", function() { addPlugin(); });
        it("Should be able to transpile", function() { transpile("example-ts", "typescript", "sibling"); });
        it("Clean up", function() { removeCordovaProject(); });
    });

    describe("Create project using typescript & sibling", function() {
        this.timeout(1200000); // 2 minutes
        it("Should be able to create a Cordova project", function() { createCordovaProject(); });
        it("Should be able to add this plugin", function() { addPlugin("typescript", "sibling"); });
        it("Should be able to transpile", function() { transpile("example-ts", "typescript", "sibling"); });
        it("Clean up", function() { removeCordovaProject(); });
    });

    describe("Create project using babel & sibling", function() {
        this.timeout(1200000); // 2 minutes
        it("Should be able to create a Cordova project", function() { createCordovaProject(); });
        it("Should be able to add this plugin", function() { addPlugin("babel", "sibling"); });
        it("Should be able to transpile", function() { transpile("example-babel", "babel", "sibling"); });
        it("Clean up", function() { removeCordovaProject(); });
    });

    describe("Create project using typescript & external", function() {
        this.timeout(1200000); // 2 minutes
        it("Should be able to create a Cordova project", function() { createCordovaProject(); });
        it("Should be able to add this plugin", function() { addPlugin("typescript", "external"); });
        it("Should be able to transpile", function() { transpile("example-ts", "typescript", "external"); });
        it("Clean up", function() { removeCordovaProject(); });
    });

    describe("Create project using babel & external", function() {
        this.timeout(1200000); // 2 minutes
        it("Should be able to create a Cordova project", function() { createCordovaProject(); });
        it("Should be able to add this plugin", function() { addPlugin("babel", "external"); });
        it("Should be able to transpile", function() { transpile("example-babel", "babel", "external"); });
        it("Clean up", function() { removeCordovaProject(); });
    });
});