// electron.js
import electron, { app, BrowserWindow, ipcMain } from 'electron'
import store from 'electron-json-storage';
import log from 'electron-log'
import os from 'os';
import { dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev'
import jsonfile from 'jsonfile'
import { settingsDefaults} from './src/components/storeDefaults.js'
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// set path for file storage, send to all processes

var storagePath;
if (isDev){
  // dev
  storagePath = path.join(app.getAppPath('userData'), 'data.json');
} else {
  // prod
  storagePath = path.join(app.getAppPath('userData'), '..', 'data.json');
}

// in production jsonfile cannot be found for some reason (other modules can) so give path
var jsonfilePath = isDev
  ? 'jsonfile'
  : path.join(__dirname, '..', 'app.asar', 'node_modules', 'jsonfile');

var outputPath = app.getPath('documents');

log.initialize();

function createWindow() {

  // sanitise file paths if windows. Windows uses \ by default, so act as escape chars.
  // fine on mac
  storagePath = storagePath.replace(/\\/g, '\\\\'); // escape backslashes
  jsonfilePath = jsonfilePath.replace(/\\/g, '\\\\'); // escape backslashes
  outputPath = outputPath.replace(/\\/g, '\\\\'); // escape backslashes

  let settings = {"storagePath": storagePath,
                  "jsonfilePath": jsonfilePath,
                  "isDev": isDev.toString(),
                  "outputPath": outputPath,
                  "platform": process.platform.toString()};

  // IPC works for all formats, except mac prod, for mac prod, save JSON to userData and have hard coded path to get from other side
  // not ideal, but not other way to send data or access app. from renderer.
  console.log(path.join(app.getPath("userData"), "settings.json"))
  fs.writeFileSync(path.join(app.getPath("userData"), "settings.json"), JSON.stringify(settings));

  let mainWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    icon: path.join(__dirname, 'favicon_wiz.ico'),
    webPreferences: {
      webSecurity: false,  // to allow file access in production
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  //mainWindow.webContents.openDevTools()

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html#')}`;  // as use hashrouter

  console.log(settings)

  log.info(startURL);
  mainWindow.loadURL(startURL)
    .then(() => { mainWindow.webContents.send('settings', settings); })
    .then(() => mainWindow.show())
  return mainWindow
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
  if (process.platform !== 'darwin') app.quit()
});
