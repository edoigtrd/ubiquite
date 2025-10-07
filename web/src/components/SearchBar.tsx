import { Icon } from "@iconify/react";
import ModelSelectionMenu from "@/components/ModelSelectionMenu";
import { useEffect, useState } from "react";
import { submitQuery } from "@/signals/search";
import FocusMenu from "@/components/FocusMenu";


export default function SearchBar() {
  const [query, setQuery] = useState("");

  function send() {
    const q = query.trim();
    if (q.length === 0) return;
    setQuery("");

    const url = new URL(window.location.href);
    url.searchParams.set("q", q);
    window.history.replaceState({}, "", url.toString());
    submitQuery(q);
  }
  function sendEnter(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      send();
    }
  }

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#1b1d22] p-4 md:p-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-11 md:h-12 rounded-xl bg-[#23262d] px-4 flex items-center text-sm text-neutral-300/80">
          <input
            type="text"
            placeholder="Ask anything..."
            className="flex-1 h-11 md:h-12 rounded-xl bg-[#23262d] px-4 text-sm text-neutral-300/80 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={sendEnter}
          />
        </div>

        <button className="" onClick={send}>
          <Icon icon="iconoir:send" className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-5 text-xs text-neutral-300/70">
        <ModelSelectionMenu /> <FocusMenu />
      </div>
    </div>
  );
}
