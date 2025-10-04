import { useState, useEffect, use } from "react";
import { Icon } from "@iconify/react";
import SearchPage from "./components/SearchPage";
import SettingsPage from "./components/SettingsPage";
import ChatPage from "./components/ChatPage";
import { submittedQuery, clearQuery } from "./signals/search";
import LibraryPage from "./components/LibraryPage";
import DiscoverPage from "./components/DiscoverPage";


type Page = "search" | "settings" | "new_chat" | "chat" | "library" | "discover";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("search");
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Ubiquité";
  } , []);

  function changePage(page: Page, chatId?: string) {
    setActivePage(page);
    switch (page) {
      case "search":
        document.title = "Ubiquité - Search";
        window.history.pushState({}, "", "/");
        break;
      case "settings":
        document.title = "Ubiquité - Settings";
        window.history.pushState({}, "", "/settings");
        break;
      case "new_chat":
        document.title = "Ubiquité - New Chat";
        break;
      case "library":
        window.history.pushState({}, "", "/library");
        document.title = "Ubiquité - Library";
        break;
      case "discover":
        window.history.pushState({}, "", "/discover");
        document.title = "Ubiquité - Discover";
        break;
      case "chat":
        if (chatId) {
          document.title = `Ubiquité - Chat`;
        } else {
          document.title = "Ubiquité - Chat";
        }
        break;
      default:
        document.title = "Ubiquité";
        break;
    }
  }

  function signalHandler(q: string) {
    changePage("new_chat");
  }


  useEffect(() => {
    const url = new URL(window.location.href);

    // check query param ?q=
    const query = url.searchParams.get("q");
    if (query) {
      submittedQuery.value = query;
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url.toString());
      signalHandler(query);
    }

    // check /chat/<uuid>
    const pathChatId = url.pathname.split("/chat/")[1];
    if (pathChatId) {
      setChatId(pathChatId);
      changePage("chat");
    }

    // subscribe to submittedQuery
    const unsubscribe = submittedQuery.subscribe((q) => {
      if (q) signalHandler(q);
    });

    return () => unsubscribe();
  }, []);

    return (
    <div className="h-screen w-screen bg-[#0c0d10] text-neutral-200">
      {/* fixed sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-16 bg-[#121318] border-r border-white/10 flex flex-col items-center py-4">
        <div className="flex flex-col items-center space-y-5">
          <Icon icon="iconoir:sparks" className="w-7 h-7 text-neutral-400 hover:text-neutral-100 cursor-pointer" onClick={() => changePage("search")} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-5">
          <Icon icon="iconoir:book-stack" className="w-7 h-7 text-neutral-400 hover:text-neutral-100 cursor-pointer" onClick={() => changePage("library")} />
          <Icon icon="iconoir:globe" className="w-7 h-7 text-neutral-400 hover:text-neutral-100 cursor-pointer" onClick={() => changePage("discover")} />
        </div>

        <div className="mt-auto flex flex-col items-center">
          <Icon icon="iconoir:settings" className="w-7 h-7 text-neutral-400 hover:text-neutral-100 cursor-pointer" onClick={() => changePage("settings")} />
        </div>
      </aside>

      {/* main shifted to the right of the fixed sidebar */}
      <main className="ml-16 h-screen overflow-hidden flex">
        {activePage === "search" && (
          <div className="w-full h-full grid place-items-center p-6 overflow-auto">
            <div className="w-full max-w-5xl">
              <SearchPage />
            </div>
          </div>
        )}

        {activePage === "settings" && <div className="w-full h-full overflow-auto"><SettingsPage /></div>}
        {activePage === "new_chat" && <div className="w-full h-full overflow-auto"><ChatPage /></div>}
        {activePage === "chat" && chatId && <div className="w-full h-full overflow-auto"><ChatPage chatId={chatId} /></div>}
        {activePage === "library" && <div className="w-full h-full overflow-auto"><LibraryPage /></div>}
        {activePage === "discover" && <div className="w-full h-full overflow-auto"><DiscoverPage /></div>}
      </main>
    </div>
  );
}
