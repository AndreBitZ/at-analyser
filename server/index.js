import { createServer } from "node:http";
import { handleApi } from "./api.js";
import { getDb } from "./workspace.js";

const port = Number(process.env.PORT || 8787);

const server = createServer(async (req, res) => {
  if (req.url === "/" || req.url === "/health") req.url = "/api/health";
  if (!req.url.startsWith("/api")) {
    res.writeHead(404);
    res.end("use /api");
    return;
  }
  await handleApi(getDb(), req, res);
});

server.listen(port, () => {
  console.log(`AT Analyser API http://localhost:${port}`);
  console.log("Escolhe a pasta de dados na app.");
});
