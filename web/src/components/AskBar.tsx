import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import ModelSelectionMenu, { type Mode } from "@/components/ModelSelectionMenu";
import { signal} from "@preact/signals-react";

export const querySignal = signal("");


export default function AskBar() {
  const [mode, setMode] = useState<Mode>("fast");
  const [query, setQuery] = useState("");

  function send() {
    const q = query.trim();
    if (q.length === 0) return;
    querySignal.value = q;
    setQuery("");
  }

  return (
    <div className="px-6 pb-6">
      <div className="border border-white/10 rounded-2xl bg-[#0f1014]">
        <div className="p-3 md:p-4 flex items-end gap-2">
          <ModelSelectionMenu
            value={mode}
            onChange={setMode}
            className="h-[52px]" // match l’input
          />
          <Input
            placeholder="Ask anything..."
            className="min-h-[52px] max-h-40 bg-[#1b1d22] border-white/10 text-neutral-200 flex-1 min-w-0"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") send(); }}
          />
          <Button className="h-[52px] px-4" onClick={send}>
            <Icon icon="iconoir:send" className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}