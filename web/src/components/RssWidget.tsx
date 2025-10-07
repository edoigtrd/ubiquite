import { cn } from "@/lib/utils";
import { submitQuery } from "@/signals/search";

type Props = {
  className?: string;
  image?: string;
  title?: string;
  description?: string;
  url?: string;
};

export default function RSSWidget({
  className,
  image,
  title,
  description,
  url
}: {
  className?: string;
  image: string;
  title: string;
  description: string;
  url: string;
}) {
  function send(query: string) {
    const q = query.trim();
    if (q.length === 0) return;

    const url = new URL(window.location.href);
    url.searchParams.set("q", q);
    window.history.replaceState({}, "", url.toString());
    submitQuery(q);
  }

  function openLink(e: React.MouseEvent) {
    e.preventDefault();
    if (url) {
      send(`Tell me about this: ${url}`);
    }
  }

  return (
    <a
      onClick={openLink}
      target="_blank"
      rel="noreferrer"
      className={cn("p-[1px] rounded-2xl bg-[#0000]", className)}
    >
      <div className="h-full rounded-2xl border border-white/10 bg-[#16181d] p-3 flex items-center gap-3">
        <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[#20242b]">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-neutral-100 font-semibold truncate">{title}</div>
          <p className="text-sm text-neutral-300/90 leading-snug line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </a>
  );
}
