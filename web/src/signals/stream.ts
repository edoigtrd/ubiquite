import { signal } from "@preact/signals-react";
export const streamEvents = signal<string[]>([]);
export const streamEpoch = signal<number>(0);
