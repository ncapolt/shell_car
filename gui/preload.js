const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    sendCommand: (command) => ipcRenderer.invoke('send-command', command),
    connect: () => ipcRenderer.invoke('connect'),
    startListeners: () => ipcRenderer.invoke('start-listeners'),
});
