import { useState } from "react";
import WorkspaceGate from "./WorkspaceGate";
import { Atletas, Campeonatos, Clubes, Epocas, Geral, Jogos } from "./Pages";
import FichaJogo from "./FichaJogo";
import Regulamento from "./Regulamento";
import RelatorioPage from "./RelatorioPage";
import WatchlistPage from "./WatchlistPage";

type Page = "geral" | "epoca" | "campeonato" | "clube" | "atletas" | "jogos" | "ficha" | "ihf" | "relatorio" | "watch";

const MENU: { id: Page; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "epoca", label: "Época" },
  { id: "campeonato", label: "Campeonato" },
  { id: "clube", label: "Clube" },
  { id: "atletas", label: "Atletas" },
  { id: "jogos", label: "Jogos" },
  { id: "ficha", label: "Ficha de jogo" },
  { id: "relatorio", label: "Relatório adversário" },
  { id: "watch", label: "Watchlist" },
  { id: "ihf", label: "Regulamento IHF" },
];

export default function App() {
  const [root, setRoot] = useState<string | null>(null);
  const [page, setPage] = useState<Page>("geral");
  if (!root) return <WorkspaceGate onReady={setRoot} />;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">AT Analyser</div>
        <p className="side-path" title={root}>{root}</p>
        <nav>
          {MENU.map((item) => (
            <button key={item.id} className={page === item.id ? "on" : ""} onClick={() => setPage(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button type="button" className="ghost" onClick={() => setRoot(null)}>Mudar pasta</button>
      </aside>
      <main className="main">
        {page === "geral" && <Geral />}
        {page === "epoca" && <Epocas />}
        {page === "campeonato" && <Campeonatos />}
        {page === "clube" && <Clubes />}
        {page === "atletas" && <Atletas />}
        {page === "jogos" && <Jogos />}
        {page === "ficha" && <FichaJogo />}
        {page === "relatorio" && <RelatorioPage />}
        {page === "watch" && <WatchlistPage />}
        {page === "ihf" && <Regulamento />}
      </main>
    </div>
  );
}
