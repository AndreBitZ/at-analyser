import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi } from "./api.js";
import { getDb } from "./workspace.js";

const port = Number(process.env.PORT || 8787);
const here = fileURLToPath(new URL(".", import.meta.url));
const dist = process.env.AT_DIST || join(here, "../dist");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function sendFile(res, file) {
  const type = MIME[extname(file)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  createReadStream(file).pipe(res);
}

const server = createServer(async (req, res) => {
  const url = req.url || "/";
  if (url.startsWith("/api") || url === "/health") {
    if (url === "/health") req.url = "/api/health";
    await handleApi(getDb(), req, res);
    return;
  }
  if (existsSync(dist)) {
    const clean = url.split("?")[0];
    const file = join(dist, clean === "/" ? "index.html" : clean);
    if (existsSync(file) && statSync(file).isFile()) { sendFile(res, file); return; }
    sendFile(res, join(dist, "index.html"));
    return;
  }
  res.writeHead(404);
  res.end("API only");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AT Analyser http://127.0.0.1:${port}`);
});
