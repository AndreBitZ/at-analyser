import type { Store } from "./localStore";

const FILE_NAME = "at-analyser-db.json";
const FILE_ID_KEY = "at-analyser-drive-file-id";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

let token: string | null = null;
let tokenClient: any = null;

export function clientId(): string {
  return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";
}

function loadGis(): Promise<void> {
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha a carregar Google Identity"));
    document.head.appendChild(s);
  });
}

export async function connectDrive(): Promise<boolean> {
  const cid = clientId();
  if (!cid) throw new Error("Falta VITE_GOOGLE_CLIENT_ID. Vê docs/DRIVE.md");
  await loadGis();
  return new Promise((resolve, reject) => {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: cid,
      scope: SCOPE,
      callback: (resp: any) => {
        if (resp.error) {
          reject(new Error(resp.error));
          return;
        }
        token = resp.access_token;
        resolve(true);
      },
    });
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

export function isDriveConnected() {
  return Boolean(token);
}

async function api(path: string, init: RequestInit = {}) {
  if (!token) throw new Error("Drive não ligado");
  const res = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  if (res.status === 401) {
    token = null;
    throw new Error("Sessão Google expirou. Liga o Drive outra vez.");
  }
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res;
}

async function ensureFileId(): Promise<string> {
  const cached = localStorage.getItem(FILE_ID_KEY);
  if (cached) return cached;
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const list = await api(`files?q=${q}&spaces=drive&fields=files(id,name)`);
  if (list.files?.[0]?.id) {
    localStorage.setItem(FILE_ID_KEY, list.files[0].id);
    return list.files[0].id;
  }
  const created = await api("files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: FILE_NAME, mimeType: "application/json" }),
  });
  localStorage.setItem(FILE_ID_KEY, created.id);
  return created.id;
}

export async function pushToDrive(store: Store) {
  const id = await ensureFileId();
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...store, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function pullFromDrive(): Promise<Store | null> {
  const id = await ensureFileId();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}
