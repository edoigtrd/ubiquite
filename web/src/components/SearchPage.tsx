import { motion } from "motion/react";
import WeatherWidget from "@/components/WeatherWidget";
import SearchBar from "@/components/SearchBar";
import RSSWidget from "@/components/RssWidget";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRssFeed } from "@/hooks/rss";

function Title() {
  return (
    <div className="text-center">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-3xl md:text-4xl font-semibold mb-8 md:mb-10 leading-snug"
      >
        <span
          className="inline-block pb-1
                     bg-gradient-to-r from-white via-gray-300 to-sky-400
                     bg-[length:200%_auto] bg-clip-text text-transparent
                     animate-gradient"
        >
          Research begins here.
        </span>
      </motion.h1>
    </div>
  );
}

export default function SearchPage() {

    const { getRssFeed } = useRssFeed();

    const [rssImage, setRssImage] = useState(null);
    const [rssTitle, setRssTitle] = useState(null);
    const [rssDescription, setRssDescription] = useState(null);
    const [rssUrl, setRssUrl] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getRssFeed();
      if (data && data.article) {
        setRssImage(data.article.image || "");
        setRssTitle(data.article.title || "No title");
        setRssDescription(data.article.description || "No description");
        setRssUrl(data.article.link || "");
      }
    };
    fetchData();
  }, [getRssFeed]);
  
  return (
    <div className="w-full max-w-5xl">
      <Title />
      <div className="mx-auto w-full max-w-3xl">
        <SearchBar />
      </div>

      <div
        className={cn(
          "mx-auto w-full max-w-3xl",
          "mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        )}
      >
        <WeatherWidget className="basis-[420px] grow min-h-[96px]" />
        <RSSWidget
          className="basis-[420px] grow min-h-[96px]"
          image={rssImage}
          title={rssTitle}
          description={rssDescription}
          url= {rssUrl}
        />
      </div>
    </div>
  );
}
