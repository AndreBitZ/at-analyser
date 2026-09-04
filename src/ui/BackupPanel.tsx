import { FormEvent, useEffect, useState } from "react";
import { api } from "../data/sqliteApi";

export default function BackupPanel() {
  const [dest, setDest] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [enabled, setEnabled] = useState(false);
  const [info, setInfo] = useState("");

  async function refresh() {
    const s = await api("/backup");
    setDest(s.dest || "");
    setIntervalMinutes(s.intervalMinutes || 60);
    setEnabled(Boolean(s.enabled));
    if (s.last) setInfo(`Último: ${s.last.at} → ${s.last.target}`);
    if (s.lastError) setInfo(s.lastError);
  }

  useEffect(() => { refresh().catch(() => {}); }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    await api("/backup", { method: "POST", body: JSON.stringify({ dest, intervalMinutes, enabled: true }) });
    const r = await api("/backup/run", { method: "POST", body: "{}" });
    setInfo(`Cópia feita: ${r.target}`);
    setEnabled(true);
  }

  return (
    <form className="card" onSubmit={save}>
      <h3>Backup automático</h3>
      <p className="muted">
        Segundo sítio (outro disco). Se deixares vazio, as cópias ficam em exportacoes/backups na própria pasta — não protege se o disco falhar.
      </p>
      <div className="stack">
        <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="D:\Backups\AT-Analyser" />
        <label className="muted">
          De à hora{" "}
          <input type="number" min={5} value={intervalMinutes} onChange={(e) => setIntervalMinutes(Number(e.target.value))} style={{ width: 80 }} />
          {" "}minutos
        </label>
      </div>
      <button type="submit" style={{ marginTop: 10 }}>{enabled ? "Guardar e copiar agora" : "Activar e copiar agora"}</button>
      {info && <p className="muted">{info}</p>}
    </form>
  );
}
