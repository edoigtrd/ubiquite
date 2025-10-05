import { api } from "@/lib/api";
import { getCookie, setCookie } from "@/lib/utils";
import { getUserLocation } from "@/lib/gps";

type Context = {
  location: string;
  timezone: string;
  date: string;
  weekday: string;
  time: string;
};

const COOKIE_KEY = "context";
const COOKIE_TTL_MS = 60 * 60 * 1000;

function refreshDateTime(ctx: Context): Context {
  const now = new Date();
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: ctx.timezone || "UTC",
  });
  const timeFmt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: ctx.timezone || "UTC",
  });
  return {
    ...ctx,
    date: dateFmt.format(now),
    time: timeFmt.format(now),
  };
}

export async function fetchContext(lat: number, lon: number): Promise<Context> {
  const res = await api.get("/selfinfo", { params: { lat, lon } });
  return res.data as Context;
}

export async function getContext(): Promise<Context | null> {
  try {
    const raw = getCookie(COOKIE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as Context;
      const updated = refreshDateTime(cached);
      setCookie(COOKIE_KEY, JSON.stringify(updated), COOKIE_TTL_MS);
      return updated;
    }
    const { lat, lon } = await getUserLocation();
    const fetched = await fetchContext(lat, lon);
    const updated = refreshDateTime(fetched);
    setCookie(COOKIE_KEY, JSON.stringify(updated), COOKIE_TTL_MS);
    return updated;
  } catch {
    return null;
  }
}
