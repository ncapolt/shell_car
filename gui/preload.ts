const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electron", {
  sendCommand: (command: any) => ipcRenderer.invoke("send-command", command),
  connect: () => ipcRenderer.invoke("connect"),
  startListeners: () => ipcRenderer.invoke("start-listeners"),
  cancelBluetoothRequest: () => ipcRenderer.send("cancel-bluetooth-request"),
  bluetoothPairingRequest: (callback: any) =>
    ipcRenderer.on("bluetooth-pairing-request", () => callback()),
  bluetoothPairingResponse: (response: any) =>
    ipcRenderer.send("bluetooth-pairing-response", response),
});
