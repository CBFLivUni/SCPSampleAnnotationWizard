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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// set path for file storage, send to all processes

// put this in path next to asar. not in, cannot access if in
const storagePath = isDev
  ? app.getAppPath('userData') + '/data.json'
  : path.join(app.getAppPath('userData'), '..', '/data.json');

// in production jsonfile cannot be found for some reason (other modules can) so give path
const jsonfilePath = isDev
  ? 'jsonfile'
  : path.join(__dirname, '../app.asar/node_modules/jsonfile');

const outputPath = app.getPath('documents');

function createWindow() {
  
  var mainWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    icon: path.join(__dirname, 'favicon_wiz.ico'),
    webPreferences: {
      webSecurity: false,  // to allow file access in production
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // pass some paths and check if dev to all processes. must be string, that is parsed later
      additionalArguments: ['ARGS' + '|storagePath-' + storagePath + '|jsonfilePath-' + jsonfilePath + '|isDev-' + isDev.toString() + '|outputPath-' + outputPath]  // pass some paths and check if dev to all processes.
      //preload: path.join(__dirname, 'preload.js')
    },
  });
  mainWindow.webContents.openDevTools()

  log.initialize();

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html#')}`;  // as use hashrouter

  mainWindow.loadURL(startURL);

  mainWindow.on('closed', () => (mainWindow = null));

}

app.on('ready', () => {
  createWindow();

  app.on('activate', () => {
    // for mac
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // remove json to reset user settings when starting app
  store.setDataPath(os.tmpdir());
	store.clear();

  // then set defaults.
  // using electron json storage
  store.set('formSettings', settingsDefaults);  //formSettingsDefaults

  // check settings being set correctly
  log.info("storagePath is:")
  log.info(storagePath)
  jsonfile.writeFileSync(storagePath, settingsDefaults)
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
