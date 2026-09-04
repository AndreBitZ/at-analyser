import { id, row, rows } from "./db.js";
import { historyRoutes } from "./historyRoutes.js";

export async function extraRoutes(db, req, res, path, method, parts, json, send) {
  if (!db) return false;
  if (await historyRoutes(db, res, path, method, parts, send)) return true;

  if (method === "GET" && path === "/stats") {
    const one = async (sql) => Number((await db.execute(sql)).rows[0]?.n || 0);
    send(res, 200, {
      clubs: await one("SELECT COUNT(*) AS n FROM clubs"),
      age_groups: await one("SELECT COUNT(*) AS n FROM age_groups"),
      seasons: await one("SELECT COUNT(*) AS n FROM seasons"),
      championships: await one("SELECT COUNT(*) AS n FROM championships"),
      teams: await one("SELECT COUNT(*) AS n FROM teams"),
      players: await one("SELECT COUNT(*) AS n FROM players"),
      matches: await one("SELECT COUNT(*) AS n FROM matches"),
      transfers: await one("SELECT COUNT(*) AS n FROM player_transfers"),
    });
    return true;
  }

  if (method === "GET" && path === "/dashboard") {
    const q = async (sql) => rows(await db.execute(sql));
    send(res, 200, {
      positions: await q("SELECT primary_position AS label, COUNT(*) AS value FROM players GROUP BY primary_position ORDER BY value DESC"),
      playersByClub: await q("SELECT c.name AS label, COUNT(p.id) AS value FROM clubs c LEFT JOIN players p ON p.club_id = c.id GROUP BY c.id ORDER BY value DESC"),
      teamsByClub: await q("SELECT c.name AS label, COUNT(t.id) AS value FROM clubs c LEFT JOIN teams t ON t.club_id = c.id GROUP BY c.id ORDER BY value DESC"),
      matchesByChamp: await q("SELECT COALESCE(ch.name, 'Sem campeonato') AS label, COUNT(m.id) AS value FROM matches m LEFT JOIN championships ch ON ch.id = m.championship_id GROUP BY label ORDER BY value DESC"),
      matchesBySeason: await q("SELECT COALESCE(s.label, 'Sem época') AS label, COUNT(m.id) AS value FROM matches m LEFT JOIN seasons s ON s.id = m.season_id GROUP BY label ORDER BY value DESC"),
      rosterByTeam: await q("SELECT t.name AS label, COUNT(*) AS value FROM player_team_season pts JOIN teams t ON t.id = pts.team_id WHERE pts.left_at IS NULL GROUP BY t.id ORDER BY value DESC"),
    });
    return true;
  }

  if (method === "GET" && path === "/rosters") {
    send(res, 200, rows(await db.execute(`SELECT pts.*, p.name AS player_name, t.name AS team_name, s.label AS season_label FROM player_team_season pts JOIN players p ON p.id = pts.player_id JOIN teams t ON t.id = pts.team_id JOIN seasons s ON s.id = pts.season_id ORDER BY s.label DESC, t.name, p.name`)));
    return true;
  }
  if (method === "GET" && path === "/transfers") {
    send(res, 200, rows(await db.execute(`SELECT tr.*, p.name AS player_name, a.name AS from_team_name, b.name AS to_team_name, s.label AS season_label FROM player_transfers tr JOIN players p ON p.id = tr.player_id LEFT JOIN teams a ON a.id = tr.from_team_id JOIN teams b ON b.id = tr.to_team_id JOIN seasons s ON s.id = tr.season_id ORDER BY tr.transferred_at DESC`)));
    return true;
  }
  if (method === "POST" && path === "/transfers") {
    const b = await json(req);
    const tid = id("tr");
    await db.execute({ sql: "INSERT INTO player_transfers (id, player_id, from_team_id, to_team_id, season_id, notes) VALUES (?, ?, ?, ?, ?, ?)", args: [tid, b.player_id, b.from_team_id || null, b.to_team_id, b.season_id, b.notes || null] });
    if (b.from_team_id) {
      await db.execute({ sql: "UPDATE player_team_season SET left_at = datetime('now') WHERE player_id = ? AND team_id = ? AND season_id = ?", args: [b.player_id, b.from_team_id, b.season_id] });
    }
    await db.execute({ sql: "INSERT OR IGNORE INTO player_team_season (player_id, team_id, season_id) VALUES (?, ?, ?)", args: [b.player_id, b.to_team_id, b.season_id] });
    await db.execute({ sql: "UPDATE player_team_season SET left_at = NULL WHERE player_id = ? AND team_id = ? AND season_id = ?", args: [b.player_id, b.to_team_id, b.season_id] });
    send(res, 201, { id: tid });
    return true;
  }
  if (method === "PATCH" && parts[0] === "seasons" && parts[1]) {
    const b = await json(req);
    await db.execute({ sql: "UPDATE seasons SET label = COALESCE(?, label), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date) WHERE id = ?", args: [b.label ?? null, b.start_date ?? null, b.end_date ?? null, parts[1]] });
    send(res, 200, row(await db.execute({ sql: "SELECT * FROM seasons WHERE id = ?", args: [parts[1]] })));
    return true;
  }
  if (method === "PATCH" && parts[0] === "championships" && parts[1]) {
    const b = await json(req);
    await db.execute({ sql: "UPDATE championships SET name = COALESCE(?, name), season_id = COALESCE(?, season_id), organizer = COALESCE(?, organizer) WHERE id = ?", args: [b.name ?? null, b.season_id ?? null, b.organizer ?? null, parts[1]] });
    send(res, 200, { ok: true }); return true;
  }
  if (method === "PATCH" && parts[0] === "clubs" && parts[1]) {
    const b = await json(req);
    await db.execute({ sql: "UPDATE clubs SET name = COALESCE(?, name), city = COALESCE(?, city) WHERE id = ?", args: [b.name ?? null, b.city ?? null, parts[1]] });
    send(res, 200, { ok: true }); return true;
  }
  if (method === "PATCH" && parts[0] === "players" && parts[1]) {
    const b = await json(req);
    await db.execute({ sql: "UPDATE players SET name = COALESCE(?, name), shirt_number = COALESCE(?, shirt_number), primary_position = COALESCE(?, primary_position), club_id = COALESCE(?, club_id) WHERE id = ?", args: [b.name ?? null, b.shirt_number ?? null, b.primary_position ?? null, b.club_id ?? null, parts[1]] });
    send(res, 200, { ok: true }); return true;
  }
  if (method === "PATCH" && parts[0] === "matches" && parts[1]) {
    const b = await json(req);
    await db.execute({ sql: "UPDATE matches SET championship_id = COALESCE(?, championship_id), venue = COALESCE(?, venue), kickoff_iso = COALESCE(?, kickoff_iso), status = COALESCE(?, status) WHERE id = ?", args: [b.championship_id ?? null, b.venue ?? null, b.kickoff_iso ?? null, b.status ?? null, parts[1]] });
    send(res, 200, { ok: true }); return true;
  }
  if (method === "PATCH" && parts[0] === "teams" && parts[1]) {
    const b = await json(req);
    await db.execute({ sql: "UPDATE teams SET name = COALESCE(?, name), short_name = COALESCE(?, short_name) WHERE id = ?", args: [b.name ?? null, b.short_name ?? null, parts[1]] });
    send(res, 200, { ok: true }); return true;
  }
  return false;
}
