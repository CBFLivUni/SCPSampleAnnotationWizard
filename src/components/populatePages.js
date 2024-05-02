import path from 'path';
import log from 'electron-log'
const fs = require('fs');
const isDev = processAdditionalArgs('isDev')
const jsonfilePath = processAdditionalArgs('jsonfilePath');
const jsonfile = require(jsonfilePath);
var ipcRenderer = require('electron').ipcRenderer;
// watch for data being sent when window open and writing settings to file
log.initialize();
log.info('log working')
ipcRenderer.on('settings', (event, settings) => {
	log.info(settings);
	console.log(settings);
	writeSettings(settings);
});
//const jsonfile = require(path.join(__dirname, '../app.asar/node_modules/jsonfile'));
//const jsonfile = require('jsonfile');

// on page load, current settings are returned so can be accessed as js vars in page
export function getValuesToPopulatePage(storagePath) {
	//console.log(window.process.argv)
	let formSettings = jsonfile.readFileSync(storagePath)

	return(formSettings);
}

function getAppData () {
	let appDataPath;
	if (window.process.platform === 'darwin') {
		appDataPath = path.join('/Users', window.process.env.USER, 'Library', 'Application Support', 'scpannotation');
	} else if (window.process.platform === 'win32') {
		appDataPath = path.join(window.process.env.LOCALAPPDATA, 'scpannotation').replace('Local', 'Roaming');
	}

	return appDataPath
}

function writeSettings (settings) {
	// runs once when app starts.
	// write to json, where can be accessed by renderer, if written in main can't necessarily get path correct
	let appDataPath = getAppData()

	fs.writeFileSync(path.join(appDataPath, "settings.json"), JSON.stringify(settings))
}

export function processAdditionalArgs(key) {
	//argv = ["ARGS|storagePath-C:\\Users\\alexr\\OneDrive\\Documents\\Work\\CBF\\Emmott_Annotation\\Application\\scpannotation\\data.json|jsonfilePath-jsonfile|isDev-true|outputPath-C:\\Users\\alexr\\Documents|platform-win32"]
	// process the args string that is passed in contain all args, more robust and better
	// cross platform functionality as Mac vs Windows includes differing number of args
	// return as JSON

	// working everywhere other than mac prod
	//log.info(global.GlobalJSONPath);
	//let settings = JSON.parse(fs.readFileSync(path.join(global.GlobalJSONPath), "utf8"));

	//let settingsJSON;
	//window.bridge.sendSettings((event, settings) => {
	//	settingsJSON = settings;
	//})

	// mac prod ipc not working
	// manually find user data path
	let appDataPath = getAppData()

	let settingsJSON = JSON.parse(fs.readFileSync(path.join(appDataPath, "settings.json"), "utf8"));

	return settingsJSON[key]
	
}