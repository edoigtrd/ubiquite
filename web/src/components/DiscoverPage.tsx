import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export default function DiscoverPage() {
  return (
    <div className="h-full w-full bg-[#0c0d10] text-white overflow-hidden">
      <div className="h-full">
        <div className="flex flex-col border-r border-white/10">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <Icon icon="iconoir:globe" className="w-15 h-15 opacity-80" />
            <motion.h1
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-semibold"
            >
              Ubiquité - Discover
            </motion.h1>
          </div>
        </div>
      <img src="https://media1.tenor.com/m/ZPgI5dVr6-kAAAAC/chillin-chilling.gif" className="mx-auto mt-20 rounded-lg" /> 
      <p className="text-center mt-4">Not implemented yet</p>
      </div>
    </div>
  );
}
