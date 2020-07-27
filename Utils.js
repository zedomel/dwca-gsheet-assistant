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
  var url = 'https://raw.githubusercontent.com/tdwg/dwc/master/docs/xml/tdwg_dwcterms.xsd';
  var response = UrlFetchApp.fetch(url);
  var xml = response.getContentText();
  var document = XmlService.parse(xml);
  var root = document.getRootElement();
  var xmlschema = XmlService.getNamespace('http://www.w3.org/2001/XMLSchema');
  /*var $title = $xml.find( "title" );*/
  var entries = root.getChildren();
  var terms = [];
  for (var i = 0; i < entries.length; i++) {
    var nameval=entries[i].getAttribute('name');
    var subgroup=entries[i].getAttribute('substitutionGroup');
    if(nameval && !subgroup){
      var abstract=entries[i].getAttribute('abstract');
      if (!abstract && entries[i].getName()!='group'){
        terms.push(nameval.getValue());
      }
      if(entries[i].getName()=='group') {
        var sub1=entries[i].getChildren('sequence',xmlschema);
        var subentries=sub1[0].getChildren();//SEQUENCES
        var ll=subentries.length;
        for (var j = 0; j < subentries.length; j++) {
          sname=subentries[j].getAttribute('ref');
          if (sname){
            terms.push(sname.getValue());
          }
        }
      }
    }
  }
  return terms;
}
