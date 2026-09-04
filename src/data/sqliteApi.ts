export type Health = { ok: boolean; mode: string } | null;

export async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function probeSqlite(): Promise<Health> {
  try {
    const h = await api("/health");
    return h;
  } catch {
    return null;
  }
}
