import {api} from "@/lib/api"


export function getMeteo(lat: number, lon: number) {
    return api.get("/meteo", { params: { lat, lon } });
}