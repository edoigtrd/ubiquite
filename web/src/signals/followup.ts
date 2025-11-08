import { signal } from "@preact/signals-react";

export type FollowupPayload = { parent: string; content: string };

export const followup = signal<FollowupPayload | null>(null);

export function submitFollowup(p: FollowupPayload) {
  followup.value = p;
}

export function clearFollowup() {
  followup.value = null;
}