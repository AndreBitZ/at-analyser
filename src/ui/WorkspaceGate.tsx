import { useState } from "react";
import { api } from "../data/sqliteApi";

declare global {
  interface Window {
    mac?: {
      pickFolder: () => Promise<string | null>;
      defaultFolder: () => Promise<string>;
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
    onReady(res.root);
  }

  async function browse() {
    setBusy(true); setErr("");
    try {
      let folder: string | null = null;
      if (window.mac) folder = await window.mac.pickFolder();
      else {
        const picked = await api("/workspace/browse", { method: "POST", body: "{}" });
        folder = picked.root;
      }
      if (!folder) throw new Error("Nenhuma pasta escolhida");
      setPath(folder);
      await openRoot(folder);
    } catch (e: any) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  async function useMacDefault() {
    setBusy(true); setErr("");
    try {
      const folder = window.mac ? await window.mac.defaultFolder() : (await api("/workspace/mac-default")).root;
      setPath(folder);
      await openRoot(folder);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "40px auto" }}>
      <h3>AT Analyser no Mac</h3>
      <p className="muted">
        Escolhe no Finder a pasta do disco (interno ou externo). Ou usa a pasta padrão do macOS
        em Biblioteca / Application Support / AT-Analyser.
      </p>
      <button type="button" onClick={browse} disabled={busy}>
        {busy ? "A abrir o Finder…" : electron ? "Escolher pasta no Finder" : "Escolher pasta"}
      </button>
      <button type="button" onClick={useMacDefault} disabled={busy}>Pasta padrão do Mac</button>
      {path && <p className="muted">{path}</p>}
      {err && <p className="note">{err}</p>}
    </div>
  );
}
