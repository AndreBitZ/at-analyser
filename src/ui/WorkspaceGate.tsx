import { useState } from "react";
import { api } from "../data/sqliteApi";

export default function WorkspaceGate({ onReady }: { onReady: (root: string) => void }) {
  const [path, setPath] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);

  async function openRoot(root: string) {
    const res = await api("/workspace", { method: "POST", body: JSON.stringify({ root }) });
    onReady(res.root);
  }

  async function browse() {
    setBusy(true);
    setErr("");
    try {
      const picked = await api("/workspace/browse", { method: "POST", body: "{}" });
      if (!picked.root) throw new Error("Nenhuma pasta escolhida");
      setPath(picked.root);
      await openRoot(picked.root);
    } catch (e: any) {
      setErr(e.message + " — se a janela não abrir, usa o caminho manual.");
      setManual(true);
    } finally {
      setBusy(false);
    }
  }

  async function useTyped() {
    if (!path.trim()) return;
    setBusy(true);
    setErr("");
    try { await openRoot(path.trim()); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "40px auto" }}>
      <h3>Onde estão os dados?</h3>
      <p className="muted">Abre a janela do Windows/Mac e escolhe a pasta do disco (interno ou externo). A app cria lá a base, fotos e vídeos.</p>
      <button type="button" onClick={browse} disabled={busy}>
        {busy ? "A abrir janela…" : "Escolher pasta"}
      </button>
      {path && <p className="muted" style={{ marginTop: 8 }}>{path}</p>}
      {err && <p className="note">{err}</p>}
      <p>
        <button type="button" className="ghost" onClick={() => setManual((v) => !v)}>Escrever o caminho à mão</button>
      </p>
      {manual && (
        <div className="stack">
          <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="E:\AT-Analyser" />
          <button type="button" onClick={useTyped} disabled={busy}>Usar este caminho</button>
        </div>
      )}
    </div>
  );
}
