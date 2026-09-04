import { createDb, migrate } from "../server/db.js";
import { handleApi } from "../server/api.js";

let ready;
async function getDb() {
  if (!process.env.TURSO_DATABASE_URL && !process.env.LIBSQL_URL) return null;
  if (!ready) {
    const db = createDb();
    await migrate(db);
    ready = db;
  }
  return ready;
}

export default async function handler(req, res) {
  const db = await getDb();
  if (!db) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Na Vercel o SQLite do PC não persiste. Cria uma base Turso e define TURSO_DATABASE_URL + TURSO_AUTH_TOKEN. No PC usa npm run server.",
    }));
    return;
  }
  req.url = req.url.startsWith("/api") ? req.url : `/api${req.url}`;
  await handleApi(db, req, res);
}
