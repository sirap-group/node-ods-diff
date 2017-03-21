'use strict'

const fs = require('fs')
const path = require('path')
const del = require('delete')
const unzip = require('unzip')
const xml2js = require('xml2js')
const chalk = require('chalk')
const copydir = require('copy-dir')
const archiver = require('archiver')
const jsdiff = require('diff')

const CELL_STYLE_ADDED_LINE = 'odsdiff_addedline'
const CELL_STYLE_ADDED_LINE_COLOR = '#00ff66'

const CELL_STYLE_REMOVED_LINE = 'odsdiff_removedline'
const CELL_STYLE_REMOVED_LINE_COLOR = '#ff9999'

const CSV_DELIMITER = ';'

module.exports = odsDiff

function odsDiff (baseFilePath, updatedFilePath) {
  const baseFilePathParsed = path.parse(baseFilePath)
  const updatedFilePathParsed = path.parse(updatedFilePath)

  const outputFileName = baseFilePathParsed.name.concat('__diff__', updatedFilePathParsed.name, baseFilePathParsed.ext)
  const outputFilePath = path.join(baseFilePathParsed.dir, outputFileName)

  const baseExtractedDir = path.join(baseFilePathParsed.dir, baseFilePathParsed.name.concat('_files'))
  const updatedExtractedDir = path.join(updatedFilePathParsed.dir, updatedFilePathParsed.name.concat('_files'))
  const outputExtractedDir = outputFilePath.concat('_files')

  const baseXmlFilePath = path.join(baseExtractedDir, 'content.xml')
  const updatedXmlFilePath = path.join(updatedExtractedDir, 'content.xml')
  const outputXmlFilePath = path.join(outputExtractedDir, 'content.xml')

  console.log(chalk.blue('\n---'))
  console.log(chalk.blue('ods-diff: Make a diff between two .ods files.'))
  console.log(chalk.blue('MIT © Groupe SIRAP (https://github.com/sirap-group/node-ods-diff)'))
  console.log('> Original file path: ' + path.resolve(baseFilePath))
  console.log('> Modified file path: ' + path.resolve(updatedFilePath))
  console.log('> output file path:    ' + path.resolve(outputFilePath))
  console.log(chalk.blue('---\n'))

  // Clean dir and unzip ods files to handle their XML content
  Promise.all([
    del.promise([baseExtractedDir])
    .then(() => extractFile(baseFilePath, baseExtractedDir)),

    del.promise([updatedExtractedDir])
    .then(() => extractFile(updatedFilePath, updatedExtractedDir))
  ])

  // prepare the source files directory output
  .then(() => {
    console.log(chalk.blue('\nCreate a working directory for the output source files, a copy of the origin ods extraction folder:'))
    console.log(chalk.blue('\\_ ').concat(baseExtractedDir, chalk.blue(' => '), outputExtractedDir))
    return new Promise((resolve, reject) => {
      copydir(baseExtractedDir, outputExtractedDir, (err) => {
        if (err) {
          reject(err)
          return
        }
        console.log('> ' + chalk.green('Output source folder created: ') + outputExtractedDir)
        resolve()
      })
    })
  })

  // compare the file's content
  .then(() => compareContentFiles(baseXmlFilePath, updatedXmlFilePath))

  // apply the changes for each sheet
  .then(({originOds, sheetsChanges}) => {
    console.log(chalk.blue('Applying diff changes to the XML content...'))
    getDocumentSheets(originOds).forEach(sheet => {
      let changes = sheetsChanges[getSheetName(sheet)]
      let rows = getSheetRows(sheet)
      let sheetCursor = 0
      let columnCount = getSheetColumnCount(sheet)

      changes.forEach(change => {
        // no change
        if (!change.added && !change.removed) {
          sheetCursor += change.count
          return
        }

        // removed
        if (change.removed) {
          let cursorStart = sheetCursor
          let cursorEnd = sheetCursor + change.count
          for (let cursor = cursorStart; cursor < cursorEnd; cursor++) {
            let row = rows[cursor]
            setRemovedStyleToRow(row)
          }
          sheetCursor += change.count
          return
        }

        // added
        if (change.added) {
          let addindRowsContent = change.value.split('\n')
          let addindRows = addindRowsContent.map(content => createAddedRow(content, columnCount))

          // fix the number of rows to insert
          let overlyRowsCount = addindRows.length - change.count
          if (overlyRowsCount) {
            addindRows.splice(addindRows.length - overlyRowsCount, overlyRowsCount)
            addindRowsContent.splice(addindRowsContent.length - overlyRowsCount, overlyRowsCount)
          }

          addindRows.forEach(row => {
            rows.splice(sheetCursor, 0, row)
            sheetCursor++
          })

          return
        }
      })
    })
    console.log(chalk.green('Diff changes successfuly applied to the XML content.'))

    return originOds
  })

  // Write the output XML
  .then((originOds) => {
    let builder = new xml2js.Builder()
    let xml = builder.buildObject(originOds)
    return new Promise((resolve, reject) => {
      console.log(chalk.blue('\nWriting destination output: ') + outputXmlFilePath + '...')
      fs.writeFile(outputXmlFilePath, xml, 'utf8', (err) => {
        if (err) {
          console.error(chalk.red("Can't write originOds XML in output destination file: " + outputXmlFilePath))
          reject(err)
          return
        }

        console.log(chalk.green('Destination output written: ') + outputXmlFilePath + '...')
        resolve()
      })
    })
  })

  // Build the resulting .ods file
  .then(() => {
    console.log(chalk.blue('\nBuild the ods file from the intermediate working folder: \n  > ') + outputExtractedDir + chalk.blue(' => ') + outputFilePath + chalk.blue('...'))
    return new Promise((resolve, reject) => {
      let outputOds = fs.createWriteStream(outputFilePath)
      let archive = archiver('zip')

      outputOds.on('close', () => {
        console.log(chalk.green('Build of the output ods was succesfuly written: ') + outputFilePath)
        resolve()
      })
      archive.on('error', (err) => {
        console.error(chalk.red('ERROR: Fail to generate the ods file while ziping the source files: ' + outputExtractedDir + ' => ' + outputFilePath))
        reject(err)
      })
      archive.pipe(outputOds)
      archive.directory(outputExtractedDir, '/', {
        name: ''
      })
      archive.finalize()
    })
  })

  // clear the intermediate files
  .then(() => Promise.all([
    del.promise([baseExtractedDir]),
    del.promise([updatedExtractedDir]),
    del.promise([outputExtractedDir])
  ]))

  // Log script results
  .then(() => console.log(chalk.green('DONE.')))
  .catch((err) => {
    console.error(chalk.red(err))
    console.error(err.stack)
  })
}

function extractFile (input, output) {
  return new Promise(function (resolve, reject) {
    console.log(chalk.blue('Read stream and extract: ') + input + ' ...')

    fs.createReadStream(input)
    .pipe(unzip.Extract({ path: output }))
    .on('close', function (err) {
      if (err) {
        reject(err)
      } else {
        console.log('> ' + chalk.green('EXTRACTED') + ': ' + input + chalk.blue(' > ') + output)
        resolve()
      }
    })
  })
}

function compareContentFiles (originPath, updatedPath) {
  let originOdsSheets, updatedOdsSheets, originOds

  return parseFile(originPath)
  .then(ods => {
    originOds = ods
    setDiffStyles(ods)
    originOdsSheets = getDocumentSheets(ods)
  })
  .then(() => parseFile(updatedPath)).then(ods => updatedOdsSheets = getDocumentSheets(ods))
  .then(() => {
    if (originOdsSheets.length !== updatedOdsSheets.length) {
      throw new Error('ERROR: The two ods files has not the same number of sheets.')
    } else {
      console.log(chalk.blue('\nNumber of sheet to compare : ') + originOdsSheets.length + '\n')
    }
  })

  // Convert the two docs to csv
  .then(() => {
    // orinal csv
    convertOdsSheetsToCsvFiles(originOdsSheets, originPath)

    // updated csv
    convertOdsSheetsToCsvFiles(updatedOdsSheets, updatedPath)
  })

  // make a diff of CVS files
  .then(() => {
    console.log(chalk.blue('\nMake a diff of each CVS sheet...'))
    return Promise.all(
      originOdsSheets.map((sheet, sheetIndex) => {
        let csv1 = ''
        let csv2 = ''
        let csv1Path = path.join(__dirname, getCSVPath(originPath, sheetIndex))
        let csv2Path = path.join(__dirname, getCSVPath(updatedPath, sheetIndex))
        return Promise.all([
          new Promise((resolve, reject) => {
            let rs = fs.createReadStream(csv1Path, 'utf8')
            rs.on('data', d => csv1 += d)
            rs.on('end', () => resolve())
            rs.on('error', err => reject(err))
          }),
          new Promise((resolve, reject) => {
            let rs = fs.createReadStream(csv2Path, 'utf8')
            rs.on('data', d => csv2 += d)
            rs.on('end', () => resolve())
            rs.on('error', err => reject(err))
          })
        ])
        .then(() => {
          return {
            changes: jsdiff.diffLines(csv1, csv2),
            sheetName: getSheetName(sheet)
          }
        })
      })
    )
  })

  // Resolve the originOds object to add diff changes, and the array of diff changes to apply to
  .then((sheetsResults) => {
    let sheetsChanges = []
    sheetsResults.forEach(({changes, sheetName}) => sheetsChanges[sheetName] = changes)
    return {originOds, sheetsChanges}
  })
}

function getCSVPath (basePath, sheetIndex) {
  return basePath.concat('_sheet#', sheetIndex, '.csv')
}

function convertOdsSheetsToCsvFiles (sheets, basePath) {
  sheets.forEach((sheet, sheetIndex) => {
    let filePath = getCSVPath(basePath, sheetIndex)
    let ws = fs.createWriteStream(filePath)
    console.log(chalk.blue('Writing CSV file: ') + filePath)
    getSheetRows(sheet).forEach((row) => {
      if (row) {
        getRowCells(row).forEach((cell) => ws.write(getCellContent(cell) + ';'))
      }
      ws.write('\n')
    })
    ws.write('')
    console.log(chalk.green('CSV file written :') + filePath)
  })
}

function getDocumentSheets (ods) {
  let body = ods['office:document-content']['office:body'][0]
  let sheets = body['office:spreadsheet'][0]['table:table']
  return sheets
}

function getSheetName (sheet) {
  return sheet.$['table:name']
}

function getSheetColumnCount (sheet) {
  return sheet['table:table-column'][0].$['table:number-columns-repeated']
}

function getSheetRows (sheet) {
  return sheet['table:table-row']
}

function getRowCells (row) {
  return row['table:table-cell']
}

function getCellContent (cell) {
  let content = (cell) ? cell['text:p'] || '' : ''
  return String(content)
}

function setRemovedStyleToRow (row) {
  row['table:table-cell'].forEach((cell, cellIndex) => {
    if (!cell) {
      row['table:table-cell'][cellIndex] = createEmptyCell()
      cell = row['table:table-cell'][cellIndex]
    }
    setRemovedStyle(cell)
  })
}

function setCellText (cell, text) {
  cell['text:p'] = text
}

function setAddedStyle (cell) {
  cell.$['table:style-name'] = CELL_STYLE_ADDED_LINE
}

function setRemovedStyle (cell) {
  cell.$['table:style-name'] = CELL_STYLE_REMOVED_LINE
}

function createEmptyCell () {
  return {
    $: {},
    'text:p': [' ']
  }
}

function createAddedRow (content, length) {
  let cellsContent = content.split(CSV_DELIMITER)

  // fix overly rows
  if (length !== undefined) {
    if (cellsContent.length > length) {
      let overlyRowsCount = cellsContent.length - length
      cellsContent.splice(cellsContent.length - length, overlyRowsCount)
    }
  }

  // create cells
  let cells = cellsContent.map(text => {
    let cell = createEmptyCell()
    setAddedStyle(cell)
    setCellText(cell, text)
    return cell
  })

  // append cells to the row
  let row = createEmptyRow()
  cells.forEach(cell => appendCellToRow(row, cell))

  // fix too short row length
  if (length !== undefined) {
    let rowLength = cells.length
    if (rowLength < length) {
      for (let i = 0; i < length - rowLength; i++) {
        let cell = createEmptyCell()
        setAddedStyle(cell)
        appendCellToRow(row, cell)
      }
    }
  }

  return row
}

function createEmptyRow () {
  return {
    $: {},
    'table:table-cell': []
  }
}

function appendCellToRow (row, cell) {
  row['table:table-cell'].push(cell)
}

function setDiffStyles (ods) {
  let styles = ods['office:document-content']['office:automatic-styles'][0]
  let addedLineStyle = createCellStyleBgColor(CELL_STYLE_ADDED_LINE, CELL_STYLE_ADDED_LINE_COLOR)
  let removedLineStyle = createCellStyleBgColor(CELL_STYLE_REMOVED_LINE, CELL_STYLE_REMOVED_LINE_COLOR)

  styles['style:style'].push(addedLineStyle)
  styles['style:style'].push(removedLineStyle)
}

function createCellStyleBgColor (styleName, color) {
  return {
    '$': {'style:name': styleName, 'style:family': 'table-cell'},
    'style:table-cell-properties': [ { '$': { 'fo:background-color': color } } ]
  }
}

function parseFile (filePath) {
  const parser = new xml2js.Parser()

  console.log('\n' + chalk.blue('Parse xml file: ') + filePath + '...')

  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      parser.parseString(data, (err, xml) => {
        if (err) {
          reject(err)
          return
        }

        console.log('> ' + chalk.green('PARSED') + ': ' + filePath)
        resolve(xml)
      })
    })
  })
}
