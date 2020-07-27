// "YTUdjM4SvSZrYjwNqFaglSw9NFbDcpkb6dQiZ9Pfmeej9C1PsskWrIU67MLJ";


var ROOT_FOLDER = "GBIF-DWCA";
var PROP_FOLDER_KEY = "gbif-dwca-folder-key";

/* What should the add-on do after it is installed */
function onInstall(e) {
  onOpen(e);
}

function initAddon(){
  checkAndCreateDwCAFolder();

  // Set DwC-A started
  var props = PropertiesService.getDocumentProperties();
  props.setProperty('dwcaStarted', "1");

  // Initilize menu
  initMenu();
  // Load Darwin Core Standard
  loadDwC();
}

/**
 * Check if output DwCA folder exists,
 * if not create it and return folder ID
 *
 * @return {String}
 */
function checkAndCreateDwCAFolder(){
  // Check for DwC-A folder
  // If not present create a new folder
  var prop = PropertiesService.getScriptProperties();
  var folderId = prop.getProperty(PROP_FOLDER_KEY);
  var folder = null;
  if ( !folderId ) {
      folder = DriveApp.createFolder(ROOT_FOLDER);
  }
  else{
    try {
      folder = DriveApp.getFolderById(folderId);
    }catch(e){
      Logger.log(e);
    }
    if (!folder){
      folder = DriveApp.createFolder(ROOT_FOLDER);
    }
  }
  prop.setProperty(PROP_FOLDER_KEY, folder.getId());
  return folder.getId();
}

/* What should the add-on do when a document is opened */
function onOpen(e) {
  var menu = SpreadsheetApp.getUi()
  .createAddonMenu();
  if( e && e.authMode == ScriptApp.AuthMode.NONE ){
    menu.addItem('Start DwC-archive', 'initAddon');
    menu.addToUi();
  } else {
    // Initilize menu
    initMenu();
    // Load Darwin Core Standard
    loadDwC();
  }
}

function initMenu() {
  var props = PropertiesService.getDocumentProperties();
  var dwcaStarted = props.getProperty('dwcaStarted');
  var menu = SpreadsheetApp.getUi()
    .createAddonMenu();
  if ( dwcaStarted ){
    menu.addItem("Add/Remove mappings", "toggleMappingRow");
    menu.addItem("Open EML Editor", "openEMLEditor");
    menu.addItem("Generate DwC-Archive", "openDwCAMetadataEditor");
    menu.addItem("Settings", "showSidebar");
  } else {
    menu.addItem('Start DwC-archive', 'initAddon');
  }

  menu.addToUi();
}

/* Show a 300px sidebar with the HTML from googlemaps.html */
function showSidebar() {
  var html = HtmlService.createTemplateFromFile("sidemenu")
    .evaluate()
    .setTitle("GBIF/DwC-Archive - Settings");
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Add/Remove mapping row
 */
function toggleMappingRow(){
  var documentProperties = PropertiesService.getDocumentProperties();
  var sheet = SpreadsheetApp.getActiveSheet();
  var key = sheet.getName().replace(/\s+/gi, '-').toLowerCase() + '-dwcheader';
  var hasDwCHeader = documentProperties.getProperty(key);

  var numCols = sheet.getLastColumn();
  var numRows = sheet.getLastRow();

  if (numCols == 0 || numRows == 0) {
    showOKAlert('No data', 'Please, add your data before enable mappings');
    return;
  }

  // No DwC header. Add header row (mapping row)
  Logger(hasDwCHeader);
  if (!hasDwCHeader) {
    var terms = documentProperties.getProperty('dwc').split(',');
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(terms, true).build();
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setDataValidation(rule);
    documentProperties.setProperty(key, "1");
  } else {
    // Already has DwC header. Remove header row (mapping row) and metadata
    sheet.deleteRow(1);
    documentProperties.deleteProperty(key);
  }
}

function loadDwC(){
  var terms = xmltoArray();
  terms.push('CORE_ID');
  if ( terms.length > 0 ){
    var documentProperties = PropertiesService.getDocumentProperties();
    documentProperties.setProperty('dwc', terms.toString());
  }
}

function uploadToZenodo(file){
  var token = "LllHHyOUKAy8EfeoAxEYPd48qEjMOl1efwH4uRVusZeR0gS8Voq1SP3DzdGI";
  var url = "https://sandbox.zenodo.org/api/deposit/depositions";
  var data = {};
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + token
    },
    // Convert the JavaScript object to a JSON string.
    'payload' : JSON.stringify(data)
  };
  var response = UrlFetchApp.fetch(url, options);
  Logger.log(response);
  var result = JSON.parse(response.getContentText());
  var id = result.id;
  Logger.log(result);
  Logger.log(id);

  var formData = {
    name: "eml.xml",
    file: DriveApp.getFileById(file.getId()).getBlob()
  };
  var options = {
    method: 'post',
    //'contentType': 'multipart/form-data',
    muteHttpExceptions : true,
    headers: {
      'Authorization': 'Bearer ' + token
    },
    payload : formData
  };

  var request = UrlFetchApp.getRequest(url + "/" + id + "/files",options);
  Logger.log(request);
  response = UrlFetchApp.fetch(url + "/" + id + "/files", options);
  Logger.log(response.getContentText());

}

/**
 * Get a list of available data standards with URI to fetch standards schemas
 *
 * @return {array} available data standards
 */
function getStandards(){
  return [
    {
      name: "Darwin Core",
      uri: "https://raw.githubusercontent.com/tdwg/dwc/master/docs/xml/tdwg_dwcterms.xsd"
    }
  ];
}

