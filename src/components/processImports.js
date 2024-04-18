import { handleChangePF } from './processForm';
import path from 'path';
import { changePage } from './handlePageChange';
const { spawnSync } = require('node:child_process');
const isDev = window.process.argv.slice(-4, -1)[2];

const jsonfilePath = window.process.argv.slice(-4, -1)[1];
const jsonfile = require(jsonfilePath);
//const jsonfile = require(path.join(__dirname, '../app.asar/node_modules/jsonfile'));
//const jsonfile = require('jsonfile');

function processCellfileColumnsMismatches(formSettings, storagePath, store){
	// processing which columns are in which different cell files, so user can handle what want to do

	// this is json processed by processing.py
	let cellFileColumns = formSettings.private['column-mismatches-json']
	// where each name is cell file name, and value is array of column headers

	// get all cell files
	let cellFiles = Object.keys(cellFileColumns);

	// get all headers
	let headers = Object.values(cellFileColumns).flat(2);  // flatten out array of arrays, into onelist
	
	// get unique headers
	let uniqueHeaders = new Set(headers);
	uniqueHeaders = Array.from(uniqueHeaders);  // back to array

	// object to carry mismatch data
	let cellFileMismatches = {};

	// loop over each header, if not in all arrays, then record which ones is and isn't in, and default fill values.
	for (var i = 0; i < uniqueHeaders.length; i++) {

		cellFileMismatches[uniqueHeaders[i]] = {};  // name of header
		cellFileMismatches[uniqueHeaders[i]]['isIn'] = [];  // array of files that header is in
		cellFileMismatches[uniqueHeaders[i]]['notIn'] = [];  // array of files that header is not in

		// add defaults of how to handle for store
		cellFileMismatches[uniqueHeaders[i]]['handle'] = 'remove';  // how to handle, remove or fill
		cellFileMismatches[uniqueHeaders[i]]['fillValue'] = '';  // default fill value is blank

		for (var j = 0; j < cellFiles.length; j++) {
			// record whether that header is in cell file
			if (cellFileColumns[cellFiles[j]].includes(uniqueHeaders[i])) {
				cellFileMismatches[uniqueHeaders[i]]['isIn'].push(cellFiles[j]);
			} else {
				cellFileMismatches[uniqueHeaders[i]]['notIn'].push(cellFiles[j]);
			}
		}

		// convert arrays to strings so can be displayed easier
		cellFileMismatches[uniqueHeaders[i]]['isIn'] = cellFileMismatches[uniqueHeaders[i]]['isIn'].join(', ')
		cellFileMismatches[uniqueHeaders[i]]['notIn'] = cellFileMismatches[uniqueHeaders[i]]['notIn'].join(', ')

		// if no mismatches, then remove from json
		if (cellFileMismatches[uniqueHeaders[i]]['notIn'].length === 0) {
			delete cellFileMismatches[uniqueHeaders[i]]
		}
	}

	// call handle change
	let event = {target:{value: cellFileMismatches, name:'column-mismatches'}};
	handleChangePF(event, store, storagePath)

	// return json
	// mismatched column name, which files it is in and which is missing in, default for remove/ fill, default for fill value
	// handle how it changes, do similar to process metaDataTo Include
}

function processMetadataToInclude(formSettings, storagePath, store) {
	// processing which metadata should be included. pass a list of metadata, and whether is checked by default

	// this is edited by processing.py
	let metaArray = formSettings.private['meta-data-array']

	// test
	//metaArray = ['RawFileName', 'Channel', 'CellType', 'OtherOption1', 'OtherOption2']

	// return list of objects with name and default checked
	let returnArr = [];

	// array to test against if should be checked by default
	const defaultDisabled = ["RawFileName", "Channel", "CellType"];

	// loop over metaArray and check if needs to be default checked or not
	for (var i = 0; i < metaArray.length; i++) {

		let disabled;
		//let defChecked;
		let checked;

		// if array element is in default checked, then set as needing to be checked by default
		if (defaultDisabled.indexOf(metaArray[i]) >= 0) {
			disabled = true;
			//defChecked = true;  // checked by default
			checked = true;  // for consistency with processForm.js, whether it ends up checked
		} else {
			disabled = false;
			//defChecked = false;
			checked = false;
		}

		// add to array
        returnArr.push({'name': metaArray[i], 'checked': checked, 'disabled': disabled});
    }
	// call handle change
	let event = {target:{value: returnArr, name:'meta-to-include'}};
	handleChangePF(event, store, storagePath)
}

function processLoadCellPopulationNames(formSettings, storagePath, store) {

	// process cell population names at import to populate other options page
	let cellPathArray = formSettings.form['cell-files-path']

	let cellPopulations = [];

	// parse names of cell files from array
	for (var i = 0; i < cellPathArray.length; i++) {

		// remove everything before the last "\\""
		let lastIndex = cellPathArray[i].lastIndexOf('\\');
      	let fileNameWPath = cellPathArray[i].substr(lastIndex+1, cellPathArray[i].length)

		// remove file extension
		let fileName = fileNameWPath.split('.')[0]

		// add to array
        cellPopulations.push(fileName);
    }
	// call handle change
	let event = {target:{value: cellPopulations, name:'cell-population-names'}};
	handleChangePF(event, store, storagePath)

}

function getDataFromImports(storagePath, store) {
	// call the python script to get data from imports and add to jsons.
	// TODO this needs to be updated to find python path in production
	//path.join(app.getAppPath(), '..', 'python_scripts/my_script.py'
	//https://stackoverflow.com/questions/41199981/run-python-script-in-electron-app
	//let python = spawn('python', [path.join(app.getAppPath(), '..', 'python_scripts/my_script.py'])

	// for now get it to run from venv
	// run in sync, only continue processing when exited

	let pythonProcess;
	console.log(isDev);
	
	if (isDev === "true") {
		let pythonProcess = spawnSync('C:/Users/alexr/PycharmProjects/3_9/python/Scripts/python',["C:/Users/alexr/OneDrive/Documents/Work/CBF/Emmott_Annotation/code/processing.py", storagePath, "processimport"]);
		console.log(pythonProcess.stdout)
	} else {
		console.log("processing.exe path is:")
		console.log(path.join(__dirname, '..', 'processing/processing.exe'));
		let pythonProcess = spawnSync(path.join(__dirname, '..', 'processing/processing.exe'), [storagePath, "processimport"]);
		console.log(pythonProcess.stdout)
	}
}

export function handleProcessImports(storagePath, store) {
	// process imported files

	// set cursor to waiting
	document.body.style.cursor  = 'wait';

	// run python script to update json
	getDataFromImports(storagePath, store)

	let formSettings = jsonfile.readFileSync(storagePath)

	processLoadCellPopulationNames(formSettings, storagePath, store)

	processMetadataToInclude(formSettings, storagePath, store)
	
	processCellfileColumnsMismatches(formSettings, storagePath, store)

	// set cursor to normal
	document.body.style.cursor  = 'auto';

	// go to meta page only once processing done
	changePage('meta');
}