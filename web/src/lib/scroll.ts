// src/lib/scroll.ts
export function scrollToBottomInScrollArea(root?: HTMLElement | null, opts?: { smooth?: boolean }) {
  if (!root) return;
  // Radix met le vrai viewport dans data-radix-scroll-area-viewport
  const viewport = root.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
  const el = viewport ?? root;

  const doScroll = () => {
    if (opts?.smooth) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollTop = el.scrollHeight; // instant et fiable
  };

  // double rAF → on attend le layout + paint après ajout de tokens
  requestAnimationFrame(() => requestAnimationFrame(doScroll));
}
