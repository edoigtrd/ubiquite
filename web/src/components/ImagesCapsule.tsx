import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

type ImageItem = {
  type: "image";
  content: string;
  title: string;
  url?: string;
};

type ImagesCapsuleProps = {
  title?: string;
  items: ImageItem[] | ImageItem[][];
};

function ImageLoadingIndicator() {
  return (
    <motion.div
      className="flex-shrink-0 w-40 rounded-xl bg-neutral-900/80 border border-neutral-800/80 overflow-hidden"
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
    >
      <div className="h-28 w-full bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800" />
      <div className="px-3 py-2 space-y-1">
        <div className="h-3 w-28 rounded-full bg-neutral-800" />
        <div className="h-3 w-16 rounded-full bg-neutral-900" />
      </div>
    </motion.div>
  );
}

export default function ImagesCapsule({
  title = "Images",
  items
}: ImagesCapsuleProps) {
  const [open, setOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxSkeletons, setMaxSkeletons] = useState(4);

  // Flatten incoming array shape
  const flatItems: ImageItem[] = Array.isArray(items[0])
    ? (items[0] as ImageItem[]) ?? []
    : (items as ImageItem[]) ?? [];

  const CARD_WIDTH = 160;

  // Compute how many skeletons fit horizontally
  useEffect(() => {
    const compute = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const count = Math.max(1, Math.floor(width / CARD_WIDTH));
      setMaxSkeletons(count);
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  function navToSource(url: string) {
    window.open(url, "_blank", "noreferrer");
  }

  const isEmpty = flatItems.length === 0;

  return (
    <div className="flex-1 min-w-0">
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 shadow-md">
        {/* Header */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-[11px] text-neutral-200">
              {isEmpty ? "…" : flatItems.length}
            </div>
            <span className="text-sm font-medium text-neutral-100">
              {title}
            </span>
          </div>
          <span
            className={`text-xs transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        {/* Content */}
        {open && (
          <div className="px-3 pb-3">
            <div ref={containerRef} className="relative overflow-x-auto">
              <div className="flex items-stretch gap-3 py-1">
                {/* MODE IMAGES VIDES → PLACEHOLDERS */}
                {isEmpty &&
                  Array.from({ length: maxSkeletons }).map((_, i) => (
                    <ImageLoadingIndicator key={i} />
                  ))}

                {/* MODE IMAGES → NORMAL */}
                {!isEmpty &&
                  flatItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-40 rounded-xl bg-neutral-900/80 border border-neutral-800/80 overflow-hidden group"
                      onClick={() => item.url && navToSource(item.url)}
                    >
                      <div className="relative">
                        <img
                          src={item.content}
                          alt={item.title}
                          className="h-28 w-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
                        />
                      </div>
                      <div className="px-3 py-2 space-y-0.5">
                        <div className="h-9 text-[11px] leading-snug text-neutral-100 overflow-hidden text-ellipsis">
                          {item.title}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Fade shadow right */}
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-neutral-950 to-transparent" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
