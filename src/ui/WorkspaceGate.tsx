import { useEffect, useState } from "react";
import { api } from "../data/sqliteApi";

declare global {
  interface Window {
    mac?: {
      pickFolder: () => Promise<string | null>;
      defaultFolder: () => Promise<string>;
      lastFolder: () => Promise<string | null>;
      rememberFolder: (path: string) => Promise<void>;
      revealInFinder: (path: string) => Promise<void>;
      notify: (title: string, body: string) => Promise<void>;
      print: () => Promise<void>;
      onOpenFolder: (fn: (path: string | null) => void) => void;
      onBackup: (fn: () => void) => void;
    };
  }
}

export default function WorkspaceGate({ onReady }: { onReady: (root: string) => void }) {
  const [path, setPath] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const electron = Boolean(window.mac);

  async function openRoot(root: string) {
    const res = await api("/workspace", { method: "POST", body: JSON.stringify({ root }) });
    await window.mac?.rememberFolder?.(res.root);
    onReady(res.root);
  }

  useEffect(() => {
    if (!window.mac) return;
    window.mac.lastFolder().then((p) => { if (p) openRoot(p).catch((e) => setErr(String(e.message))); });
    window.mac.onOpenFolder((p) => { if (p) openRoot(p).catch((e) => setErr(String(e.message))); });
  }, []);

  async function browse() {
    setBusy(true); setErr("");
    try {
      const folder = window.mac ? await window.mac.pickFolder() : (await api("/workspace/browse", { method: "POST", body: "{}" })).root;
      if (!folder) throw new Error("Nenhuma pasta escolhida");
      setPath(folder);
      await openRoot(folder);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function useMacDefault() {
    setBusy(true); setErr("");
    try {
      const folder = window.mac ? await window.mac.defaultFolder() : "";
      if (!folder) throw new Error("Pasta padrão indisponível fora do app Mac");
      setPath(folder);
      await openRoot(folder);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "80px auto" }}>
      <h3>AT Analyser no Mac</h3>
      <p className="muted">Finder para a pasta do disco, ou a pasta padrão em Biblioteca / Application Support.</p>
      <button type="button" onClick={browse} disabled={busy}>{busy ? "A abrir o Finder…" : electron ? "Escolher pasta no Finder" : "Escolher pasta"}</button>
      <button type="button" onClick={useMacDefault} disabled={busy}>Pasta padrão do Mac</button>
      {path && <p className="muted">{path}</p>}
      {err && <p className="note">{err}</p>}
    </div>
  );
}
