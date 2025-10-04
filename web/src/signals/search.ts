import { signal } from "@preact/signals-react";

export const inputValue = signal("");                  // live typing
export const submittedQuery = signal<string | null>(null); // last submitted

export function submitQuery(q?: string) {
  const v = (q ?? inputValue.value).trim();
  submittedQuery.value = v || null;
}

export function clearQuery() {
  submittedQuery.value = null;
  inputValue.value = "";
}
