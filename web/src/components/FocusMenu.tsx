import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn, getCookie, setCookie } from "@/lib/utils";
import { api } from "@/lib/api"; // ou importe listFocuses() si tu préfères

type Focus = {
  id: string;
  name: string;
  icon: string;
  description?: string;
  cond?: string[];
};

export default function FocusMenu({
  className,
  onChange,
}: {
  className?: string;
  onChange?: (f: Focus | null) => void;
}) {
  const [items, setItems] = useState<Focus[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // derive selected
  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  // fetch + hydrate from cookie
  useEffect(() => {
    api.get("/focuses/list").then((res) => {
      const arr: Focus[] = res.data?.focuses ?? [];
      setItems(arr);
      const c = getCookie("focus");
      if (c && arr.some((i) => i.id === c)) {
        setSelectedId(c);
        onChange?.(arr.find((i) => i.id === c) || null);
      }
    });
  }, []);

  const select = (f: Focus | null) => {
    const id = f?.id ?? "none";
    setSelectedId(f ? f.id : null);
    setCookie("focus", id, 31536000);
    onChange?.(f);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "rounded-2xl border-white/15 bg-[#1b1d22] text-neutral-200 hover:bg-[#24262d] hover:text-neutral-200 gap-2 h-10 px-3",
            "data-[state=open]:bg-[#24262d]",
            className
          )}
        >
          {selected ? (
            <>
              <Icon icon={selected.icon} className="w-5 h-5 opacity-90" />
              <span className="text-sm">{selected.name}</span>
            </>
          ) : (
            <>
              <Icon icon="iconoir:target" className="w-5 h-5 opacity-90" />
              <span className="text-sm">Focus</span>
            </>
          )}
          <Icon icon="iconoir:nav-arrow-down" className="w-4 h-4 opacity-80" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-80 rounded-xl border border-white/10 bg-[#1b1d22] p-2 shadow-xl"
      >
        <DropdownMenuLabel className="text-neutral-300">Focus</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => select(null)}
          className="p-3 rounded-lg data-[highlighted]:bg-white/5 cursor-pointer"
        >
          <div className="flex gap-3 items-start">
            <Icon icon="iconoir:ban" className="w-5 h-5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-100">None</div>
              <div className="text-xs text-neutral-400">No specific focus.</div>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        {items.map((f) => (
          <DropdownMenuItem
            key={f.id}
            onClick={() => select(f)}
            className={cn(
              "p-3 rounded-lg data-[highlighted]:bg-white/5 cursor-pointer",
              selectedId === f.id && "bg-white/5"
            )}
          >
            <div className="flex gap-3 items-start">
              <Icon icon={f.icon} className="w-5 h-5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-100">{f.name}</div>
                {f.description ? (
                  <div className="text-xs text-neutral-400 whitespace-pre-line">
                    {f.description}
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500">No description.</div>
                )}
              </div>
              {selectedId === f.id && (
                <Icon icon="iconoir:check-circle" className="w-5 h-5 opacity-90" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
