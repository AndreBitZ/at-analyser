import { createServer } from "node:http";
import { createDb, migrate, sqlitePath } from "./db.js";
import { handleApi } from "./api.js";

const port = Number(process.env.PORT || 8787);
const db = createDb();
await migrate(db);

const server = createServer(async (req, res) => {
  if (req.url === "/" || req.url === "/health") req.url = "/api/health";
  if (!req.url.startsWith("/api")) {
    res.writeHead(404);
    res.end("use /api");
    return;
  }
  await handleApi(db, req, res);
});

server.listen(port, () => {
  console.log(`AT Analyser SQLite: ${sqlitePath()}`);
  console.log(`API: http://localhost:${port}`);
});
