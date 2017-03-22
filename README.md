<h1 style="text-align:center">
  node-ods-diff<br>
  <small> Highlight the diff between two LibreOffice spreadsheets with the simple `node` and `CLI` interfaces of `ods-diff`.</small>
</h1>
<p style="text-align:center">


[![NPM version](https://badge.fury.io/js/ods-diff.svg)](https://npmjs.org/package/ods-diff)

<br>
[![Build Status](https://travis-ci.org/sirap-group/node-ods-diff.svg?branch=master)](https://travis-ci.org/sirap-group/node-ods-diff)

[![Coverage Status](https://coveralls.io/repos/github/sirap-group/node-ods-diff/badge.svg?branch=master)](https://coveralls.io/github/sirap-group/node-ods-diff?branch=master)

<br>
[![build status](http://gitlab.sirap.fr/open-source/node-ods-diff/badges/master/build.svg)](http://gitlab.sirap.fr/open-source/node-ods-diff/commits/master)

[![coverage report](http://gitlab.sirap.fr/open-source/node-ods-diff/badges/master/coverage.svg)](http://gitlab.sirap.fr/open-source/node-ods-diff/commits/master)


<br>
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Semver 2.0](https://img.shields.io/badge/Versioning-Semver%202.0-brightgreen.svg)](http://semver.org/)


</p>



> **Note:**
>
> - The repository name is `node-ods-diff` to show it is a node.js module
```sh
$ git clone https://github.com/sirap-group/node-ods-diff
```
> - The package name is `ods-diff` because we are in node.js context
```sh
$ npm i -s ods-diff
```
```js
const odsDiff = require('ods-diff')
```
> - The CLI command is `odsdiff`, because it is more standard as a *nix CLI tool and
```sh
$ npm i -g ods-diff
```
```sh
$ odsdiff -v
1.1.0
```

## CLI

### Installation

```sh
$ npm install --global ods-diff
```

### Usage

Output version

```sh
$ odsdiff -V
0.1.0
```

Output usage help

```sh
$ odsdiff -h

  Usage: odsdiff [options]

  Options:

    -h, --help                    output usage information
    -V, --version                 output the version number
    -v, --verbose                 output all intermediate steps informations
    -o, --f1 <path>               path of the original file to diff from
    -m, --f2, <path>              path of the modified file to diff to
    -O, --out [<path>]            destination path for the .ods diff output file
    -d, --csv-delimiter [<char>]  change the character delimiter for the CSV intermediate files
```

Standard usage:

```sh
$ odsdiff --f1 ./docs/v1/report.ods --f2 ./docs/v2/report.ods --out ./docs/report.diff.ods
```

## Node API

### Installation

```sh
$ npm install --save ods-diff
```

### Usage

```js
const odsDiff = require('ods-diff')
const path = require('path')

const reportv1Path = path.resolve('./docs/v1/report.ods')
const reportv2Path = path.resolve('./docs/v2/report.ods')
const reportDiffPath = path.resolve('./docs/report.diff.ods')

const odsDiffOptions = {
  cvsDelimiter: ','     // default: ';'
  verbose: true,        // default: false
  out: reportDiffPath   // default patern: './<f1_basepath>/<f1_basename>__diff__<f2_basename>.ods'
}


odsDiff(reportv1Path, reportv2Path, odsDiffOptions)
.then(() => console.log('ODS diff file successfuly written: ' + reportDiffPath))
.catch(err => console.error(err))
```

## Contribute

### Pull Requests are welcome !

The code of the **Node.js API** is in `index.js`, and the code for the **CLI API** is located in `bin/cli.js`.

The code respects the [standard js code style](https://github.com/feross/standard), please follow it too.

[![Standard - JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Please note the following list of goals to achieve before starting to contribute.


### TODO:

- refactor `index.js` replacing most of the functions by prototypes and methods
- write unit tests
- setup gulp build with
    - js lint (standard)
    - run tests
    - run test coverage
    - watch changes then lint, test and coverage


## License

MIT © [Rémi Becheras](https://github.com/rbecheras), [Groupe SIRAP](https://github.com/sirap-group)
