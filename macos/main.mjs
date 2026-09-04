import { app, BrowserWindow, Notification, dialog, ipcMain, Menu, nativeTheme, shell } from "electron";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { lastFolder, writePrefs } from "./prefs.mjs";

const projectRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const defaultFolder = join(homedir(), "Library", "Application Support", "AT-Analyser");
let serverProc;
let viteProc;
let win;

function send(ch, data) {
  win?.webContents.send(ch, data);
}

function startBg() {
  serverProc = spawn("node", ["server/index.js"], { cwd: projectRoot, stdio: "inherit" });
  viteProc = spawn("npx", ["vite", "--port", "5173", "--strictPort"], { cwd: projectRoot, stdio: "inherit", shell: true });
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
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" }, { role: "hideOthers" }, { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Ficheiro",
      submenu: [
        { label: "Abrir pasta…", accelerator: "Cmd+O", click: async () => send("mac:open-folder", await pickFolder()) },
        { label: "Pasta padrão do Mac", click: () => send("mac:open-folder", defaultFolder) },
        { label: "Mostrar no Finder", accelerator: "Cmd+Shift+O", click: () => {
          const p = lastFolder() || defaultFolder;
          shell.showItemInFolder(p);
        } },
        { type: "separator" },
        { label: "Cópia de segurança", accelerator: "Cmd+B", click: () => send("mac:backup") },
        { label: "Imprimir relatório", accelerator: "Cmd+P", click: () => win?.webContents.print({}) },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    {
      label: "Ajuda",
      submenu: [
        { label: "Documentação Mac", click: () => shell.openPath(join(projectRoot, "docs", "MACOS.md")) },
      ],
    },
  ]));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "AT Analyser",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0e1412" : "#f4f7f5",
    webPreferences: {
      preload: join(fileURLToPath(new URL(".", import.meta.url)), "preload.cjs"),
      contextIsolation: true,
      spellcheck: true,
    },
  });
  win.loadURL("http://localhost:5173");
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

ipcMain.handle("pick-folder", pickFolder);
ipcMain.handle("default-folder", () => defaultFolder);
ipcMain.handle("last-folder", () => lastFolder());
ipcMain.handle("remember-folder", (_e, path) => writePrefs({ lastFolder: path }));
ipcMain.handle("reveal-in-finder", (_e, path) => {
  if (path) shell.showItemInFolder(path);
});
ipcMain.handle("notify", (_e, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title: title || "AT Analyser", body: body || "" }).show();
});
ipcMain.handle("print", () => win?.webContents.print({}));

app.setName("AT Analyser");
app.setAboutPanelOptions({
  applicationName: "AT Analyser",
  applicationVersion: "0.3.0",
  copyright: "Análise de andebol — Apple Silicon",
});

app.whenReady().then(() => {
  if (process.arch !== "arm64") {
    dialog.showErrorBox("AT Analyser", "Esta app é só para Mac com chip M (Apple Silicon).");
  }
  buildMenu();
  startBg();
  setTimeout(createWindow, 1200);
});

app.on("open-file", (e, path) => {
  e.preventDefault();
  writePrefs({ lastFolder: path });
  send("mac:open-folder", path);
});

app.on("before-quit", () => {
  serverProc?.kill();
  viteProc?.kill();
});
