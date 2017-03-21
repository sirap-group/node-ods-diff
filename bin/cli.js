#!/usr/bin/env node
'use strict'

const cli = require('commander')
const chalk = require('chalk')

const pkg = require('../package.json')
const odsdiff = require('../index')

cli
.version(pkg.version)
.option('-o, --f1 <path>', 'path of the original file to diff from')
.option('-m, --f2, <path>', 'path of the modified file to diff to')
.option('-O, --out [<path>]', 'destination path for the .ods diff output file')
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

odsdiff(cli.f1, cli.f2)
