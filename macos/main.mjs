import { app, BrowserWindow, Notification, dialog, ipcMain, Menu, nativeTheme, shell } from "electron";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { lastFolder, writePrefs } from "./prefs.mjs";

const packaged = app.isPackaged;
const projectRoot = packaged
  ? join(process.resourcesPath, "appdata")
  : join(fileURLToPath(new URL(".", import.meta.url)), "..");
const defaultFolder = join(homedir(), "Library", "Application Support", "AT-Analyser");
const ui = packaged ? "http://127.0.0.1:8787" : "http://127.0.0.1:5173";
let serverProc;
let viteProc;
let win;

function send(ch, data) {
  win?.webContents.send(ch, data);
}

function startBg() {
  serverProc = spawn(packaged ? process.execPath : "node", packaged ? [] : ["server/index.js"], {
    cwd: packaged ? projectRoot : projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: packaged ? "1" : "",
      PORT: "8787",
      AT_DIST: join(projectRoot, "dist"),
    },
  });
  if (packaged) {
    const script = join(projectRoot, "server", "index.js");
    serverProc = spawn(process.execPath, [script], {
      cwd: projectRoot,
      stdio: "inherit",
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", PORT: "8787", AT_DIST: join(projectRoot, "dist") },
    });
  } else {
    serverProc = spawn("node", ["server/index.js"], { cwd: projectRoot, stdio: "inherit" });
    viteProc = spawn("npx", ["vite", "--port", "5173", "--strictPort"], { cwd: projectRoot, stdio: "inherit", shell: true });
  }
}

async function pickFolder() {
  const r = await dialog.showOpenDialog(win || undefined, {
    title: "Pasta AT Analyser",
    defaultPath: lastFolder() || defaultFolder,
    properties: ["openDirectory", "createDirectory"],
    message: "Escolhe a pasta da base, fotos e vídeos",
  });
  if (r.canceled) return null;
  writePrefs({ lastFolder: r.filePaths[0] });
  return r.filePaths[0];
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: app.name, submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "quit" }] },
    {
      label: "Ficheiro",
      submenu: [
        { label: "Abrir pasta…", accelerator: "Cmd+O", click: async () => send("mac:open-folder", await pickFolder()) },
        { label: "Pasta padrão do Mac", click: () => send("mac:open-folder", defaultFolder) },
        { label: "Mostrar no Finder", accelerator: "Cmd+Shift+O", click: () => shell.showItemInFolder(lastFolder() || defaultFolder) },
        { type: "separator" },
        { label: "Cópia de segurança", accelerator: "Cmd+B", click: () => send("mac:backup") },
        { label: "Imprimir relatório", accelerator: "Cmd+P", click: () => win?.webContents.print({}) },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ]));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 960, minHeight: 640,
    title: "AT Analyser",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0e1412" : "#f4f7f5",
    webPreferences: {
      preload: join(fileURLToPath(new URL(".", import.meta.url)), "preload.cjs"),
      contextIsolation: true,
    },
  });
  win.loadURL(ui);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
}

ipcMain.handle("pick-folder", pickFolder);
ipcMain.handle("default-folder", () => defaultFolder);
ipcMain.handle("last-folder", () => lastFolder());
ipcMain.handle("remember-folder", (_e, path) => writePrefs({ lastFolder: path }));
ipcMain.handle("reveal-in-finder", (_e, path) => { if (path) shell.showItemInFolder(path); });
ipcMain.handle("notify", (_e, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title: title || "AT Analyser", body: body || "" }).show();
});
ipcMain.handle("print", () => win?.webContents.print({}));

app.setName("AT Analyser");
app.setAboutPanelOptions({ applicationName: "AT Analyser", applicationVersion: "0.3.0", copyright: "Andebol — Apple Silicon" });

app.whenReady().then(() => {
  if (process.arch !== "arm64") dialog.showErrorBox("AT Analyser", "Só para Mac com chip M.");
  buildMenu();
  startBg();
  setTimeout(createWindow, packaged ? 800 : 1200);
});

app.on("open-file", (e, path) => {
  e.preventDefault();
  writePrefs({ lastFolder: path });
  send("mac:open-folder", path);
});

app.on("before-quit", () => { serverProc?.kill(); viteProc?.kill(); });
