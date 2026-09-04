const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("mac", {
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  defaultFolder: () => ipcRenderer.invoke("default-folder"),
});
