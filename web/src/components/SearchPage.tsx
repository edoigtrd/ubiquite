import { motion } from "motion/react";
import WeatherWidget from "./WeatherWidget";
import SearchBar from "./SearchBar";

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
  return (
    <div className="w-full max-w-5xl">
      <Title />

      <div className="flex justify-center">
        <SearchBar />
      </div>
      <div className="mt-6 md:mt-8 flex flex-wrap gap-4 justify-center">
        <WeatherWidget />
        <WeatherWidget />
      </div>
    </div>
  );
}
