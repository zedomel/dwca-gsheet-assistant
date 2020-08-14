---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: default 
---

# Rationale

Most biologists and biodiversity data managers organize their data into spreadsheets and for thoses whom are not familiar with Information Science practices of data standardization, the usage of complex software to assist the creation of standardized datasets can be painful, or even prohibited.

Based on that, the Google Sheet Add-on available here searches to explore the familiarity of the users with spreadsheets and allow them to create and publish standardized biodiversity data using Darwin Core Standard.
The add-on aims to provided a simple and intuitive interface for users not familiary with the concepts of Darwin Core Standard (DwC) and data sharing using Darwin Core Archives. 

The data in a spreadsheet can be easily mapped to DwC terms and the add-on can handle one-to-many relations between data records by the use of `CORE_ID` special *term*.

# Installation

## Adding the Add-on from G Suite Marketplace

Access the Add-on at *G Suite Marketplace* by the follow link [ http://gsuite.google.com/marketplace/app/appname/567341081140]( http://gsuite.google.com/marketplace/app/appname/567341081140). 

Accept the permissions to the Add-on access user's Google Drive and Google Sheet aplications.

## Instaling from Google Sheet

After opening the Google Sheet application, access the menu `Add-ons`->`Get add-ons`. In the *G Suite Marketplace* search for `Darwin Core Archive Assistant` and click `Install`. Follow the steps to accept the permissions.

**After installed the Add-on will be available for all Google Sheet documents. But it needs to be enabled for each document you are editing.**

# Enable the Add-on

After installed, the Add-on must be enable for a single document by selectiong the menu option `Add-ons`->`Darwin Core Archive Assistant`->`Start DwC-A`.

# Quick Guide

After the add-on has be installed and enabled for the current user the submenu "Darwin Core Archive Assitant" will be shown at the "Add-ons" menu. The submenu has four options:
- **Add/Remove mappings**: add or remove a mapping header row to the current sheet. The header row shows a dropdown with Darwin Core Standard terms which are used to mapping the fields of sheet data into the standard.
- **Open EML Editor**: opens a dialog window with the EML Editor. For simplicity just mandatory fields defined in Darwin Core Archive Standard are present, and a few optinal EML terms. The editor allows the user to manually add a EML content in XML format, usually created using external tool.
- **Generate DwC-Archive**: opens a dialog window with options to generate the Darwin Core Archive (DwC-Archive) if more than one sheet has a *mapping row*, in order to create the **star schema**. If just one sheet has a *mapping row* (Simple Darwin Core) than instead of generating a DwC-Archive, only a *comma separated value* (CSV) file is created with DwC terms as header row.
- **Settings**: opens a sidebar menu for configuration of Zenodo publishing API access token.

## Start Darwin Core Archive Assistant

At the top menu "Darwin Core Assistant" click on "Start DwC-Archive" to start the add-on for the current spreadsheet. After the add-on is initiated the options listed above will be shown.

![Start DwC-Archive Assistant](/assets/img/start-dwca-assistant.png)

## Add/Remove Mapping Row

To add or remove a mapping row from a sheet select the option *Add/Remove mappings* from the add-one menu. If no header row already exists in the current sheet, a new header row will be added to mappings columns/fields to Darwin Core terms. Otherwise, if a header row already exists in the current sheet, it will be removed.

**Note:** header rows can only be added to sheet that already has some data, so the size (number of columns) in the sheet can be calculated and the header row will have the same size of data.

![Add/Remove mapping row](/assets/img/mapping-row.png)

### The special `CORE_ID` term

The Darwin Core Archive is used to represent complex structures within data (one-to-many relations) by the definition of a **star schema**. For that reason, a special term `CORE_ID` is available on the mapping row list of terms. Using the `CORE_ID` term is possible to "link" or represeting the relations between data in different sheets. Records (i.e. rows) from different sheets can be linked into a one-to-many relation by mapping a column to the `CORE_ID` term in all related sheets. Two or more columns in different sheets which have the `CORE_ID` term by definition of Darwin Core Archive Standard have to be filled same value (see figure bellow as an example).

![The CORE_ID term](/assets/img/core-id-term.png)
*The row in the left sheet with `CORE_ID` `2787` is linked to the two rows of the right sheet, creating a one-to-many relation between sheets. The left sheet after will be selected as the **core sheet** and the right sheet as **extension sheet** in DwC-Archive nomenclature*

## Ecological Metadata Language Editor

The Ecologial Metadata Language (EML) allows the description of the whole dataset, and so, is recommended to always provided as much details as possible to describe it. Although only the DwC-Archive Standard requires an EML file to be included into the archive, as opposed to Simple Darwin Core, describing the dataset in both scenarios is recommended. 

![EML Editor](/assets/img/eml-editor-1.png)

The EML Editor required only a few number of fields to be filled (only those required by [Global Biodiveristy Information Facility (GBIF) EML Schema]()). However, it's possible to manually add an EML content in XML format created using an external tool by selecting the checkbox *Manually enter EML content*.

![Manual EML Editor](/assets/img/eml-editor-manual.png)

After add the EML metadata click on *Save* button to save.

## Generate the Darwin Core Archive

### Simple Darwin Core

When just **one** sheet has a *mapping row* the dialog shown by the selecting the option *Generate DwC-Archive* in the add-one submenu will only shows a button *Generate DwC-Archive*. However, the action trigger by clicking the button will not generate a DwC-Archive, instead, a CSV file with terms as header row will be created and stored in the add-on folder in user's personal Google Drive, as well as, an EML file.

### Star Schema

On other hand, when **two or more** sheets have a *mapping row* the dialog will show options to configure the DwC-Archive. First, the **core sheet** must be defined, all other sheets with *mapping row* will be treated as **extensions** in the DwC-Archive. After, each sheet must have a **row type** which basically are Darwin Core classes represeting the main type of each record (i.e. row) in each sheet (see [Darwin Core Text Guide](https://dwc.tdwg.org/text/) for more details).

In that case, the action triggered by clicking the *Generate DwC-Archive* button will create CSV files contained data from all sheets with *mapping row*, an EML file, and a meta file (`meta.xml`) which describes the relations between data and includes the column-terms mappings (see [Darwin Core Archive How To Guide](https://github.com/gbif/ipt/wiki/DwCAHowToGuide) for more detaisl about DwC-Archive structure).

**Note**: all sheets with *mapping row* have to include a column mapped to the `CORE_ID` term, so the DwC-Archive can be generated properly.

![Darwin Core Archive](/assets/img/dwca.png)

# Publishing to Zenodo

The DwC-Archive, as well as, the CSV and EML files generated for Simple Darwin Core, can be publishing to Zenodo. When a dataset is published to Zenodo a Digital Object Identifier (DOI) is created by Zenodo API for given resource, which simplify sharing the dataset.

The Zenodo publishing action is triggered when the *Generate DwC-Archive* is clicked and the Zenodo API access token is definied in the add-on settings. So, before enabling Zenodo publishing you have acquire the Zenodo access token in your Zenodo account.

## Getting Zenodo Access Token

To get an access token login into your Zenodo account, and under the *Applications* section in your profile create a **New personal access token** and be certified to check appropriated scopes. In order to allow the add-on to publish to your Zenodo account select at least both scopes **deposit:actions** and **deposit:write**. Then click into **Create** button.

![Creating Zenodo personal access token](/assets/img/zenodo.png)

Copy the new created token into the *Settings* sidemenu (activated in the add-on submenu) and selected the option **Enable Zenodo Upload**, then click **Save**.

![Setting Zenodo access token](/assets/img/settings.png)

After that, every time the *Generate DwC-Archive* action is triggered the DwC-Archive will be upload to Zenodo.

**Note**: if a Zenodo deposition already exists for the current dataset, a new version of the dataset will be generated, instead of a new deposition. It allows update and persistance of previous generated DOI.

## Downloading the DwC-Archive

After the DwC-Archive is successfull generated a dialog will be presented to the user with a link to download the archive, which can be therefore shared and/or used in third-party systems as Integrated Publishing Toolkit (IPT)](https://www.gbif.org/ipt).

**Note:** all DwC-Archives generated by the add-on are stored in user's personal Google Drive, in folder called **DWCA-ADDON**. Although, DwC-Archives and other files generated by the add-on can be accessed from this folder, it is not recommended, as changes in this folder can cause malfunction of the add-on, requiring that the user remove and install the add-on again. However, it is usefull for accessing the CSV, EML and `meta.xml` files for manual edition and creation of DwC-Archive.

# GBIF API

Cooming soon! The write access to GBIF API is allowed only to organizations that are already member of GBIF Registry. Although, the add-on includes features to publish DwC-Archives to GBIF Registry by setting the endpoints to Zenodo depositions, it was only tested in a local installation of GBIF API.

We hope that we can get access to [GBIF Sandbox API](http://api.gbif-uat.org/v1/) for testing, but the request to access the API is still pending. As soon as, the access to sandbox API is granted this functionally will be enabled in the next realease of the add-on.

**Note**: the DwC-Archive generated by the add-on can be downloaded and shared with GBIF or any node in the GBIF Registry using a installation of [Integrated Publishing Toolkit (IPT)](https://www.gbif.org/ipt).

# License

The add-on is released with a [GNU GENERAL PUBLIC LICENSE Version 3](https://github.com/zedomel/dwca-gsheet-assistant/blob/master/LICENSE) which means that it is free and copyleft, **as all Science should be**!