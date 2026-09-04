import { handleApi } from "../server/api.js";
import { ensureDb, getDb } from "../server/workspace.js";

export default async function handler(req, res) {
  try {
    await ensureDb();
  } catch (err) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: String(err.message || err) }));
    return;
  }
  await handleApi(getDb(), req, res);
}
