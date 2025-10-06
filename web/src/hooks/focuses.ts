import { api } from "@/lib/api";

let focusCache: any[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 1000 * 60 * 5;

export async function listFocuses() {
  const now = Date.now();

  if (focusCache && cacheTimestamp && now - cacheTimestamp < CACHE_TTL) {
    return Promise.resolve({ data: focusCache });
  }

  const res = await api.get("/focuses/list");
  focusCache = res.data;
  cacheTimestamp = now;

  return res;
}
