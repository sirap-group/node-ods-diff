'use strict'

const fs = require('fs')
const unzip = require('unzip')
const path = require('path')
const del = require('delete')
const xml2js = require('xml2js')

const baseFilePath = './test/fixtures/sheet-origin.ods'
const updatedFilePath = './test/fixtures/sheet-modified.ods'

odsDiff(baseFilePath, updatedFilePath)

module.exports = odsDiff

function odsDiff (baseFilePath, updatedFilePath) {
  const baseFilePathParsed = path.parse(baseFilePath)
  const updatedFilePathParsed = path.parse(updatedFilePath)

  const ouputFileName = baseFilePathParsed.name.concat('__diff__', updatedFilePathParsed.name, baseFilePathParsed.ext)
  const outputFilePath = path.join(baseFilePathParsed.dir, ouputFileName)
  const outputFilePathParsed = path.parse(outputFilePath)

  const baseExtractedDir = path.join(baseFilePathParsed.dir, baseFilePathParsed.name.concat('_files'))
  const updatedExtractedDir = path.join(updatedFilePathParsed.dir, updatedFilePathParsed.name.concat('_files'))
  const outputExtractedDir = outputFilePath.concat('_files')

  const baseXmlFilePath = path.join(baseExtractedDir, 'content.xml')
  const updatedXmlFilePath = path.join(updatedExtractedDir, 'content.xml')
  const outputXmlFilePath = path.join(outputExtractedDir, 'content.xml')

  Promise.all([
    del.promise([baseExtractedDir])
    .then(() => extractFile(baseFilePath, baseExtractedDir)),

    del.promise([updatedExtractedDir])
    .then(() => extractFile(updatedFilePath, updatedExtractedDir))
  ])
  .then(() => compareContentFiles(baseXmlFilePath, updatedXmlFilePath))
  .then(() => Promise.all([
    del.promise([baseExtractedDir]),
    del.promise([updatedExtractedDir]),
    del.promise([outputExtractedDir])
  ]))
  .then(() => console.log('DONE.'))
  .catch((err) => { console.error(err) })
}

function extractFile (input, ouput) {
  return new Promise(function (resolve, reject) {
    console.log('\nRead stream and extract: ' + input + ' ...')

    fs.createReadStream(input)
    .pipe(unzip.Extract({ path: ouput }))
    .on('close', function (err) {
      if (err) {
        reject(err)
      } else {
        console.log('> EXTRACTED: ' + input)
        resolve()
      }
    })
  })
}

function compareContentFiles (originPath, updatedPath) {
  var oringinXml, updatedXml

  return parseFile(originPath).then((xml) => oringinXml = extractXmlBody(xml))
  .then(() => parseFile(updatedPath)).then((xml) => updatedXml = extractXmlBody(xml))
  .then(() => {
    console.log({oringinXml})
    console.log({updatedXml})
  })
}

function extractXmlBody (xml) {
  let sheets = xml['office:document-content']['office:body']
  console.dir({sheets})
  //
  let tables = []
  sheets.forEach((sheet) => {
    let item = sheet['office:spreadsheet']
    console.log({item})
    tables.push(item)
  })
  // ['table:table']
  console.dir({tables})
  return tables
}

function parseFile (filePath) {
  const parser = new xml2js.Parser()

  console.log('\nParse xml file: ' + filePath + '...')

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

        console.log('> PARSED: ' + filePath)
        resolve(xml)
      })
    })
  })
}
