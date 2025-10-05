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

export function setCookie(name: string, value: string, duration: number) {
  // duration in milliseconds
  const expires = new Date();
  expires.setTime(expires.getTime() + duration);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
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

export function countPrintableChars(str: string): number {
  const printable = str.replace(/[^\x21-\x7E]/g, "");
  return printable.length;
}
