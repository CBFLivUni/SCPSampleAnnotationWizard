import path from 'path';
const jsonfilePath = processAdditionalArgs(window.process.argv)['jsonfilePath'];
const jsonfile = require(jsonfilePath);
//const jsonfile = require(path.join(__dirname, '../app.asar/node_modules/jsonfile'));
//const jsonfile = require('jsonfile');

// on page load, current settings are returned so can be accessed as js vars in page

export function getValuesToPopulatePage(storagePath) {
	console.log(window.process.argv)
	let formSettings = jsonfile.readFileSync(storagePath)

	return(formSettings);
}

export function processAdditionalArgs(argv) {
	// process the args string that is passed in contain all args, more robust and better
	// cross platform functionality as Mac vs Windows includes differing number of args
	// return as JSON

	let argString;
	// find arg that begins with ARG|
	for (var i = argv.length; i--;){
		console.log(argv[i])
		if (argv[i].startsWith("ARGS|")){
			argString = argv[i];
		}
	}
	let argArray = argString.split('|');

	let processedJSON = {};

	for (var i = 0; i < argArray.length; i++) {
		if(argArray[i] !== 'ARGS') {
			console.log(i)
			console.log(argArray);
			console.log(argArray[i])
			let strSplit = argArray[i].split('-');
			processedJSON[strSplit[0]] = strSplit[1]
		}
	}

	return processedJSON;
}