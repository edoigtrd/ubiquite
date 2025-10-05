import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCookie(name: string): string | null {
  const cookies = document.cookie.split("; ").map(c => c.split("="));
  const found = cookies.find(([key]) => key === name);
  return found ? decodeURIComponent(found[1]) : null;
}

export function scrollToBottom(container?: HTMLElement | null) {
  if (!container) return;
  container.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth",
  });
}

export function scrollToBottomInstant(container?: HTMLElement | null) {
  if (!container) return;
  container.scrollTop = container.scrollHeight;
}

