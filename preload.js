console.log("this is the preload script");
//const { contextBridge, ipcRenderer } = require('electron');
//import { contextBridge, ipcRenderer } from 'electron';

console.log("this is the preload script");

contextBridge.exposeInMainWorld(
  'bridge', {
  sendSettings: (message) => {
    ipcRenderer.send('settings', message);
  }
});
