import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react";
import React, { useEffect as useffect } from "react";
import { getSources } from "@/hooks/getSources";

type Props = {
  messageUuid?: string | undefined | null;
};

type SourceElemProps = {
  title: string;
  description?: string | null;
  image?: string | null;
  key: string;
  url?: string | null;
};

function SourceElem({ title, description, image, url, key }: SourceElemProps) {
  return (
    <a
      key={key}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 items-start rounded-xl border border-white/10 bg-[#15171c] p-3 hover:bg-white/5 transition-colors duration-200 no-underline"
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="w-12 h-12 rounded-md object-cover flex-shrink-0"
        />
      )}
      <div className="flex flex-col overflow-hidden">
        <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
        {description ? (
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
            {description}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 truncate">{url}</p>
        )}
      </div>
    </a>
  );
}

export default function SourcesPanel({ messageUuid }: Props) {
  const [sources, setSources] = React.useState<any[]>([]);

  function reload() {
    if (!messageUuid) return;
    getSources(messageUuid).then((res) => {
      setSources(res.data.sources);
    });
    console.log(sources);
  }

  useffect(() => {
    reload();
  }, [messageUuid]);

  return (
    <Card className="bg-[#0f1014] border-white/10">
      <CardHeader>
        <CardTitle className="text-neutral-200 flex items-center gap-2">
          <Icon icon="iconoir:search" className="w-4 h-4" /> Sources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map((i) => (
            <SourceElem
              title={i.title}
              description={i.description}
              key={i.id}
              image={i.image}
              url={i.url}
            />
          ))}
        </div>
        <Separator className="my-4 bg-white/10" />
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="secondary"
            className="justify-start bg-white/5 hover:bg-white/10 text-white"
          >
            <Icon icon="iconoir:media-image" className="w-4 h-4 mr-2" /> Search
            images
          </Button>
          <Button
            variant="secondary"
            className="justify-start bg-white/5 hover:bg-white/10 text-white"
          >
            <Icon icon="iconoir:video-camera" className="w-4 h-4 mr-2" /> Search
            videos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
