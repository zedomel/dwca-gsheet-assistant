const ZENODO_API_URL = 'https://sandbox.zenodo.org/api';

function createZenodoDeposition_() {
    var props = PropertiesService.getUserProperties();
    var enableZenodo = props.getProperty('enableZenodo');
    var token = props.getProperty('zenodoToken');
    if (enableZenodo === 'true' && token) {
        var docProps = PropertiesService.getDocumentProperties();
        var zenodoId = docProps.getProperty('zenodoId');
        var eml = JSON.parse(docProps.getProperty('eml'));
        var data = {
            metadata: {
                upload_type: 'dataset',
                publication_date: (new Date()).toISOString(),
                title: eml['title'],
                creators: eml['creators'].map(function(creator) { return {
                    name: creator['surname'] + ", " + creator['givenName']
                }}),
                description: eml['abstract'],
                access_right: 'open',
                license: 'cc-zero',
                prereserve_doi: true
            }
        };

        var url = ZENODO_API_URL + "/deposit/depositions";
        if (zenodoId) {
            url += "/" + zenodoId;
        }

        var options = {
            'method' : zenodoId ? 'put' : 'post',
            'contentType': 'application/json',
            'headers': {
                'Authorization': 'Bearer ' + token
            },
            payload: JSON.stringify(data)
        };

        var response = UrlFetchApp.fetch(url, options);
        if (response.getResponseCode() === 201 || response.getResponseCode() === 200) {
            return JSON.parse(response.getContentText());
        }

        return null;
    }

    return false;
}

function uploadToZenodo_(result, file) {
    var props = PropertiesService.getUserProperties();
    var enableZenodo = props.getProperty('enableZenodo');
    var token = props.getProperty('zenodoToken');
    if (enableZenodo === 'true' && token) {
        var formData = {
            name: file.getName(),
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

        var response = UrlFetchApp.fetch(ZENODO_API_URL + "/deposit/depositions/" + result.id + "/files", options);
        if (response.getResponseCode() === 201) {
            var published = UrlFetchApp.fetch(result.links.publish, {
                method: 'post',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
            });
            if (published.getResponseCode() !== 202) {
                Logger.log('DwC-Archive not published to Zenodo');
            }
            return JSON.parse(published.getContentText());
        }
    }

    return null;
}