import { useState } from "react";
import { api } from "../data/sqliteApi";

export default function WorkspaceGate({ onReady }: { onReady: (root: string) => void }) {
  const [path, setPath] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const hosted = typeof window !== "undefined" && !window.location.hostname.includes("localhost");

  async function openRoot(root: string) {
    const res = await api("/workspace", { method: "POST", body: JSON.stringify({ root }) });
    onReady(res.root);
  }

  async function enterCloud() {
    setBusy(true); setErr("");
    try { await openRoot("turso"); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function browse() {
    setBusy(true); setErr("");
    try {
      const picked = await api("/workspace/browse", { method: "POST", body: "{}" });
      if (!picked.root) throw new Error("Nenhuma pasta escolhida");
      setPath(picked.root);
      await openRoot(picked.root);
    } catch (e: any) {
      setErr(e.message);
      setManual(true);
    } finally { setBusy(false); }
  }

  if (hosted) {
    return (
      <div className="card" style={{ maxWidth: 560, margin: "40px auto" }}>
        <h3>AT Analyser na nuvem</h3>
        <p className="muted">No Vercel os dados ficam no Turso. A pasta do PC só existe se correres a app no computador.</p>
        <button type="button" onClick={enterCloud} disabled={busy}>{busy ? "A ligar…" : "Entrar"}</button>
        {err && <p className="note">{err}</p>}
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "40px auto" }}>
      <h3>Onde estão os dados?</h3>
      <p className="muted">No PC podes escolher uma pasta. No Vercel usa Turso.</p>
      <button type="button" onClick={browse} disabled={busy}>{busy ? "A abrir janela…" : "Escolher pasta no PC"}</button>
      <button type="button" onClick={enterCloud} disabled={busy}>Usar Turso</button>
      {path && <p className="muted">{path}</p>}
      {err && <p className="note">{err}</p>}
      <p><button type="button" className="ghost" onClick={() => setManual((v) => !v)}>Escrever o caminho</button></p>
      {manual && (
        <div className="stack">
          <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="E:\AT-Analyser" />
          <button type="button" onClick={() => openRoot(path.trim())} disabled={busy}>Usar este caminho</button>
        </div>
      )}
    </div>
  );
}
