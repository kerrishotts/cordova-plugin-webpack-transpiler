# Webpack and Transpiler Cordova Plugin

Transpiles your files and bundles them with Webpack _automagically_!

> **NOTE:** This is _experimental_! It works on my machine -- which means it might blow your installation away. Review the contents of the scripts folder **before** installing it -- make sure you trust the code herein!

## Requirements

Node and npm must be installed and available in the path, and your computer must be able to install packages from npm.

> **NOTE:** This plugin will **NOT** work with PhoneGap Build. Sorry. :cry:

## Installation

Add the plugin to your Cordova project:

```
$ cordova plugin add --save cordova-plugin-webpack-transpiler
```

If you want to control the transpiler used, you can pass a variable:

```
$ cordova plugin add --save cordova-plugin-webpack-transpiler --variable TRANSPILER=babel|typescript
```

> **Note:** Adding this to your project will call `npm init` to create a `package.json` if it doesn't already exist. You'll almost certainly want to fix the generated file.

After the plugin is added, you'll have two new configuration files in your project root:

* `webpack.config.js` - the default configuration for webpack
* `tsconfig.json` - the default TypeScript configuration (when using the TypeScript transpiler)
* `.babelrc` - the default Babel configuration (when using the Babel transpiler)

> **Note:** If these files are already present in your project root, _they will not be modified_. If something isn't working as expected, check these configuration files!

### Changing the Transpiler

You can not change the transpiler on-the-fly as the appropriate configuration files will not be completely copied (`webpack.config.js` is shared between transpilers). If you need to change the transpiler, remove the plugin first, remove leftover configuration files and `node_modules`, and then add the plugin back.

### Plugin discovery during `prepare`

If this plugin is discovered to be missing during the `prepare` phase, the command that triggered the `prepare` will be executed after installation. This currently occurs only with `prepare`, `build`, `run`, and `emulate`. The reason is because `before_prepare` is already missed by the time the discovery phase occurs, which means that the transformations this plugin performs cannot occur. This results in an incomplete project state (which might cause your build to be incorrect).

## Usage

Place your TypeScript / ES2015+ files in `www/esm`, with `index.js` or `index.ts` as the entry to your app. If using the TypeScript transpiler and `index.ts` exists, it will be used as the preferred entry point, otherwise `index.js` will be used.

You should source `www/js/app.bundle.js` in your `www/index.html` file; the bundle will be named `www/js/app.bundle.js`.

Upon `cordova prepare` (or any command that invokes this step), your files in `www/esm` will be transpiled, and then bundled with webpack, with the output being copied to `www/js`.

After the transformation, the JavaScript or TypeScript files in each platform's `www/esm` folder will be removed. The project root's `www/esm` folder remains intact. This is to avoid copying unnecessary files to the application bundle when built.

### Sibling vs. External Mode

This plugin supports two project structures -- a _sibling_ structure where `www/esm` and `www/js` are siblings and an _external_ structure where `esm` is outside of the `www` directory (so, _parent's sibling_ technically). The transformation phase detects this structure automatically. By default, however, a cleanup script is executed that attempts to remove any traces of the `www/esm` contents from any platform builds. If you don't want this script to run, you can change the `MODE` variable to anything other than `sibling`, like so:

```
$ cordova plugin add --save cordova-plugin-webpack-transpiler --variable MODE=external
```

or

```xml
    <plugin name="cordova-plugin-webpack-transpiler">
        <variable name="TRANSPILER" value="typescript|babel" />
        <variable name="MODE" value="external" />
    </plugin>
```

### Debug vs Release

The plugin watches for a `--release` switch on the command line; if it is detected the following occurs:

* Minification is turned on
* Sourcemaps are turned off

If you need to change this behavior, you can override it by copying `webpack.config.js` in your project root to `webpack.release.config.js` and making the desired changes.

> **Note:** When using release mode, Webpack will currently throw a warning due to the way UglifyJS works. You can ignore the warning.

### Modifying the configuration files

If you wish to modify `webpack.config.js`, `webpack.release.config.js`, `.babelrc`, or `tsconfig.json`, you can. The plugin will not attempt to override their contents, and it won't attempt to overwrite the files on a reinstall. If you need to reset these configuration files, delete them and reinstall the plugin.

## Removing the plugin

If you find that you need to remove the plugin, you can remove it via `cordova plugin rm`. However you'll need to clean up the files that this plugin creates if you wish to be rid of all trace. This means removing (unless you have since modified):

* `node_modules`
* `package.json`
* `tsconfig.json`
* `.babelrc`
* `webpack.config.js`
* `webpack.release.config.js`

# Examples

See [Example project (Babel)](./example-babel) and [Example project(TypeScript)](./example-ts). Note that the example projects use `../` to install the plugin, not the plugin name. Your projects will use the plugin identifier instead.

# License

Apache 2.0.
