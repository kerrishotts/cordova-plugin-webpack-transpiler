/* global describe, it,  __dirname, tempdir, cd, exec, ls, cp, rm */
require("shelljs/global");
var treeDirectory = require("tree-directory");
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

function removeBundle() {
    rm("-f", path.join(tmp, PROJECT_NAME, "www", "js", "bundle.js"));
    rm("-f", path.join(tmp, PROJECT_NAME, "www", "css", "bundle.css"));
}

function addPlugin(config) {
    if (!config) {
        exec("cordova plugin add --save " + pluginDir);
        config = "typescript";
    } else {
        if (!config) { config = "typescript"; }
        exec("cordova plugin add --save " + pluginDir + " --variable CONFIG=" + config);
    }

    // we'd expect some files here
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
        cp("-rf", path.join(pluginDir, whichExample, "www", "es"), path.join(tmp, PROJECT_NAME, "www"));
        cp("-rf", path.join(pluginDir, whichExample, "www", "scss"), path.join(tmp, PROJECT_NAME, "www"));
    } else {
        cp("-rf", path.join(pluginDir, whichExample, "www.src"), path.join(tmp, PROJECT_NAME));
    }
}

function checkTranspileOutputs(config, r, shouldHaveInited) {
    var regexp, matches, outputs = [];

    // make sure configuration is present
    expect(ls(path.join(tmp, PROJECT_NAME, "webpack.config.js")).length).to.be.greaterThan(0);
    expect(ls(path.join(tmp, PROJECT_NAME, "webpack.common.js")).length).to.be.greaterThan(0);
    switch (config) {
        case "babel":
            expect(ls(path.join(tmp, PROJECT_NAME, ".babelrc")).length).to.be.greaterThan(0);
            break;
        case "typescript":
        default:
            expect(ls(path.join(tmp, PROJECT_NAME, "tsconfig.json")).length).to.be.greaterThan(0);
            break;
    }

    // make sure transpilation happened
    expect(ls(path.join(tmp, PROJECT_NAME, "www","js","bundle.js")).length).to.be.equal(1);
    expect(ls(path.join(tmp, PROJECT_NAME, "www","css","bundle.css")).length).to.be.equal(1);
    expect(ls(path.join(tmp, PROJECT_NAME, "platforms", "ios", "www", "js", "bundle.js")).length).to.be.equal(1);
    expect(ls(path.join(tmp, PROJECT_NAME, "platforms", "ios", "www", "css", "bundle.css")).length).to.be.equal(1);
    expect(ls(path.join(tmp, PROJECT_NAME, "platforms", "android", "assets", "www", "js", "bundle.js")).length).to.be.equal(1);
    expect(ls(path.join(tmp, PROJECT_NAME, "platforms", "android", "assets", "www", "css", "bundle.css")).length).to.be.equal(1);

    // did cleanup happen?
    expect(ls(path.join(tmp, PROJECT_NAME, "platforms", "ios", "www", "es", "*.*")).length).to.be.equal(0);
    expect(ls(path.join(tmp, PROJECT_NAME, "platforms", "ios", "www", "scss", "*.*")).length).to.be.equal(0);
    expect(ls(path.join(tmp, PROJECT_NAME, "platforms", "android", "assets", "www", "es", "*.*")).length).to.be.equal(0);
    expect(ls(path.join(tmp, PROJECT_NAME, "platforms", "android", "assets", "www", "scss", "*.*")).length).to.be.equal(0);


    // check for correct output -- did anything get emitted? Was it big enough?
    regexp = /^\s*([\w\.\/]+)\s+([\d\.]+)\s(g|m|k)B\s+(\d)*\s+\[(\w+)\].*/gmi;
    while ((matches = regexp.exec(r.stdout)) !== null) {
        outputs.push(matches.slice(1));
    }
    expect(outputs).to.not.be.null;

    // check that we have the desired outputs
    if (outputs) {
        expect(outputs.reduce(function(acc, v) {
            return v[0] === "js/bundle.js" ? parseInt(v[1], 10) : acc;
        }, 0)).to.be.greaterThan(0.5);
    }

    // did we init correctly?
    regexp = new RegExp("forcing npm init");
    matches = regexp.exec(r.stdout);
    if (shouldHaveInited) {
        expect(matches).to.not.be.null;
    } else {
        expect(matches).to.be.null;
    }
}

function transpile(whichExample, config, mode, shouldHaveInited, releaseMode) {
    var r;
    if (shouldHaveInited === undefined) {
        shouldHaveInited = true;
    }

    removeBundle(); // so we can be sure later that anything generated is really from this next run
    copyAssets(whichExample, mode);

    cd(path.join(tmp, PROJECT_NAME));
    if (releaseMode) {
        r = exec("cordova prepare --release");
    } else {
        r = exec("cordova prepare");
    }

    checkTranspileOutputs(config, r, shouldHaveInited);
}

describe ("Black box tests", function () {

    [
        {
            name: "default configuration",
            addPluginParms: false,
            example: "example-ts",
            config: "typescript",
            mode: "sibling"
        },
        {
            name: "typescript:sibling",
            addPluginParms: true,
            example: "example-ts",
            config: "typescript",
            mode: "sibling"
        },
        {
            name: "babel:sibling",
            addPluginParms: true,
            example: "example-babel",
            config: "babel",
            mode: "sibling"
        },
        {
            name: "typescript:external",
            addPluginParms: true,
            example: "example-ts-ext",
            config: "typescript",
            mode: "external"
        },
        {
            name: "typescript-react:external",
            addPluginParms: true,
            example: "example-ts-ext-react",
            config: "typescript",
            mode: "external"
        },
        {
            name: "babel:external",
            addPluginParms: true,
            example: "example-babel-ext",
            config: "babel",
            mode: "external"
        },
    ].forEach(function (test) {
        describe("Create project using " + test.name, function() {
            this.timeout(1200000); // 2 minutes
            it("Should be able to create a Cordova project", function() { createCordovaProject(); });
            it("Should be able to add this plugin", function() {
                if (test.addPluginParms) {
                    addPlugin(test.config);
                } else {
                    addPlugin();
                }
            });
            it("Should be able to transpile", function() { transpile(test.example, test.config, test.mode); });
            if (test.mode === "external") {
                it("render www.src 1", function(done) {
                    treeDirectory(path.join(tmp, PROJECT_NAME, "www.src"))
                    .then(function(res) {
                        console.log(res);
                        done();
                    });
                });
            }
            it("render www 1", function(done) {
                treeDirectory(path.join(tmp, PROJECT_NAME, "www"))
                .then(function(res) {
                    console.log(res);
                    done();
                });
            });
            it("Should be able to transpile again (no init)", function() { transpile(test.example, test.config, test.mode, false); });
            if (test.mode === "external") {
                it("render www.src 2", function(done) {
                    treeDirectory(path.join(tmp, PROJECT_NAME, "www.src"))
                    .then(function(res) {
                        console.log(res);
                        done();
                    });
                });
            }
            it("render www 2", function(done) {
                treeDirectory(path.join(tmp, PROJECT_NAME, "www"))
                .then(function(res) {
                    console.log(res);
                    done();
                });
            });
            it("Should be able to transpile in release mode (no init)", function() { transpile(test.example, test.config, test.mode, false, true); });
            it("Clean up", function() { removeCordovaProject(); });
        });
    });
});