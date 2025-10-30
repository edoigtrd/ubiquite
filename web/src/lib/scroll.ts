// src/lib/scroll.ts
export function scrollToBottomInScrollArea(root?: HTMLElement | null, opts?: { smooth?: boolean }) {
  if (!root) return;
  // Radix places the real viewport in data-radix-scroll-area-viewport
  const viewport = root.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
  const el = viewport ?? root;

  const doScroll = () => {
    if (opts?.smooth) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollTop = el.scrollHeight; // instant
  };

  // double rAF -> wait for layout + paint after adding tokens
  requestAnimationFrame(() => requestAnimationFrame(doScroll));
}
