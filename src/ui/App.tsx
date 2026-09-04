import { useEffect, useState } from "react";
import WorkspaceGate from "./WorkspaceGate";
import { Atletas, Campeonatos, Clubes, Epocas, Geral, Jogos } from "./Pages";
import FichaJogo from "./FichaJogo";
import Regulamento from "./Regulamento";
import RelatorioPage from "./RelatorioPage";
import WatchlistPage from "./WatchlistPage";
import SearchPage from "./SearchPage";
import ScorecardPage from "./ScorecardPage";
import { post } from "./adminApi";
import { api } from "../data/sqliteApi";

type Page = "geral" | "epoca" | "campeonato" | "clube" | "atletas" | "jogos" | "ficha" | "ihf" | "relatorio" | "watch" | "search" | "card";

export default function App() {
  const [root, setRoot] = useState<string | null>(null);
  const [page, setPage] = useState<Page>("geral");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/health").then((h) => {
      if (h.ready && h.root && h.root !== "turso") setRoot(h.root);
    }).catch(() => {});
  }, []);

  async function backup() {
    try {
      const r = await post("/backup", {});
      setMsg(`Cópia em ${r.file}`);
      await window.mac?.notify?.("Cópia feita", r.file || "Backup gravado");
    } catch (e: any) { setMsg(e.message); }
  }

  useEffect(() => {
    window.mac?.onBackup?.(backup);
    window.mac?.onOpenFolder?.((p) => { if (p) setRoot(p); });
  }, []);

  if (!root) return <WorkspaceGate onReady={setRoot} />;

  const Btn = ({ id, label }: { id: Page; label: string }) => (
    <button className={page === id ? "on" : ""} onClick={() => setPage(id)}>{label}</button>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">AT Analyser</div>
        <p className="side-path" title={root}>{root}</p>
        <nav>
          <p className="muted">Arquivo</p>
          <Btn id="geral" label="Geral" />
          <Btn id="search" label="Pesquisa" />
          <Btn id="epoca" label="Época" />
          <Btn id="campeonato" label="Campeonato" />
          <Btn id="clube" label="Clube" />
          <Btn id="atletas" label="Atletas" />
          <Btn id="jogos" label="Jogos" />
          <p className="muted">Jogo</p>
          <Btn id="ficha" label="Ficha de jogo" />
          <Btn id="ihf" label="Regulamento IHF" />
          <p className="muted">Scout</p>
          <Btn id="relatorio" label="Relatório adversário" />
          <Btn id="card" label="Scorecard" />
          <Btn id="watch" label="Watchlist" />
        </nav>
        <button type="button" className="ghost" onClick={backup}>Cópia de segurança</button>
        <button type="button" className="ghost" onClick={() => window.mac?.revealInFinder?.(root)}>Mostrar no Finder</button>
        <button type="button" className="ghost" onClick={() => setRoot(null)}>Mudar pasta</button>
        {msg && <p className="side-path">{msg}</p>}
      </aside>
      <main className="main">
        {page === "geral" && <Geral />}
        {page === "search" && <SearchPage />}
        {page === "epoca" && <Epocas />}
        {page === "campeonato" && <Campeonatos />}
        {page === "clube" && <Clubes />}
        {page === "atletas" && <Atletas />}
        {page === "jogos" && <Jogos />}
        {page === "ficha" && <FichaJogo />}
        {page === "relatorio" && <RelatorioPage />}
        {page === "card" && <ScorecardPage />}
        {page === "watch" && <WatchlistPage />}
        {page === "ihf" && <Regulamento />}
      </main>
    </div>
  );
}
