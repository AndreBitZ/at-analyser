import { FormEvent, useState } from "react";
import { api } from "../data/sqliteApi";

export default function WorkspaceGate({ onReady }: { onReady: (root: string) => void }) {
  const [path, setPath] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await api("/workspace", { method: "POST", body: JSON.stringify({ root: path }) });
      onReady(res.root);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 560, margin: "40px auto" }}>
      <h3>Onde estão os dados?</h3>
      <p className="muted">
        Indica a pasta do disco (interno ou externo). A app cria lá a base e as pastas de fotos, logos e vídeos.
        Exemplo Windows: <code>E:\AT-Analyser</code> · Mac: <code>/Volumes/Andebol/AT-Analyser</code>
      </p>
      <input
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="E:\AT-Analyser"
        required
        style={{ width: "100%" }}
      />
      {err && <p className="note">{err}</p>}
      <button type="submit" disabled={busy} style={{ marginTop: 12 }}>
        {busy ? "A abrir…" : "Usar esta pasta"}
      </button>
    </form>
  );
}
