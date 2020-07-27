/**
 * Opens a dialog to user set the relationship between
 * sheets in the document. The relationships are used to
 * set the Core and the Extensions relations based on their ID's
 *
 */
function openDwCAMetadataEditor(){
	var html = HtmlService.createTemplateFromFile('MetadataEditor')
		.evaluate()
      	.setWidth(600)
      	.setHeight(800);
  	SpreadsheetApp.getUi()
      	.showModalDialog(html, 'DwC-Archive Metadata');
}

/**
 * Saves DwC-A Metadata form in document properties.
 *
 * @param  {array} form data
 */
function generateDwCA(data){

  var valid = validateDwCArchive_();

  if (valid !== true) {
    return {
      error: true,
      message: valid
    };
  }

	var prop = PropertiesService.getDocumentProperties();
  var folderId = checkAndCreateDwCAFolder();
  var folderIter = DriveApp.getFolderById(folderId).getFoldersByName(SpreadsheetApp.getActive().getId());
  var dwcaFolder = null;

  // Check if a subfolder for this spreadsheet already exists.
  // If so, get the Folder, otherwise create a new one
  if (folderIter.hasNext()){
    dwcaFolder = folderIter.next();
  } else {
    dwcaFolder = DriveApp.getFolderById(folderId).createFolder(SpreadsheetApp.getActive().getId());
  }

  var eml = createEML_(dwcaFolder);
  var meta = createMetaXML_(dwcFolder);
  var csvFiles = createCSVFiles_(dwcFolder);

  var dwcArchive = folder.createFile(Utilities.zip(folder.getFiles(), 'dwca-' + (new Date().getTime()) + '.zip'));
  if ( dwcArchive ) {
    uploadToZenodo_(dwcArchive);
  }
}

function createMetaXML_(folder) {
  var root = XmlService.createElement("archive")
  .setAttribute("metadata", "eml.xml")
  .setNamespace(XmlService.getNamespace("http://rs.tdwg.org/dwc/text/"));

  var mappedSheets = getMappedSheets();
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var coreSheetIndex = props.getProperty('dwca-core-sheet');
  var coreSheet = sheets[parseInt(coreSheetIndex)-1];

  // Core Element
  var rowType = getRowType_(coreSheet);
  var coreElem = createMetaElem_(coreSheet, 'core', rowType);

  root.addContent(coreElem);

  for (var i = 0; i < mappedSheets.length; i++) {
    if (!mappedSheets[i].core) {
      var sheet = sheets[parseInt(mappedSheets[i].index)-1];
      rowType = getRowType_(sheet);
      var extElem = createMetaElem_(sheet, 'extension', rowType);
      root.addContent(extElem);
    }
  }

  var document = XmlService.createDocument(root);
  var xml = XmlService.getPrettyFormat().format(document);

  return folder.createFile("meta.xml", xml);
}

function createCSVFiles_(folder) {
  var mappedSheets = getMappedSheets();
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var csvFiles = [];

  for (var i = 0; i < mappedSheets.length; i++) {
    var sheet = sheets[parseInt(mappedSheets[i].index)-1];
    rowType = getRowType_(sheet);
    fileName = rowType.substr(rowType.lastIndexOf('/')+1) + '.csv';
    csvFile = convertRangeToCsvFile_(fileName, sheet);
    var file = folder.createFile(fileName, csvFile);
    csvFiles.push(file);
  }

  return csvFiles;
}

function convertRangeToCsvFile_(csvFileName, sheet) {
  // get available data range in the spreadsheet
  var activeRange = sheet.getDataRange();
  try {
    var data = activeRange.getValues();
    var csvFile = undefined;

    // loop through the data in the range and build a string with the csv data
    if (data.length > 2) {
      var csv = "";
      for (var row = 1; row < data.length; row++) {
        for (var col = 0; col < data[row].length; col++) {
          if (data[row][col].toString().indexOf(",") != -1) {
            data[row][col] = "\"" + data[row][col] + "\"";
          }
        }

        // join each row's columns
        // add a carriage return to end of each row, except for the last one
        if (row < data.length-1) {
          csv += data[row].join(",") + "\r\n";
        }
        else {
          csv += data[row];
        }
      }
      csvFile = csv;
    }
    return csvFile;
  }
  catch(err) {
    Logger.log(err);
  }
}

// TODO: user must set row type
function getRowType_(sheet) {
}

function createMetaElem_(sheet, elem, rowType) {
  var elem = XmlService.createElement(elem)
  .setAttribute('encoding', 'UTF-8')
  .setAttribute('fieldsTerminatedBy', ',')
  .setAttribute('linesTerminatedBy', '\\n')
  .setAttribute('fieldsEnclosedBy', '')
  .setAttribute('ignoreHeaderLines', '1')
  .setAttribute('rowType', rowType)
  .addContent(XmlService.createElement('files')
    .addContent(XmlService.createElement('location')
      .setText(rowType.toLowerCase()+'.csv'))
  );

  var coreColumn = getCoreIdColumn_(sheet);
  var coreColumIndex = coreColumn[0].getColumn();
  if ( elem === 'core') {
    elem.addContent(XmlService.createElement('id')
      .setAttribute('index', coreColumIndex - 1));
  } else {
    elem.addContent(XmlService.createElement('coreid')
      .setAttribute('index', coreColumIndex - 1));
  }

  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var terms = headerRow.getValues().map(function(r){ return r[0]; });
  for(var col = 0; col < terms.length; col++) {
    var term = getTermURI(terms[col]);
    if (term) {
      elem.addContent(XmlService.createElement('field')
        .setAttribute('index', col)
        .setAttribute('term', term)
      );
    }
  }

  return elem;
}

function validateDwCArchive_() {
  //TODO: check row Type!!!
  var mappedSheets = getMappedSheets();
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();

  // Has extensions?
  if (mappedSheets.length > 1) {
    // Has CORE sheet
    var coreSheetIndex = props.getProperty('dwca-core-sheet'), coreSheet = null;
    if (!coreSheetIndex) {
      // Does not have CORE sheet
      return 'No CORE sheet defined. Please select the core sheet before generate the DwC-Archive.';
    }

    for (var i = 0; i < mappedSheets.length; i++) {
      var sheet = sheets[mappedSheets[i].index-1];
      var coreColumns = getCoreIdColumn_(sheet);
      if (coreColumns.length == 0) {
        // Missing CORE_ID
        return 'Sheet ' + sheet.getName() + ' is missing CORE_ID column.';
      } else if ( coreColumns.length > 1) {
        // More than one CORE_ID
        return 'Sheet ' + sheet.getName() + ' has more than one CORE_ID column.';
      }

      // Check for duplicated terms
      var duplicates = hasDuplicateTerms_(sheet);
      if (duplicates.length > 0) {
        // Has duplications
        return 'Sheet ' + sheet.getName() + ' has duplicated terms: ' + duplications.join(', ');
      }

      return true;
    }
  } else if (mappedSheets.length == 1) {
    var sheet = sheets[mappedSheets[0].index];
    // Check for duplicated terms
    var duplicates = hasDuplicateTerms_(sheet);
    if (duplicates.length > 0) {
      // Has duplications
      return 'Sheet ' + sheet.getName() + ' has duplicated terms: ' + duplications.join(', ');
    }

    return true;
  }

  function hasDuplicateTerms_(sheet) {
    var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    var values = headerRow.getValues().map(function(r){ return r[0]; });
    var duplicatesMap = {}, duplicates = [];
    for (var i = 0; i < values.length; i++) {
      var term = values[i];
      if (duplicatesMap[term] !== undefined) {
        duplicates.push(term);
      } else {
        duplicatesMap[term] = 1;
      }
    }

    return duplicates;
  }

  // Does not have a mapped sheet
  return 'No header row found! Add a mapping row before generating the DwC-Archive.';

}

/**
 * Returns all DwC-A metadata stored in document properties
 * @return {array} DwC-A metadata
 */
function getMetadata(sheetIndex) {
    var props = PropertiesService.getDocumentProperties();
    var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    if (sheets.length >= sheetIndex) {
        var sheet = sheets[sheetIndex];
        var key = sheet.getName().replace(/\s+/gi, '-').toLowerCase() + '-metadata';
        var metadata = props.getProperty(key);
        if (metadata) {
            return JSON.parse(metadata);
        }
    }

    return {};
}

function getMappedSheets() {
    var props = PropertiesService.getDocumentProperties();
    var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    var mappedSheets = [];
    var coreSheetIndex = props.getProperty('dwca-core-sheet'), coreSheet = null;
    if (coreSheetIndex) {
      coreSheet = sheets[parseInt(coreSheetIndex)-1];
    }

    for(var i = 0; i < sheets.length; i++) {
        var key = sheets[i].getName().replace(/\s+/gi, '-').toLowerCase() + '-dwcheader';
        var hasMappingRow = props.getProperty(key);
        if(hasMappingRow) {
            var metadata = {
              name: sheets[i].getName(),
              index: sheets[i].getIndex(),
              core: coreSheet != null && coreSheet.getIndex() === sheets[i].getIndex()
            };
            mappedSheets.push(metadata);
        }
    }

    return mappedSheets;
}

function setCoreSheet(sheetIndex) {
  var props = PropertiesService.getDocumentProperties();
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  if (sheetIndex > 0 && sheetIndex <= sheets.length) {
    var coreSheet = sheets[sheetIndex-1];
    var coreColumns = getCoreIdColumn_(coreSheet);
    if (coreColumns.length === 1) {
      // Set core sheet
      props.setProperty('dwca-core-sheet', coreSheet.getIndex());
      return true;
    } else if(coreColumns.length > 1) {
      // More than one core id column (error)
      return {
        error: true,
        message: 'More than one CORE_ID column found in sheet ' + coreSheet.getName() + '. Terms can not be duplicated!'
      };
    } else {
      // No core id column (error)
      return {
        error: true,
        message: 'No CORE_ID column found in sheet ' + coreSheet.getName() + '. Please, specify the CORE_ID column or create one!'
      };
    }
  }
  return {
    error: true,
    message: 'Sheet does not exists!'
  };
}

function getCoreIdColumn_(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var finder = range.createTextFinder('CORE_ID');
  var coreColumns = finder.findAll();
  return coreColumns;
}

function getDwCArchiveSchema() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var mappedSheets = getMappedSheets();
  var dwcArchiveSchema = {
    nodes: [],
    edges: []
  };

  var props = PropertiesService.getDocumentProperties();
  var coreSheetIndex = props.getProperty('dwca-core-sheet');

  var edgeId = 1, x = 0, y = 0;
  for (var i = mappedSheets.length - 1; i >= 0; i--) {
    var sheet = sheets[mappedSheets[i].index-1];

    if (x > y){
      ++y;
    } else {
      ++x;
    }

    var node = {
      id: sheet.getIndex(),
      label: sheet.getName(),
      size: 4,
      color: mappedSheets[i].core ? '#f00' : '#000',
      x: mappedSheets[i].core ? 0 : x,
      y: mappedSheets[i].core ? 0 : y,
      type: 'image',
      data: mappedSheets[i].core ?
      'data:image/png;base64,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' :
      'data:image/png;base64,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'
    }
    dwcArchiveSchema.nodes.push(node);

    if (!mappedSheets[i].core && getCoreIdColumn_(sheet).length > 0){
      var edge = {
        id: edgeId,
        source: parseInt(coreSheetIndex),
        target: sheet.getIndex()
      }
      ++edgeId;
      dwcArchiveSchema.edges.push(edge);
    }
  }

  return dwcArchiveSchema;
}