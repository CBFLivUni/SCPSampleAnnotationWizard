// electron.js
//const { app, BrowserWindow } = require('electron');
//const path = require('path');
import electron, { app, BrowserWindow } from 'electron'
import store from 'electron-json-storage';
import log from 'electron-log'
//import log from 'electron-log/main';
import os from 'os';
//import electron from 'electron';
import { dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
//const isDev = require('electron-is-dev');
import isDev from 'electron-is-dev'
//import * as fs from 'fs';
import jsonfile from 'jsonfile'
import { settingsDefaults} from './src/components/storeDefaults.js'
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// set path for file storage, send to all processes

// put this in path next to asar. not in, cannot access if in
var storagePath = isDev
  ? path.join(app.getAppPath('userData'), 'data.json')
  : path.join(app.getAppPath('userData'), '..', 'data.json');

// in production jsonfile cannot be found for some reason (other modules can) so give path
var jsonfilePath = isDev
  ? 'jsonfile'
  : path.join(__dirname, '../app.asar/node_modules/jsonfile');

var outputPath = app.getPath('documents');

function createWindow() {

  // sanitise file paths if windows. Windows uses \ by default, so act as escape chars.
  // fine on mac
  storagePath = storagePath.replace(/\\/g, '\\\\'); // escape backslashes
  jsonfilePath = jsonfilePath.replace(/\\/g, '\\\\'); // escape backslashes
  outputPath = outputPath.replace(/\\/g, '\\\\'); // escape backslashes

  log.initialize();
  log.info(process.platform.toString());
  log.info(process.platform)
  log.info('ARGS' + '|storagePath-' + storagePath + '|jsonfilePath-' + jsonfilePath + '|isDev-' + isDev.toString() + '|outputPath-' + outputPath + '|platform-' + process.platform.toString())
  
  //fs.writeFileSync('globals.js', 'ARGS' + '|storagePath-' + storagePath + '|jsonfilePath-' + jsonfilePath + '|isDev-' + isDev.toString() + '|outputPath-' + outputPath + '|platform-' + process.platform.toString())

  let settings = {"storagePath": storagePath,
                  "jsonfilePath": jsonfilePath,
                  "isDev": isDev.toString(),
                  "outputPath": outputPath,
                  "platform": process.platform.toString()};

  var settingsString = JSON.stringify(settings);
  fs.writeFileSync('globals.json', settingsString);

  let mainWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    icon: path.join(__dirname, 'favicon_wiz.ico'),
    webPreferences: {
      webSecurity: false,  // to allow file access in production
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // pass some paths and check if dev to all processes. must be string, that is parsed later
      //additionalArguments: ['ARGS' + '|storagePath-' + storagePath + '|jsonfilePath-' + jsonfilePath + '|isDev-' + isDev.toString() + '|outputPath-' + outputPath + '|platform-' + process.platform.toString()]  // pass some paths and check if dev to all processes.
      //preload: path.join(__dirname, 'preload.js')
    },
  });
  mainWindow.webContents.openDevTools()

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html#')}`;  // as use hashrouter

  log.info(startURL);
  mainWindow.loadURL(startURL);

  //mainWindow.on('closed', () => (mainWindow = null));
};

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // for mac
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });

  // remove json to reset user settings when starting app
  store.setDataPath(os.tmpdir());
	store.clear();

  // then set defaults.
  // using electron json storage
  store.set('formSettings', settingsDefaults);  //formSettingsDefaults

  log.info('process')
  log.info(process.platform)

  // check settings being set correctly
  log.info("storagePath is:")
  log.info(storagePath)
  jsonfile.writeFileSync(storagePath, settingsDefaults)
});

app.on('window-all-closed', () => {
  fs.unlinkSync('globals.json');
  if (process.platform !== 'darwin') app.quit()
});
