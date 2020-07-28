
const EML_KEYS = [
  'title',
  'creators',
  // 'organization-code',
  // 'dataset-name',
  // 'dataset-id',
  // 'keywords',
  'abstract',
  // 'additional-info',
  // 'taxonomic-coverage',
  // 'auto-taxonomic-coverage',
  // 'taxonimic-field',
  // 'geographic-coverage',
  // 'auto-geographic-coverage',
  // 'purpose',
  // 'rights',
  // 'lang',
  // 'enable-manual-eml',
  // 'manual-eml',
  // Metadata Provider:
  'given-name',
  'surname',
  'email',
  'organization-name',
];


/**
 * Create the EML/XML file in specified folder
 *
 * @param  {Folder} folder to create the EML file
 * @return {File} EML file
 */
function createEML_(folder) {
  var props = PropertiesService.getDocumentProperties();
  var eml = JSON.parse(props.getProperty('eml'));
  var xml = '';

  if (eml['manual-eml'] == '') {
    var root = XmlService.createElement("eml")
    // Package ID will be filled with Zenodo Upload Key
    .setAttribute("packageId", "")
    .setAttribute("system", "https://zenodo.org")
    .setAttribute("scope", "system")
    .setNamespace(XmlService.getNamespace("eml", "https://eml.ecoinformatics.org/eml-2.2.0"))
    .setNamespace(XmlService.getNamespace("dc", "http://purl.org/dc/terms/"))
    .setNamespace(XmlService.getNamespace("xsi", "http://www.w3.org/2001/XMLSchema-instance"));

    var dataset = XmlService.createElement("dataset");

    var title = XmlService.createElement("title")
       .setText(eml['title']);
    dataset.addContent(title);

    for(var i = 0; i < eml['creators'].length; i++) {
      // Creator
      var creator = eml['creators'][i];
      var creatorElem = XmlService.createElement("creator")
      .addContent(
        XmlService.createElement("individualName")
        .addContent(XmlService.createElement("givenName").setText(creator['givenName']))
        .addContent(XmlService.createElement("surName").setText(creator['surname'])))
      .addContent(XmlService.createElement("organizationName").setText(creator['org']));

      if ( creator['email'] != '') {
        creatorElem.addContent(
          XmlService.createElement("electronicMailAddress").setText(creator['email']));
      }

      dataset.addContent(creatorElem);
    }

    //Contact
    var contact = eml['creators'][0];
    var contactElem = XmlService.createElement("contact")
    .addContent(
      XmlService.createElement("individualName")
      .addContent(XmlService.createElement("givenName").setText(contact['givenName']))
      .addContent(XmlService.createElement("surName").setText(contact['surname'])))
    .addContent(XmlService.createElement("organizationName").setText(contact['org']));

    if (contact['email'] != '') {
      contactElem.addContent(
        XmlService.createElement("electronicMailAddress").setText(contact['email']));
    }

    dataset.addContent(contactElem);

    // Medatada Provider
    dataset.addContent(XmlService.createElement("metadataProvider")
    .addContent(XmlService.createElement("individualName")
      .addContent(XmlService.createElement("givenName").setText(eml['given-name']))
      .addContent(XmlService.createElement("surName").setText(eml['surname'])))
    .addContent(XmlService.createElement("organizationName").setText(eml['organization-name'])));

    // Abstract
    dataset.addContent(XmlService.createElement("abstract")
      .addContent(XmlService.createElement("para").setText(eml['abstract'])));

    // Keywords
    if (eml['keywords'] != '') {
      var keywords = eml['keywords'].split(';');
      var keywordSet = XmlService.createElement("keywordSet");

      for (var i = 0; i < keywords.length; i++) {
        keywordSet.addContent(XmlService.createElement("keyword").setText(keywords[i]));
      }

      dataset.addContent(keywordSet);
    }

    // Additional Information
    if (eml['additional-info'] != '') {
      dataset.addContent(XmlService.createElement("additionalInfo")
        .addContent(XmlService.createElement("para").setText(eml['additional-info'])));
    }

    // Intellectual rights
    if (eml['rights'] != '') {
      dataset.addContent(XmlService.createElement("intellectualRights")
        .addContent(XmlService.createElement("para").setText(eml['rights'])));
    }

    // Language
    if (eml['lang'] != '') {
      dataset.addContent(XmlService.createElement("language").setText(eml['lang']));
    }

    root.addContent(dataset);
    var document = XmlService.createDocument(root);
    xml = XmlService.getPrettyFormat().format(document);
  } else {
    xml = eml['manual-eml'];
  }

  // Check if file already exists
  var iter = folder.getFilesByName('eml.xml');
  if (iter.hasNext()) {
    var file = iter.next();
    file.setContent(xml);
    return file;
  }

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

  // Check required fields
  if ( data['enable-manual-eml'] &&
    (data['manual-eml'] === undefined || data['manual-eml'] == '')) {
      return {
        error: true,
        message: "EML can't be empty! Please, provide an EML metadata or disable the manually enter of EML content"
      };
  } else {
    for(var i = 0; i < EML_KEYS.length; i++) {
      var key = EML_KEYS[i];
      if ( data[key] === undefined || data[key] == '') {
        return {
          error: true,
          message: 'Field ' + key + 'is obligatory',
          field: key
        };
      } else if( Array.isArray(data[key]) && data[key].length == 0) {
        return {
          error: true,
          message: 'Field ' + key + 'is obligatory',
          field: key
        };
      } else if (key === 'creators') {
        for (var i = 0; i < data[key].length; i++) {
          var creator = data[key][i];
          if( creator['givenName'] == '' ||creator['surname'] == ''
            || creator['org'] == '') {
            return {
              error: true,
              message: 'A creator must have a given name, surname and organization'
            };
          }
        }
      }
    }
  }

  //Store eml data into document properties
  prop.setProperty('eml', JSON.stringify(data));

  return true;
}

/**
 * Returns the EML data stored in Document properties
 * @return {array}
 */
function getEMLData(){
  var props = PropertiesService.getDocumentProperties();
  var data = props.getProperty('eml');
  return data ? JSON.parse(data) : {};
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
