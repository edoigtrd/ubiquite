import { getContext } from "@/hooks/additional_context";

let cachedContext: any = null;

export async function initContext() {
  cachedContext = await getContext();
}

export function getContextSync() {
  return cachedContext;
}
