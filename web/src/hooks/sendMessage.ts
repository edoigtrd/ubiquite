import { chatStream } from "@/signals/chatStream";
import {getContextSync} from "@/lib/contextstore";
import { getCookie } from "@/lib/utils";

export async function sendMessage(parent_uuid: string | null, content: string, mode = "speed") {
  chatStream.value = [];

  const params = new URLSearchParams();
  if (parent_uuid) params.set("parent", parent_uuid);
  params.set("preset", mode);
  params.set("q", content);

  const focus = getCookie("focus");
  if (focus && focus !== "none") { 
    params.set("focus", focus);
  }

  const ctx = JSON.stringify(getContextSync());
  params.set("additional_context", ctx || "");

  const url = `/api/chat?${params.toString()}`;
  const res = await fetch(url);
  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.trim().length) chatStream.value = [...chatStream.value, line];
    }
  }
}
