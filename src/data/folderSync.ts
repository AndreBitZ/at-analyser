const DB = "at-analyser-fs";
const STORE = "handles";
const KEY = "dir";
const FILE = "at-analyser-db.json";

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putHandle(handle: FileSystemDirectoryHandle) {
  const db = await idb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export function canUseFolder(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export async function pickFolder(): Promise<FileSystemDirectoryHandle> {
  const handle = await (window as any).showDirectoryPicker({
    id: "at-analyser",
    mode: "readwrite",
    startIn: "documents",
  });
  await putHandle(handle);
  return handle;
}

async function ensurePermission(handle: FileSystemDirectoryHandle) {
  const opts = { mode: "readwrite" as const };
  if ((await (handle as any).queryPermission(opts)) === "granted") return true;
  return (await (handle as any).requestPermission(opts)) === "granted";
}

export async function writeFolder(data: unknown) {
  const handle = await getHandle();
  if (!handle) throw new Error("Nenhuma pasta escolhida");
  if (!(await ensurePermission(handle))) throw new Error("Sem permissão para a pasta");
  const file = await handle.getFileHandle(FILE, { create: true });
  const w = await file.createWritable();
  await w.write(JSON.stringify({ ...((data as object) || {}), updated_at: new Date().toISOString() }, null, 2));
  await w.close();
}

export async function readFolder(): Promise<any | null> {
  const handle = await getHandle();
  if (!handle) return null;
  if (!(await ensurePermission(handle))) return null;
  try {
    const file = await handle.getFileHandle(FILE);
    const text = await (await file.getFile()).text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}
