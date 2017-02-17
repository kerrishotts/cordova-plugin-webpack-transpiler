/* global describe, it, beforeEach, afterEach, __dirname, tempdir, cd, exec, ls, cp, rm */
var fs = require("fs");
var path = require("path");
require("shelljs/global");

var expect = require("chai").expect;

var pluginDir = process.cwd();
var tmp = tempdir();

function createCordovaProject() {
    var name = "test";
    cd(tmp);
    exec("cordova create " + name + " com.example." + name + " " + name + " --verbose");
    cd("test");
    exec("cordova platform add ios --verbose");
    expect(ls("*.*").length).to.be.greaterThan(0);
}

function removeCordovaProject() {
    cd(tmp);
    rm("-rf", "test");
}

function addPlugin(transpiler, mode) {
    if (!transpiler && !mode) {
        exec("cordova plugin add --verbose --save " + pluginDir);
        transpiler = "typescript";
        mode = "sibling";
    } else {
        if (!transpiler) { transpiler = "typescript"; }
        if (!mode) { mode = "sibling"; }
        exec("cordova plugin add --verbose --save " + pluginDir + " --variable TRANSPILER=" + transpiler + " --variable MODE=" + mode);
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
        cp("-rf", path.join(pluginDir, whichExample, "www", "esm"), path.join(tmp, "test", "www"));
    } else {
        cp("-rf", path.join(pluginDir, whichExample, "www", "esm"), path.join(tmp, "test"));
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
    expect(ls("www/js/app.bundle.js").length).to.be.equal(1);
    expect(ls("platforms/ios/www/js/app.bundle.js").length).to.be.equal(1);
    expect(ls("platforms/ios/www/esm").length).to.be.equal(0);
}

function transpile(whichExample, transpiler, mode) {
    copyAssets(whichExample, mode);
    exec("cordova prepare --verbose");
    checkTranspileOutputs(transpiler);
}

describe ("Black box tests", function () {

    describe("Create project using default configuration", function() {
        this.timeout(1200000); // 2 minutes
        it("Should be able to create and transpile a simple Cordova project", createCordovaProject);
        it("Should be able to add this plugin", addPlugin.bind(this, undefined, undefined));
        it("Should be able to transpile", function() {
            transpile("example-ts", "typescript", "sibling");
            removeCordovaProject();
        });
    });

    describe("Create project using typescript & sibling", function() {
        this.timeout(1200000); // 2 minutes
        it("Should be able to create and transpile a simple Cordova project", createCordovaProject);
        it("Should be able to add this plugin", addPlugin.bind(this, "typescript", "sibling"));
        it("Should be able to transpile", function() {
            transpile("example-ts", "typescript", "sibling");
            removeCordovaProject();
        });
    });

    describe("Create project using babel & sibling", function() {
        this.timeout(1200000); // 2 minutes
        it("Should be able to create and transpile a simple Cordova project", createCordovaProject);
        it("Should be able to add this plugin", addPlugin.bind(this, "babel", "sibling"));
        it("Should be able to transpile", function() {
            transpile("example-babel", "babel", "sibling");
            removeCordovaProject();
        });
    });

    describe("Create project using typescript & external", function() {
        this.timeout(1200000); // 2 minutes
        it("Should be able to create and transpile a simple Cordova project", createCordovaProject);
        it("Should be able to add this plugin", addPlugin.bind(this, "typescript", "external"));
        it("Should be able to transpile", function() {
            transpile("example-ts", "typescript", "sibling");
            removeCordovaProject();
        });
    });

    describe("Create project using babel & external", function() {
        this.timeout(1200000); // 2 minutes
        it("Should be able to create and transpile a simple Cordova project", createCordovaProject);
        it("Should be able to add this plugin", addPlugin.bind(this, "babel", "external"));
        it("Should be able to transpile", function() {
            transpile("example-babel", "babel", "sibling");
            removeCordovaProject();
        });
    });
});