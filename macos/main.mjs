import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const defaultFolder = join(homedir(), "Library", "Application Support", "AT-Analyser");
let serverProc;
let viteProc;

function startBg() {
  serverProc = spawn("node", ["server/index.js"], { cwd: root, stdio: "inherit" });
  viteProc = spawn("npx", ["vite", "--port", "5173", "--strictPort"], { cwd: root, stdio: "inherit", shell: true });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    title: "AT Analyser",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(fileURLToPath(new URL(".", import.meta.url)), "preload.cjs"),
      contextIsolation: true,
    },
  });
  win.loadURL("http://localhost:5173");
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

ipcMain.handle("pick-folder", async () => {
  const r = await dialog.showOpenDialog({
    title: "Pasta AT Analyser",
    defaultPath: defaultFolder,
    properties: ["openDirectory", "createDirectory"],
    message: "Escolhe a pasta onde ficam a base, fotos e vídeos",
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle("default-folder", () => defaultFolder);

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: "appMenu" },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ]));
  startBg();
  setTimeout(createWindow, 1200);
});

app.on("before-quit", () => {
  serverProc?.kill();
  viteProc?.kill();
});
