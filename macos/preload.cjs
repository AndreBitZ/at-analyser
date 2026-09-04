const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("mac", {
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  defaultFolder: () => ipcRenderer.invoke("default-folder"),
  lastFolder: () => ipcRenderer.invoke("last-folder"),
  rememberFolder: (path) => ipcRenderer.invoke("remember-folder", path),
  revealInFinder: (path) => ipcRenderer.invoke("reveal-in-finder", path),
  notify: (title, body) => ipcRenderer.invoke("notify", { title, body }),
  print: () => ipcRenderer.invoke("print"),
  onOpenFolder: (fn) => ipcRenderer.on("mac:open-folder", (_e, p) => fn(p)),
  onBackup: (fn) => ipcRenderer.on("mac:backup", () => fn()),
});
