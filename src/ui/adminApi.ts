import { api } from "../data/sqliteApi";

export const get = api;
export const post = (path: string, body: object) => api(path, { method: "POST", body: JSON.stringify(body) });
export const patch = (path: string, body: object) => api(path, { method: "PATCH", body: JSON.stringify(body) });
