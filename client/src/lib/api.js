import { TOTAL } from "./constants.js";
export { TOTAL };

// Vite proxies /api to the Express server in dev; in production Express
// serves this bundle itself, so a relative path works in both.
const BASE = import.meta.env.VITE_API_URL || "";

export async function fetchState() {
  const res = await fetch(`${BASE}/api/state`);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
    } catch {
      /* response wasn't JSON */
    }
    throw new Error(detail);
  }
  const data = await res.json();
  return {
    crossed: Array.isArray(data.crossed) ? data.crossed : [],
    dates: data.dates && typeof data.dates === "object" ? data.dates : {},
    updatedAt: data.updatedAt || 0,
  };
}

export async function saveState(crossed, dates) {
  const res = await fetch(`${BASE}/api/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crossed, dates }),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
    } catch {
      /* response wasn't JSON */
    }
    throw new Error(detail);
  }
  return res.json();
}
