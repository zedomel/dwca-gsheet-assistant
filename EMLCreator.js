
var EML_KEYS = [
  'title',
  'creators',
  'given-name',
  'surname',
  'email',
  'institution-name',
  'institution-code',
  'dataset-name',
  'dataset-id',
  'keywords',
  'abstract',
  'additional-info',
  'taxonomic-coverage',
  'auto-taxonomic-coverage',
  'taxonimic-field',
  'geographic-coverage',
  'auto-geographic-coverage',
  'purpose',
  'rights',
  'lang',
  'enable-manual-eml',
  'manual-eml'
];


/**
 * Create the EML/XML file in specified folder
 *
 * @param  {Folder} folder to create the EML file
 * @return {File} EML file
 */
function createEML_(folder){

  var hasEmlFile = folder.getFilesByName('eml.xml').hasNext();
  if ( hasEmlFile ){
    var ans = showYesNoAlert('EML Already exists', 'Would you like to overwrite the existing file?');
    if ( !ans ){
      return null;
    }
  }

  var root = XmlService.createElement("eml")
     .setAttribute("packageId", "")
     .setAttribute("system", "")
     .setNamespace(XmlService.getNamespace("eml", "https://eml.ecoinformatics.org/eml-2.2.0"));

  var dataset = XmlService.createElement("dataset");

  var title = XmlService.createElement("title")
     .setText("EML Title");
  dataset.addContent(title);

  // Creator
  dataset.addContent(
    XmlService.createElement("creator")
    .setAttribute("id", "http://orcid.org/111111")
    .addContent(
      XmlService.createElement("individualName")
      .addContent(XmlService.createElement("givenName").setText("Jose"))
      .addContent(XmlService.createElement("givenName").setText("A."))
      .addContent(XmlService.createElement("surName").setText("Salim"))
    )
    .addContent(XmlService.createElement("electronicMailAddress").setText("zedomel@gmail.com"))
    .addContent(XmlService.createElement("userId").setAttribute("directory", "https://orcid.org").setText("https://orcid.org/1111-1111-1111")));

  // Keywords
  dataset.addContent(
    XmlService.createElement("keywordSet")
    .addContent(XmlService.createElement("keyword").setText("biomass"))
    .addContent(XmlService.createElement("keyword").setText("productivity")));

  //Contact
  dataset.addContent(
    XmlService.createElement("contact")
    .addContent(XmlService.createElement("references").setText("https://orcid.org/1111-1111-1111"))
  );

  root.addContent(dataset);
  var document = XmlService.createDocument(root);
  var xml = XmlService.getPrettyFormat().format(document);

  //Output to file
  return folder.createFile("eml.xml", xml);
}

/**
 * Saves EML data from editor to Document properties
 *
 * @param  {array} EML form data
 *
 */
function saveEML(data){
  var prop = PropertiesService.getDocumentProperties();
  for(var i = 0; i < EML_KEYS.length; i++){
    var key = EML_KEYS[i];
    var value = '';
    if ( data[key] ){
      if( Array.isArray(data[key]) ){
        value = data[key].join('|');
      }
      else{
        value = data[key]
      }
    }

    //Store eml data into document properties
    prop.setProperty('eml-' + key, value);
  }
}

/**
 * Returns the EML data stored in Documento properties
 * @return {array}
 */
function getEMLData(){
  var prop = PropertiesService.getDocumentProperties();
  var data = {};

  for(var i = 0; i < EML_KEYS.length; i++){
    var key = EML_KEYS[i];
    var value = prop.getProperty('eml-' + key);

    if( key === 'creators'){
      if( value ){
        value = value.split('|');
      }
      else{
        value = [];
      }
    }

    else if( key === 'auto-taxonomic-coverage' || key === 'auto-geographic-coverage' || key === 'enable-manual-eml'){
      value = (value == 'true');
    }

    else if( !value ){
      value = '';
    }

    // Add value to data array
    data[key] = value;
  }

  Logger.log(data);
  return data;
}

/**
 * Show EML Editor Dialog
 *
 */
function openEMLEditor(){
  var html = HtmlService.createTemplateFromFile('EMLDialog')
      .evaluate()
      .setWidth(600)
      .setHeight(800);
  SpreadsheetApp.getUi()
      .showModalDialog(html, 'Ecological Metadata Language');
}
