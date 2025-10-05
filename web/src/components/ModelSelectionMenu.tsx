import { useState, useEffect } from "react"
import { Icon } from "@iconify/react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import {cn} from "@/lib/utils"
import { setCookie, getCookie } from "@/lib/utils"


export type Mode = "fast" | "balanced" | "smart"

const OPTIONS: { key: Mode; title: string; desc: string; icon: string; disabled?: boolean }[] = [
  { key: "fast",    title: "Speed",    desc: "Prioritize speed and get the quickest possible answer.", icon: "iconoir:flash" },
  { key: "balanced", title: "Balanced", desc: "Find the right balance between speed and accuracy.",      icon: "iconoir:shopping-code" },
  { key: "smart",  title: "Quality", desc: "Get the most thorough and accurate answer.",       icon: "iconoir:star-solid" },
]

export default function ModelSelectionMenu({
  value,
  onChange,
  className,
}: {
  value?: Mode
  onChange?: (m: Mode) => void
  className?: string
}) {
  const [mode, setMode] = useState<Mode>((value ?? "fast") as Mode)

  const select = (m: Mode) => {
    setMode(m)
    setCookie("mode", m, 31536000)
    onChange?.(m)
  }

  // read mode from cookie on first render
  useEffect(() => {
    if (!getCookie("mode")) {
      setCookie("mode", "fast", 31536000)
    }
    const cookieMode = getCookie("mode") as Mode | null
    if (cookieMode && ["fast", "balanced", "smart"].includes(cookieMode)) {
      setMode(cookieMode)
      onChange?.(cookieMode)
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "rounded-2xl border-white/15 bg-[#1b1d22] text-neutral-200 hover:bg-[#24262d] hover:text-neutral-200 gap-2 h-10 px-3",
            className
          )}
          
        >
          <Icon icon={mode === "fast" ? "iconoir:flash" : mode === "balanced" ? "iconoir:shopping-code" : "iconoir:star-solid"} className="w-5 h-5 opacity-90" />
          <span className="text-sm">{mode === "fast" ? "Speed" : mode === "balanced" ? "Balanced" : "Quality"}</span>
          <Icon icon="iconoir:nav-arrow-down" className="w-4 h-4 opacity-80" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-80 rounded-xl border border-white/10 bg-[#1b1d22] p-2 shadow-xl"
      >
        {OPTIONS.map(o => (
          <DropdownMenuItem
            key={o.key}
            disabled={o.disabled}
            onClick={() => !o.disabled && select(o.key)}
            className="p-3 rounded-lg data-[highlighted]:bg-white/5 data-[state=checked]:bg-white/5 focus:bg-white/5 cursor-pointer"
          >
            <div className="flex gap-3">
              <div className={`mt-0.5 ${o.disabled ? "opacity-50" : ""}`}>
                <Icon icon={o.icon} className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${o.disabled ? "text-neutral-400" : "text-neutral-100"}`}>
                  {o.title}
                </div>
                <div className="text-xs text-neutral-400">{o.desc}</div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
