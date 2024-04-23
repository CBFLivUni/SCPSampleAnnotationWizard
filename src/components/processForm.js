import log from 'electron-log'
log.initialize();
var path = require('path');
const jsonfilePath = window.process.argv.slice(-5, -1)[1];
const jsonfile = require(jsonfilePath);
//const jsonfile = require(path.join(__dirname, '../app.asar/node_modules/jsonfile'));
//const jsonfile = require('jsonfile');
const outputPath = window.process.argv.slice(-5, -1)[3];

function processImportPaths(event, tag, storagePath) {
  // update text in p element with upload name and get real path

  let p_tag = document.getElementById(tag)
  let realPath = getValuePath(event, storagePath)
  p_tag.innerText = realPath

  return realPath
};


function getValuePath(event, storagePath) {
  // get true path for imported file

  let real_path

  if (event.target.value.includes("fakepath")) {

    let settings = jsonfile.readFileSync(storagePath)

    // if folder path uploaded, i.e. if output path or raw files folder, then keep only folder, not file
    if ((event.target.name === "output-path") || (event.target.name === "raw-files-path" && settings.form["raw-files-group"] === "folder")) {

      // if output folder, then just need folder, not file
      let folderPath = event.target.files[0].path
      let lastIndex = folderPath.lastIndexOf('\\');
      real_path = folderPath.substr(0, lastIndex)

    } else {
      // add f name from fakepath and add to real path
      real_path = event.target.files[0].path

    }}
  return real_path
};


function checkImportPageComplete(settings, store, storagePath) {
  // when all files are set in store, i.e. imported, enable Next button and remove tooltip

  // read current form settings
  //let currSettings = store.getSync('formSettings');
  let currSettings = jsonfile.readFileSync(storagePath)
                  
  // add new settings from change
  let updatedSettings = currSettings;

  console.log((settings.form["raw-files-path"] !== "undefined" &&
    settings.form["label-file-path"] !== "undefined" &&
    settings.form["pickup-file-path"] !== "undefined" &&
    settings.form["cell-files-path"] !== "undefined" &&
    settings.form["name"] !== "undefined"))

  console.log(settings.form["raw-files-path"] !== "undefined")
  console.log(settings.form["label-file-path"] !== "undefined")
  console.log(settings.form["pickup-file-path"] !== "undefined")
  console.log(settings.form["cell-files-path"] !== "undefined")
  console.log(settings.form["output-path"] !== "")
  console.log(settings)

  if ((settings.form["raw-files-path"] !== "undefined" &&
        settings.form["label-file-path"] !== "undefined" &&
        settings.form["pickup-file-path"] !== "undefined" &&
        settings.form["cell-files-path"] !== "undefined" &&
        settings.private["name-job"] !== "undefined")) {

          // only if all values are set, enable button
          // enable button
          // edit dom so changes are made instantly, but also edit json so changes are saved for next time
          updatedSettings.private["NextImportButton-text"] = "Import";
          document.getElementById("NextImportButton").text ="Import";
          updatedSettings.private["NextImportButton-disabled"] = false;
          document.getElementById("NextImportButton").classList.remove("Mui-disabled")

        } else {

          // disable button and tell user to complete imports
          updatedSettings.private["NextImportButton-text"] = "Complete all imports";
          document.getElementById("NextImportButton").text = "Complete all imports";
          updatedSettings.private["NextImportButton-disabled"] = true;
          document.getElementById("NextImportButton").classList.add("Mui-disabled")

        }
  //store.set('formSettings', updatedSettings, {validate:true});
  jsonfile.writeFileSync(storagePath, updatedSettings)
}

function ensureValueSet(store, desiredVals, path, tagName, n) {
  // try and set values 50 times, if fail to set, throw alert to user.

  if (n === 0) {
    // if value not set over any iteration, then throw alert
    alert("Can't save data")
    store.set('privateSettings', desiredVals)
    return
  }
  if (store.getSync('privateSettings')[tagName] !== path) {
    // if value not set, try and set again.
    store.set('privateSettings', desiredVals)
    ensureValueSet(store, desiredVals, path, tagName, n - 1)
  } else {
    // if is set, then leave
    return
  }
}

function processPrivateStore(event, store, path) {  // store
  // when handle change for a component, also add the desire p tag to the private store
  // assumes that the id for the p tag associated with the component name is 'event.name'+'-tag'
  
  // get name of p tag id associated with component
  let tagName = event.target.name.concat("-tag")

  let currPrivateSettings = store.getSync('privateSettings');
    
  // add new settings from change
  let updatedPrivateSettings = currPrivateSettings;

  // set the target name of form as the key, and add path as the tag
  updatedPrivateSettings["test"] = "test";  //path

  // sometimes just isn't set in store and don't know why. Set, check if set, loop over until set. This isn't a good fix.
  // write too quickly and file locks. so loop over until set.
  // .lock file  being created and deleted very quickly seems to cause error
  store.set('privateSettings', updatedPrivateSettings);

  console.log("SET")

  console.log(store)
  console.log(updatedPrivateSettings)
  console.log(path)
  console.log(tagName)
  console.log(store.getSync('privateSettings'))

  //ensureValueSet(store, updatedPrivateSettings, path, tagName, 50)
  
}


export const handleChangePF = (event, store, storagePath) => {
    // handle form change input. 
    console.log(event)

    // for checking whether need to check if check import page needs to run
    let pageName = document.URL;

    let formVal;
    let formKey;
    let privateVal;
    let privateKey;

    // if statement to handle each input for readability
    // each statement needs private or form key and value
    // easier to control what goes into private and form
    // IMPORT PAGE
    if (event.target.name === "raw-files-path") {
      let pTag = "raw-files-path-tag";  // associated with import

      formKey = event.target.name
      formVal = processImportPaths(event, pTag, storagePath)

      // add p tag changes to private store
      privateVal = formVal;
      privateKey = pTag;

    } else if (event.target.name === "raw-files-group") {
      formKey = event.target.name
      formVal = event.target.value

    } else if (event.target.name === "label-file-path") {
      let pTag = "label-file-path-tag";  // associated with import

      formKey = event.target.name
      formVal = processImportPaths(event, pTag, storagePath)

      // add p tag changes to private store
      privateVal = formVal;
      privateKey = pTag;

    } else if (event.target.name === "pickup-file-path") {
      let pTag = "pickup-file-path-tag";  // associated with import
      
      formKey = event.target.name
      formVal = processImportPaths(event, pTag, storagePath)

      // add p tag changes to private store
      privateVal = formVal;
      privateKey = pTag;

    } else if (event.target.name === "cell-files-path") {
      let pTag = "cell-files-path-tag";  // associated with import

      // as multiple files, process as array, and make p tag a string of array
      // get paths of all files
      let arrFiles = []
      var files = event.target.files;
      for (var i = 0; i < files.length; i++) {
        arrFiles.push(files[i].path);
      }

      let stringFiles = arrFiles.join('\n\n')

      // set values in form as array
      formKey = event.target.name
      formVal = arrFiles

      // set the ptag as a string with line breaks
      // add p tag changes to private store
      let p_tag = document.getElementById(pTag)
      p_tag.innerText = stringFiles
      privateVal = stringFiles;
      privateKey = pTag;

    } else if (event.target.name === "name-job") {
      // now that only name a job, add it to "my documents" path

      formKey = "output-path";
      formVal = path.join(outputPath, 'ScpSampleAnnotationWizardOutput', event.target.value)

      // add name to private store.
      privateKey = "name-job";
      privateVal = event.target.value;

    } else if (event.target.name === "output-path") {
      let pTag = "output-path-tag";  // associated with import
      
      formKey = event.target.name
      formVal = processImportPaths(event, pTag, storagePath)

      // add p tag changes to private store
      privateVal = formVal;
      privateKey = pTag;
    // META PAGE
    } else if (event.target.name === "meta-to-include") {
      // called from import page, and full json with meta data to include as list is added to storage

      formVal = event.target.value;
      formKey = event.target.name;

    } else if (event.target.name === "change-meta") {
        // similar to above but called from meta page not import
        // called from meta page when tick boxes are being edited and certain values in json are changed
        // just get the whole meta form dom and parse what you need
        // needs to correspond to values in processMetadataToInclude in processImport.js
        var inputEles = document.getElementById('meta-form').getElementsByTagName("input")

        // then just reprocess json to add.
        var jsonMeta = [];

        for (var i = 0; i < inputEles.length; i++) {
          let disabled = inputEles[i].labels[0].classList.contains('Mui-disabled');  // if disabled or not
          //let defChecked = disabled;  // default in processImports is that if disabled, then is checked
          let checked = inputEles[i].checked;

          jsonMeta.push({'name': inputEles[i].labels[0].innerText, 'checked': checked, 'disabled': disabled});
        }

        formKey = 'meta-to-include';  // when read values next time, read from this key
        formVal = jsonMeta;
    } else if (event.target.name === "column-mismatches") {
      // called from import page, full json with column mismatches to include as json is added to storage
      formVal = event.target.value;
      formKey = event.target.name;

    } else if (event.target.name === "column-mismatches-change") {
      // called from meta page when change are made, full json with column mismatches to include as json is added to storage

      formVal = event.target.value;
      formKey = "column-mismatches";  // when read values next time, read from this key

    // OTHER PAGE
    } else if (event.target.name === "cell-population-names") {
      formVal = event.target.value;
      formKey = event.target.name;

    } else if (event.target.name === "label-missing-data") {
      formVal = event.target.value;
      formKey = event.target.name;

    } else if (event.target.name === "extra-rows") {
      formVal = event.target.value;
      formKey = event.target.name;

    } else if (event.target.name === "well-to-tmt-mapping") {
      formKey = event.target.name
      formVal = event.target.value

      // enable select file button if dropdown set to "select"
      if (formVal === 'select') {
        document.getElementById("select-tmt-mapping").classList.remove("Mui-disabled")
        privateVal = false;
        privateKey = "select-tmt-mapping-disabled";

      } else {
        document.getElementById("select-tmt-mapping").classList.add("Mui-disabled")
        privateVal = true;
        privateKey = "select-tmt-mapping-disabled";

      }
    } else if (event.target.name === "tmt-mapping-path") {
      let pTag = "tmt-mapping-path-tag";  // associated with import
      
      formKey = event.target.name
      formVal = processImportPaths(event, pTag, storagePath)

      // add p tag changes to private store
      privateVal = formVal;
      privateKey = pTag;

    }

    // read current form settings
    //let currFormSettings = store.getSync('formSettings');
    let currFormSettings = jsonfile.readFileSync(storagePath)
    
    // add new settings from change
    let updatedFormSettings = currFormSettings;

    // if values exist for form storage then set
    if (typeof formVal !== 'undefined') {
      updatedFormSettings.form[formKey] = formVal;
    }

    // if values exist for private storage then set
    if (typeof privateVal !== 'undefined') {
      updatedFormSettings.private[privateKey] = privateVal;
    }

    //store.set('formSettings', updatedFormSettings, {validate:true});
    jsonfile.writeFileSync(storagePath, updatedFormSettings)

    // when on import page, then check if can update next button
    // import is home '/', so check not on any other page
    if (!(pageName.includes('meta') || pageName.includes('other') || pageName.includes('output'))) {
      checkImportPageComplete(updatedFormSettings, store, storagePath)
    }
  };


  export function setUpStoreObj() {
    // create store json and set up in tempdir
    //const store = require('electron-json-storage');
    //const os = require('os');
    //store.setDataPath(os.tmpdir());
    
    // dummy val prevent error
    const store = '';
    //const fs = require("fs");
    //fs.writeFile("store.json");
    return store
  }