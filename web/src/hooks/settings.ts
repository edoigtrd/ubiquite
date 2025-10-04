import {api} from "@/lib/api"

export function getSettings() {
    return api.get("/settings/get");
}

export function saveSettings(settings: string) {
    return api.post("/settings/set", { settings });
}