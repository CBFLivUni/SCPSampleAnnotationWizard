const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'bridge', {
  sendSettings: (message) => {
    ipcRenderer.on('sendSettings', message);
  }
});