/**
 * Include file into a template
 * @param  String filename HTML file to include
 * @return String          HTML file content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
  .getContent();
}

function showYesNoAlert(title, message) {
  var ui = SpreadsheetApp.getUi();

  var result = ui.alert(
    title,
    message,
    ui.ButtonSet.YES_NO);

  return result == ui.Button.YES;
}

/**
 * Show an alert with only OK button
 * @param  String title   alert title
 * @param  String message alert message
 *
 */
function showOKAlert(title, message) {
  var ui = SpreadsheetApp.getUi();

  var result = ui.alert(
    title,
    message,
    ui.ButtonSet.OK);
}

/**
 * Get all DwC fields used in the active spreadsheet
 * @return {array}
 */
function getSpredsheetFields(sheetIndex = 0, onlyIDs = false) {
  var documentProperties = PropertiesService.getDocumentProperties();
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();

  var sheet = null;
  if (sheetIndex > 0 && sheetIndex <= sheets.length) {
    sheet = sheets[sheetIndex-1];
  } else {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  }

  var key = sheet.getName().replace(/\s+/gi, '-').toLowerCase() + '-metadata';
  var metadata = documentProperties.getProperty(key);
  // Has DwC header
  if (metadata) {
    var fields = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
    var terms = fields[0];
    terms = terms
    .filter(function(t){ return t != ''})
    .flatMap(function(t,i){ return {'index': i, 'term': t }; });

    if ( onlyIDs ){
      terms = terms.filter(function(t) {
        return t.term.indexOf("ID") != -1;
      });
    }

    return terms;
  }
  else{
    SpreadsheetApp.getUi().alert('You need add mappings before this step. Please use Add/Remove mapping in the add-on menu.');
  }

  return [];
}

/**
 * Read Darwin Core XSD and return terms in array
 *
 * @return {array} Darwin core terms
 */
function xmltoArray() {
  var url = 'https://dwc.tdwg.org/xml/tdwg_dwcterms.xsd';
  var response = UrlFetchApp.fetch(url);
  var xml = response.getContentText();
  var document = XmlService.parse(xml);
  var root = document.getRootElement();
  var xmlschema = XmlService.getNamespace('http://www.w3.org/2001/XMLSchema');

  var namespaces = {
    dwc: 'http://rs.tdwg.org/dwc/terms/',
    dcterms: 'http://purl.org/dc/terms/'
  };

  var groups = root.getChildren('group', xmlschema);
  var terms = [];
  for (var i = 0; i < groups.length; i++) {
    var entries = groups[i].getChild('sequence', xmlschema).getChildren();
    for (var j = 0; j < entries.length; j++) {
      qname=entries[j].getAttribute('ref');
      if (qname) {
        terms.push(qname.getValue());
      }
    }
  }

  return {
    namespaces: namespaces,
    terms:  terms
  };
}

function saveSettings(settings) {
  var props = PropertiesService.getUserProperties();
  props.setProperty('enableZenodo', settings.enableZenodo);
  props.setProperty('zenodoToken', settings.zenodoToken);
}

function showurl(downloadURL) {
  var html = HtmlService.createHtmlOutput()
  .setWidth(250)
  .setHeight(60)
  .setTitle("Your DwC-Archive is ready!")
  .setContent('<a href="' + downloadURL + '" target="_blank">Click here to download</a>');

   SpreadsheetApp.getUi()
      .showModalDialog(html, 'Your DwC-Archive is ready!');

}