# Webpack and Transpiler Cordova Plugin

Transpiles your files, converts your SCSS to CSS, and bundles it all with Webpack _automagically_!

> **NOTE:** This is _experimental_! It works on my machine and on Travis-CI &mdash; but it might blow your installation away. Review the contents of the scripts folder **before** installing it &mdash; make sure you trust the code herein!

## Requirements

* Node and npm must be installed and available in the path, and your computer must be able to install packages from npm.
    * If intending to use the Babel transpiler, you must have node 5+.
* Cordova or PhoneGap CLI installed
    * **NOTE**: This plugin will **NOT** work with PhoneGap Build. Sorry. :cry:

## Installation

Add the plugin to your Cordova project:

```
$ cordova plugin add --save cordova-plugin-webpack-transpiler
```

If you want to control the configuration used, you can pass a variable (available configurations are in [./config](./config)):

```
$ cordova plugin add --save cordova-plugin-webpack-transpiler --variable config=babel|typescript|...
```

> **Note:** Adding this to your project will call `npm init` to create a `package.json` if it doesn't already exist. You'll almost certainly want to change the generated file.

After the plugin is added, you'll have two new configuration files in your project root:

* `webpack.config.js` - the default configuration for webpack
* `webpack.common.js` - common webpack configuration (extended by webpack.config.js)
* `tsconfig.json` - the default TypeScript configuration (when using the TypeScript transpiler)
* `.babelrc` - the default Babel configuration (when using the Babel transpiler)

> **Note:** If these files are already present in your project root, _they will not be modified_. If something isn't working as expected, check these configuration files!

### Changing the Transpiler configuration

You can not change the transpiler configuration on-the-fly as the appropriate configuration files will not be completely copied (`webpack.config.js` and `webpack.common.js` is shared between transpilers). If you need to change the transpiler, remove the plugin first, remove the left over configuration files and `node_modules`, and then add the plugin back.

### Plugin discovery

If this plugin is discovered to be missing and added during a `prepare`, `build`, etc. command, the `prepare` phase has already been executed and has incorrect results. Therefore you should ***execute your previous command again*** to ensure correct results.

## Usage

Once you install the plugin, you should review the `webpack.config.js` and `webpack.common.js` files and the transpiler configuration files both to understand what the scripts will do and to verify that the paths and settings are as you desire. While the configuration will generally work as-is for a simple project, it is impossible to make a one-config-fits-all configuration. Unless otherwise unable, you should make changes in `webpack.config.js` (see `webpack.common.js` for overrideable structures).

Second, you need to determine your project structure. The plugin automatically recognizes two structures: `sibling` (or, internal) and `external`. The sibling structure expects your ES2015+/TypeScript code to be in a folder that is a sibling of the `www/js` folder (`www/es` for ES2015+, and `www/ts` for TypeScript). The external structure expects your code to be in a folder separate from `www` (by default, `www.src`). In the latter structure, ES2015+ code lives in `www.src/es` and TypeScript code lives in `www.src/ts`.

> **Note**: When using TypeScript, if you have `www.src/ts` (or `www/ts`), that will take precendence over `www.src/es` (or `www/es`). In this case your entry point will assumed to be `www(.src)/ts/index.ts`.

When using the external structure, you may desire to copy additional files and folders from `www.src` to `www`. The defaults are displayed below, but you can edit the `webpack.config.js` file to change this.

Once you've determined which structure you want to use, you'll need to populate it. The plugin is very particular about the names of your app's entry points (see below for defaults). You can change these if you wish by modifying `webpack.config.js`.

Sibling     |Configuration |      Entry Point           | Output
-----------:|-------------:|:---------------------------|:------------------
TypeScript  | `typescript` | `www/ts/index.ts`          | `www/js/bundle.js`
ES2015      | `typescript` | `www/es/index.js`          | `www/js/bundle.js`
            | `babel`      | `www/es/index.js`          | `www/js/bundle.js`
SCSS        | either       | `www/scss/styles.scss`     | `www/css/bundle.css`

External    |Configuration |      Entry Point           | Output
-----------:|-------------:|:---------------------------|:------------------
TypeScript  | `typescript` | `www.src/ts/index.ts`      | `www/js/bundle.js`
ES2015      | `typescript` | `www.src/es/index.js`      | `www/js/bundle.js`
            | `babel`      | `www.src/es/index.js`      | `www/js/bundle.js`
SCSS        | either       | `www.src/scss/styles.scss` | `www/css/bundle.css`
HTML        | either       | `www.src/*.html`           | `www/*.html`
CSS         | either       | `www.src/css/**/*`         | `www/css/**/*`
Images      | either       | `www.src/img/**/*`         | `www/img/**/*`
JavaScript  | either       | `www.src/js/**/*`          | `www/js/**/*`
Lib files   | either       | `www.src/lib/**/*`         | `www/lib/**/*`
Vendor files| either       | `www.src/vendor/**/*`      | `www/vendor/**/*`

Installing the plugin doesn't actually do anything beyond registering the hooks with Cordova. The plugin only transforms and copies code when you execute any Cordova command that triggers the `prepare` phase. This triggers two hooks: one works before the `prepare` phase and one works after.

The `before prepare` hook will transpile your code (and copy files when using the external structure). If an error occurs during this process, you'll be notified. If no error occurs, you should see the something that looks like this:

```text
Starting webpack bundling and transpilation phase...
(node:46414) DeprecationWarning: loaderUtils.parseQuery() received a non-string value which can be problematic, see https://github.com/webpack/loader-utils/issues/56
parseQuery() will be replaced with getOptions() in the next major version of loader-utils.
ts-loader: Using typescript@2.2.1 and /.../example-ts-ext/tsconfig.json
... webpack bundling and typescript transpilation phase complete!
Hash: 76ef6d9645fc284a7a9c
Version: webpack 2.2.1
Time: 1977ms
         Asset     Size  Chunks             Chunk Names
  js/bundle.js  22.6 kB       0  [emitted]  main
css/bundle.css  14.8 kB       0  [emitted]  main
    index.html  2.52 kB          [emitted]
  img/logo.png  21.8 kB          [emitted]
```

The output indicates that four assets were generated. (The paths are relative to your `www` folder.) The `bundle.*` files are transformed from your ES2015+/TypeScript or SCSS files. The other files are files that were copied (this example was from an project using the external structure).

> **Note**: If you are using the sibling project structure, an `after prepare` step will execute. This step removes duplicate files in the resulting platform build artifacts so that your original source files aren't needlessly copied to your app bundles.

Once you've successfully executed a `prepare` phase, you'll need to update your `index.html` file to reference `js/bundle.js` and `css/bundle.css` instead of your original entry files.

### Debug vs Release

The plugin watches for a `--release` switch on the command line; if it is detected the following occurs:

* Minification is turned on
* Sourcemaps are turned off

If you need to change this behavior, you can override it by copying `webpack.config.js` in your project root to `webpack.release.config.js` and making the desired changes.

### Modifying the configuration files

If you wish to modify `webpack.common.js`, `webpack.config.js`, `webpack.release.config.js`, `.babelrc`, or `tsconfig.json`, you can. The plugin will not attempt to override their contents, and it won't attempt to overwrite the files on a reinstall. If you need to reset these configuration files, delete them and reinstall the plugin.

> **Note**: You should prefer to override settings used by `webpack.common.js` in `webpack.config.js`.

## Removing the plugin

If you find that you need to remove the plugin, you can remove it via `cordova plugin rm`. However you'll need to clean up the files that this plugin creates if you wish to be rid of all trace. This means removing (unless you have since modified):

* `node_modules`
* `package.json`
* `tsconfig.json`
* `.babelrc`
* `webpack.common.js`
* `webpack.config.js`
* `webpack.release.config.js`

# Examples

                   Project type | Link
-------------------------------:|:----------------------------------
TypeScript, Sibling structure   | [./example-ts](./example-ts)
TypeScript, External structure  | [./example-ts-ext](./example-ts-ext)
Babel, Sibling structure        | [./example-babel](./example-ts)
Babel, External structure       | [./example-babel-ext](./example-ts-ext)

> **Note**: the example projects use `../` to install the plugin, not the plugin name. Your projects will use the plugin identifier instead.

# Built-in Webpack Loaders

The `webpack.config.js` files come with some useful loaders:

file pattern        | loader       | example
-------------------:|:------------:|:-----------------------------
*.json; *.json5     | json5-loader | `import pkg from "../../package.json";`
*.html; *.txt       | raw-loader   | `import template from "../templates/list-item.html";`
*.png; *.jpg; *.svg | file-loader  | `import icon from "../img/icon.svg";`

If a file pattern you need to import isn't matched with a loader, you can specify the loader directly:

```javascript
import xml from "raw-loader!../../config.xml";
```

# License

Apache 2.0.
