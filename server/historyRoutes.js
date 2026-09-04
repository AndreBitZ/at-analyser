import { rows } from "./db.js";

const MATCH_SELECT = `
  SELECT m.*,
    ht.name AS home_team_name, at.name AS away_team_name,
    hc.name AS home_club_name, ac.name AS away_club_name,
    ch.name AS championship_name, sz.label AS season_label
  FROM matches m
  JOIN teams ht ON ht.id = m.home_team_id
  JOIN teams at ON at.id = m.away_team_id
  JOIN clubs hc ON hc.id = ht.club_id
  JOIN clubs ac ON ac.id = at.club_id
  LEFT JOIN championships ch ON ch.id = m.championship_id
  LEFT JOIN seasons sz ON sz.id = m.season_id
`;

export async function historyRoutes(db, res, path, method, parts, send) {
  if (method !== "GET") return false;

  if (parts[0] === "championships" && parts[2] === "matches" && parts[1]) {
    send(res, 200, rows(await db.execute({
      sql: `${MATCH_SELECT} WHERE m.championship_id = ? ORDER BY m.kickoff_iso ASC`,
      args: [parts[1]],
    })));
    return true;
  }

  if (parts[0] === "clubs" && parts[2] === "matches" && parts[1]) {
    send(res, 200, rows(await db.execute({
      sql: `${MATCH_SELECT} WHERE ht.club_id = ? OR at.club_id = ? ORDER BY m.kickoff_iso DESC`,
      args: [parts[1], parts[1]],
    })));
    return true;
  }

  if (parts[0] === "players" && parts[2] === "matches" && parts[1]) {
    send(res, 200, rows(await db.execute({
      sql: `${MATCH_SELECT}
        WHERE EXISTS (
          SELECT 1 FROM player_team_season pts
          WHERE pts.player_id = ?
            AND pts.team_id IN (m.home_team_id, m.away_team_id)
            AND (m.season_id IS NULL OR pts.season_id = m.season_id)
            AND (pts.left_at IS NULL OR m.kickoff_iso IS NULL OR pts.left_at >= m.kickoff_iso)
        )
        OR EXISTS (
          SELECT 1 FROM stints st WHERE st.player_id = ? AND st.match_id = m.id
        )
        ORDER BY m.kickoff_iso DESC`,
      args: [parts[1], parts[1]],
    })));
    return true;
  }

  return false;
}
