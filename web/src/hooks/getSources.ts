import {api} from "@/lib/api"

export function getSources( message_uuid: string | null | undefined) {
    return api.get(`/sources/get?uuid=${message_uuid}`);
}