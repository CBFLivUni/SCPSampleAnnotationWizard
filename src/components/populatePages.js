import path from 'path';
import log from 'electron-log'
const fs = require('fs');
const jsonfilePath = processAdditionalArgs('jsonfilePath');
const jsonfile = require(jsonfilePath);
//const jsonfile = require(path.join(__dirname, '../app.asar/node_modules/jsonfile'));
//const jsonfile = require('jsonfile');

// on page load, current settings are returned so can be accessed as js vars in page

export function getValuesToPopulatePage(storagePath) {
	//console.log(window.process.argv)
	let formSettings = jsonfile.readFileSync(storagePath)

	return(formSettings);
}

export function processAdditionalArgs(key) {
	//argv = ["ARGS|storagePath-C:\\Users\\alexr\\OneDrive\\Documents\\Work\\CBF\\Emmott_Annotation\\Application\\scpannotation\\data.json|jsonfilePath-jsonfile|isDev-true|outputPath-C:\\Users\\alexr\\Documents|platform-win32"]
	// process the args string that is passed in contain all args, more robust and better
	// cross platform functionality as Mac vs Windows includes differing number of args
	// return as JSON

	// working everywhere other than mac prod
	console.log('populatepageglobalspath')
	log.info('populatePages path')
	//log.info(global.GlobalJSONPath);
	//let settings = JSON.parse(fs.readFileSync(path.join(global.GlobalJSONPath), "utf8"));

	let settingsJSON;
	window.bridge.sendSettings((event, settings) => {
		settingsJSON = settings;
	})
	//let settings = JSON.parse(fs.readFileSync("globals.json", "utf8"));

	console.log(settingsJSON)

	return settingsJSON[key]
	
	/*
	let argString;
	// find arg that begins with ARG|
	for (var i = argv.length; i--;){
		if (argv[i].startsWith("ARGS|")){
			argString = argv[i];
		}
	}
	let argArray = argString.split('|');

	let processedJSON = {};

	for (var i = 0; i < argArray.length; i++) {
		if(argArray[i] !== 'ARGS') {
			let strSplit = argArray[i].split('-');
			processedJSON[strSplit[0]] = strSplit[1]
		}
	}

	return processedJSON;
	*/
}