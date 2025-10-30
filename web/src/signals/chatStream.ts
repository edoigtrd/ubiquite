import { signal } from "@preact/signals-react";

export const chatStream = signal<string[]>([]);
