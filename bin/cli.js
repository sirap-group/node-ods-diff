#!/usr/bin/env node
'use strict'

const cli = require('commander')
const chalk = require('chalk')

const pkg = require('../package.json')
const odsdiff = require('../index')

cli
.version(pkg.version)
.option('-v, --verbose', 'output all intermediate steps informations')
.option('-o, --f1 <path>', 'path of the original file to diff from')
.option('-m, --f2, <path>', 'path of the modified file to diff to')
.option('-O, --out [<path>]', 'destination path for the .ods diff output file')
.option('-d, --csv-delimiter [<char>]', 'change the character delimiter for the CSV intermediate files', ';')
.parse(process.argv)

// if program was called with no arguments, show help.
if (!process.argv.slice(2).length) {
  cli.help()
}

if (!cli.f1 || !cli.f2) {
  console.log(chalk.red('Options "--f1", "--f2" are required (or their short version).'))
  cli.help()
  process.exit(1)
}

let options = {
  verbose: cli.verbose,
  outputFilePath: cli.out,
  csvDelimiter: cli.csvDelimiter
}

odsdiff(cli.f1, cli.f2, options)
