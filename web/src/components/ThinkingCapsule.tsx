import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

type Props = {
  content: string;
  isThinking?: boolean | undefined | null;
  className?: string;
};

function Dots() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((v) => (v + 1) % 4), 400);
    return () => clearInterval(id);
  }, []);
  return <span>{["", ".", "..", "..."][n]}</span>;
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export default function ThinkingCapsule({ content, isThinking = false, className = "" }: Props) {
  const [open, setOpen] = useState(false);

  const label = useMemo(
    () =>
      isThinking ? (
        <span className="font-medium">Thinking done</span>
      ) : (
        <span className="font-medium">
          Thinking <Dots />
        </span>
      ),
    [isThinking]
  );

  return (
    <motion.div
      onClick={() => setOpen((v) => !v)}
      role="button"
      aria-expanded={open}
      className={[
        "group relative w-full cursor-pointer select-none",
        "rounded-2xl border border-white/10 bg-zinc-900/70",
        "text-zinc-100 shadow-lg backdrop-blur",
        "transition-colors hover:border-white/20",
        className
      ].join(" ")}
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800">
          {isThinking ? (
            <Icon icon="iconoir:check-circle" className="h-5 w-5 text-emerald-400" />
          ) : (
            <Spinner />
          )}
        </div>

        <div className="flex-1">
          <div className="text-sm leading-none">{label}</div>
          <div className="mt-1 text-xs text-zinc-400">Click to {open ? "collapse" : "expand"}</div>
        </div>

        <Icon
          icon={open ? "iconoir:nav-arrow-up" : "iconoir:nav-arrow-down"}
          className="h-5 w-5 text-zinc-400 transition-transform group-hover:text-zinc-200"
        />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="rounded-xl bg-zinc-950/60 px-3 py-3 text-[12px] leading-5 text-zinc-400">
                {content}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
                <Icon icon="iconoir:info-empty" className="h-4 w-4" />
                <span>Tap again to close</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
