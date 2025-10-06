import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getChats } from "@/hooks/chat";
import ConversationElem from "./ConversationElem";
import { deleteChat } from "@/hooks/chat";


export default function LibraryPage() {
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await getChats();
        if (mounted) {
            // Sort by updated_at descending
      response.data?.conversations?.sort((a: any, b: any) => {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
          setConversations(response.data?.conversations ?? []);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#0c0d10] text-white flex flex-col min-h-0">
      {/* Header sticky (prend sa place, ne chevauche pas le contenu) */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2 justify-center sticky top-0 z-20 bg-[#0c0d10]/90 backdrop-blur">
        <Icon icon="iconoir:book-stack" className="w-6 h-6 opacity-80" />
        <motion.h1 initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-semibold">
          Ubiquité - Library
        </motion.h1>
      </div>

      {/* Content scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 p-6 pt-8 w-full max-w-3xl">
          {conversations.map((conv, index) => {
            const uuid = conv.uuid;
            return (
              <ConversationElem
                key={uuid ?? index}
                content={conv.title}
                uuid={uuid}
                onClick={() => (window.location.href = `/chat/${uuid}`)}
                onDelete={async () => {
                  if (uuid) {
                    await deleteChat(uuid);
                    setConversations((prev) => prev.filter((c) => c.uuid !== uuid));
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
