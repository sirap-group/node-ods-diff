# node-ods-diff [![NPM version](https://badge.fury.io/js/ods-diff.svg)](https://npmjs.org/package/ods-diff) [![Build Status](https://travis-ci.org/sirap-group/node-ods-diff.svg?branch=master)](https://travis-ci.org/sirap-group/node-ods-diff)

> Highlight the diff between two LibreOffice spreadsheets with the simple `node` and `CLI` interfaces of `ods-diff`.

[![Standard - JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

> **Warning**
>
> - The repository name is `node-ods-diff` to show it is a node.js module
```sh
$ git clone https://github.com/sirap-group/node-ods-diff
```
> - The package name is `ods-diff` because we are in node.js context
```sh
$ npm i -s odf-diff
```
```js
const odsDiff = require('ods-diff')
```
> - The CLI command is `odsdiff`, because it is more standard as a *nix CLI tool and
```sh
$ npm i -g odf-diff
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

## License

MIT © [Rémi Becheras](https://github.com/rbecheras), [Groupe SIRAP](https://github.com/sirap-group)
