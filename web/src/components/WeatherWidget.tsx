import { useEffect, useState } from "react";
import { getMeteo } from "../hooks/meteo";
import { getUserLocation } from "../lib/gps";

type WeatherData = {
  city: string;
  local_time: string; // ISO, idéalement avec offset
  condition: string;
  wind_kmh: number;
  humidity_pct: number;
  icon_url_hint?: string;
  temp_c?: number;
};

function useRealtimeFrom(iso?: string) {
  const [now, setNow] = useState<Date>(() => (iso ? new Date(iso) : new Date()));
  useEffect(() => {
    setNow(iso ? new Date(iso) : new Date());
  }, [iso]);
  useEffect(() => {
    const id = setInterval(() => {
      setNow(prev => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Always call hooks here, not inside JSX
  const now = useRealtimeFrom(data?.local_time);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { lat, lon } = await getUserLocation();
        const res = await getMeteo(lat, lon);
        const payload: WeatherData = res?.data?.data ?? res?.data ?? res;
        if (mounted) setData(payload);
      } catch (e: any) {
        if (mounted) setErr(e?.message ?? "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="w-[380px] max-w-full p-[1px] rounded-2xl bg-gradient-to-br from-white/15 to-white/0">
        <div className="rounded-2xl border border-white/10 bg-[#16181d] p-4 animate-pulse h-[96px]" />
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="w-[380px] max-w-full p-[1px] rounded-2xl bg-gradient-to-br from-rose-300/20 to-rose-300/0">
        <div className="rounded-2xl border border-white/10 bg-[#16181d] p-4 text-rose-200 text-sm">
          Error: {err ?? "Unknown error"}
        </div>
      </div>
    );
  }

  const temp = typeof data.temp_c === "number" ? `${data.temp_c.toFixed(1)}°C` : "—";
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="w-[380px] max-w-full p-[1px] rounded-2xl bg-gradient-to-br from-white/15 to-white/0">
      <div className="rounded-2xl border border-white/10 bg-[#16181d] p-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-16 h-16 rounded-xl bg-[#20242b] shadow-inner flex items-center justify-center overflow-hidden">
            {data.icon_url_hint ? (
              <img src={data.icon_url_hint} alt={data.condition} className="w-12 h-12" />
            ) : (
              <div className="text-xs text-neutral-400">—</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-neutral-100 font-semibold truncate">{data.city}</div>
                <div className="text-[11px] text-neutral-400 italic">{data.condition}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-neutral-300/80">
                  <span className="align-middle">Wind</span>{" "}
                  <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px]">
                    {data.wind_kmh.toFixed(1)} km/h
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-end justify-between">
              <div className="text-[28px] leading-none font-bold text-neutral-100">{temp}</div>
              <div className="text-right space-y-0.5">
                <div className="text-[11px] text-neutral-300/80">
                  Humidity{" "}
                  <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px]">
                    {data.humidity_pct}%
                  </span>
                </div>
                <div className="text-[11px] text-neutral-300/70">{timeStr}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
