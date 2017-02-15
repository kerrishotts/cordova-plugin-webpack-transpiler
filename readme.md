# Webpack and Typescript Cordova Plugin

Transpiles your Typescript and/or JavaScript files and bundles them with Webpack _automagically_!

> **NOTE:** This is _experimental_! It works on my machine -- which means it might blow your installation away. Review the contents of the scripts folder **before** installing it -- make sure you trust the code herein!

## Requirements

Node and npm must be installed and available in the path, and your computer must be able to install packages from npm.

> **NOTE:** This plugin will **NOT** work with PhoneGap Build. Sorry. :cry:

## Installation

Add the plugin to your Cordova project:

```
$ cordova plugin add cordova-plugin-webpack-typescript
```

> **Note:** Adding this to your project will call `npm init` to create a `package.json` if it doesn't already exist. You'll almost certainly want to fix the generated file, so you should do so after adding.

After the plugin is added, you'll have two new configuration files in your project root:

* `webpack.config.js` - the default configuration for webpack
* `tsconfig.json` - the default typescript configuration

> **Note:** If these files are already present in your project root, _they will not be modified_.

### Plugin discovery during `prepare`

If this plugin is discovered to be missing during the `prepare` phase, the command that triggered the `prepare` will be executed after installation. This currently occurs only with `prepare`, `build`, `run`, and `emulate`. The reason is because `before_prepare` is already missed by the time the discovery phase occurs, which means that the transformations this plugin performs cannot occur. This results in an incomplete project state (which might cause your build to be incorrect).

## Usage

Place your TypeScript & ES2015+ files in `www/esm`, with `index.js` or `index.ts` as the entry to your app. If `index.ts` exists, it will be used as the preferred entry point, otherwise `index.js` will be used.

You should source `www/js/app.bundle.js` in your `www/index.html` file; the bundle will be named `www/js/app.bundle.js`.

Prior to `cordova prepare`, your files in `www/esm` will be transpiled, and then bundled with webpack, with the output being copied to `www/js`.

> **Note:** If, during this step, Cordova needs to install the plugin, the "before prepare" step will not occur. You'll need to execute another `cordova prepare` in order to get the plugin to work.

After the transformation, the JavaScript or TypeScript files in each platform's `www/esm` folder will be removed. The project root's `www/esm` folder remains intact. This is to avoid copying unnecessary files to the application bundle when built.

### Debug vs Release

The plugin watches for a `--release` switch on the command line; if it is detected the following occurs:

* Minification is turned on
* Sourcemaps are turned off

If you need to change this behavior, you can override it by copying `webpack.config.js` in your project root to `webpack.release.config.js` and making the desired changes.

> **Note:** Webpack will currently throw a warning due to the way UglifyJS works.

### Modifying the configuration files

If you wish to modify `webpack.config.js`, `webpack.release.config.js`, or `tsconfig.json`, you can. The plugin will not attempt to override their contents, and it won't attempt to overwrite the files on a reinstall.

## Removing the plugin

If you find that you need to remove the plugin, you can remove it via `cordova plugin rm`. However you'll need to clean up the files that this plugin creates if you wish to be rid of all trace. This means removing (unless you have since modified):

* `node_modules`
* `package.json`
* `tsconfig.json`
* `webpack.config.js`
* `webpack.release.config.js`

# License

Apache 2.0.
