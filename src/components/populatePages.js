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
	// mac prod ipc not working
	// manually find user data path
	let appDataPath = getAppData()

	let settingsJSON = JSON.parse(fs.readFileSync(path.join(appDataPath, "settings.json"), "utf8"));

	return settingsJSON[key]
	
}