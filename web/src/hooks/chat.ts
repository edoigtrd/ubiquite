import {api} from "@/lib/api"


export function getChat(uuid: string) {
    return api.get(`/conversation/read?uuid=${uuid}`);
}

export function getChats() {
    return api.get(`/conversation/list`);
}

