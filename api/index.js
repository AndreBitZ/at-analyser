export default function handler(_req, res) {
  res.statusCode = 410;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "AT Analyser é só local. Corre npm run server no PC." }));
}
