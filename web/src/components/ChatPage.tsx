import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react";
import ChatMessage from "@/components/ChatMessage";
import { getChat } from "@/hooks/chat";
import AskBar, { querySignal } from "@/components/AskBar";
import { sendMessage } from "@/hooks/sendMessage";
import { useSignalEffect } from "@preact/signals-react";
import { getCookie, countPrintableChars } from "@/lib/utils";
import { chatStream } from "@/signals/chatStream";


import { submittedQuery, clearQuery } from "@/signals/search";
import ThinkingCapsule from "./ThinkingCapsule";

type Msg = { uuid: string; role: "human" | "ai"; content: string; thinking: string | null | undefined , thoughts?: string | null | undefined};
type Props = { chatId?: string };

function SourcesPanelPlaceholder() {
  return (
    <Card className="bg-[#0f1014] border-white/10">
      <CardHeader>
        <CardTitle className="text-neutral-200 flex items-center gap-2">
          <Icon icon="iconoir:search" className="w-4 h-4" /> Sources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-[#15171c] p-3 animate-pulse"
            >
              <div className="h-4 w-56 bg-white/10 rounded" />
              <div className="mt-2 h-3 w-28 bg-white/10 rounded" />
            </div>
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

export default function ChatPage({ chatId }: Props) {
  const [chatTitle, setChatTitle] = useState("Chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [userInput, setUserInput] = useState<string | null>(null);
  const [thinking, setThinking] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [aiWriting, setAiWriting] = useState("");

  const lastUuidRef = useRef<string | null>(null);
  const currentQueryRef = useRef<string | null>(null);
  const currentResponseRef = useRef<string | null>(null);
  const conversationUuidRef = useRef<string | null>(null);

  const newConvModeRef = useRef<boolean>(false);
  const urlNormalizedRef = useRef<boolean>(false);
  const hasHydratedOnceRef = useRef<boolean>(false);
  const inFlightRef = useRef<boolean>(false);
  const bootOnceRef = useRef<boolean>(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  function scrollToBottom(target?: HTMLElement | null, smooth = true) {
    if (!target) return;
    const behavior = smooth ? "smooth" : "auto";
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        target.scrollTo({ top: target.scrollHeight, behavior });
      })
    );
  }

  function sendMessageWrapper(parent: string | null, content: string, mode?: string) {
    setThinking(null);
    setIsThinking(false);
    setAiWriting("");
    sendMessage(parent, content, mode);
  }

  async function loadConversationAndMessages(convUuid: string) {
    const data = await getChat(convUuid);
    const title = data?.data?.conversation?.title || "Untitled";
    document.title = `Chat - ${title}`;
    setChatTitle(title);

    const fetched: Msg[] = (data?.data?.messages || []).map(
      (m: any, i: number) => ({
        uuid: m.uuid || `msg-${i}`,
        role: m.role === "ai" ? "ai" : "human",
        content: m.content ?? "",
        thinking: m.thoughts ?? null,
      })
    );
    setMessages(fetched);
    lastUuidRef.current = fetched.at(-1)?.uuid ?? null;
    scrollToBottom(listRef.current, false);
  }

  async function refreshTitleWithRetry(convUuid: string, tries = 5, delayMs = 600) {
    for (let i = 0; i < tries; i++) {
      try {
        const data = await getChat(convUuid);
        const maybe = data?.data?.conversation?.title;
        if (maybe && maybe !== "Untitled") {
          document.title = `Chat - ${maybe}`;
          setChatTitle(maybe);
          return;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  useEffect(() => {
    if (bootOnceRef.current) return;
    bootOnceRef.current = true;

    (async () => {
      if (chatId) {
        conversationUuidRef.current = chatId;
        urlNormalizedRef.current = true;
        newConvModeRef.current = false;
        hasHydratedOnceRef.current = false;
        try { await loadConversationAndMessages(chatId); } catch { window.location.href = "/"; }
      }
    })();
  }, [chatId]);

  useEffect(() => {
    if (chatId) return;
    const q = submittedQuery.value;
    if (!q) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    newConvModeRef.current = true;
    hasHydratedOnceRef.current = false;

    setUserInput(q);
    setAiWriting("");
    currentQueryRef.current = null;
    currentResponseRef.current = null;

  sendMessageWrapper(null, q, (getCookie("mode") as string) ?? undefined);
    scrollToBottom(listRef.current, false);

    clearQuery?.();
  }, [chatId]);

  useEffect(() => {
  const unsub = querySignal.subscribe((q: string) => {
      if (!q) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      const parent = lastUuidRef.current;
      if (parent) {
        newConvModeRef.current = false;
        setUserInput(q);
        setAiWriting("");
        currentQueryRef.current = null;
        currentResponseRef.current = null;
  sendMessageWrapper(parent, q, (getCookie("mode") as string) ?? undefined);
        querySignal.value = "";
        scrollToBottom(listRef.current, false);
        return;
      }

      newConvModeRef.current = true;
      setUserInput(q);
      setAiWriting("");
      currentQueryRef.current = null;
      currentResponseRef.current = null;
  sendMessageWrapper(null, q, (getCookie("mode") as string) ?? undefined);
      querySignal.value = "";
      scrollToBottom(listRef.current, false);
    });
    return () => unsub();
  }, []);

  // === Stream handler ===
  useSignalEffect(() => {
    const items = chatStream.value;
    if (!items.length) return;

    const last = items[items.length - 1];
    let evt: any;
    try { evt = JSON.parse(last); } catch { return; }

    switch (evt.event) {
      case "ok":
      case "start":
        setAiWriting(" ");
        break;
      case "heartbeat":
      case "llm_end":
        break;
      case 'new_thinking_token':
        setIsThinking(false);
        setThinking((prev => (prev ?? "") + (evt.data || "")));
        break;
      case "prelude": {
        const { query_uuid, response_uuid, conversation_uuid } = evt.data || {};

        if (conversation_uuid) {
          conversationUuidRef.current = conversation_uuid;
          if (!urlNormalizedRef.current) {
            const newUrl = `/chat/${conversation_uuid}`;
            window.history.replaceState({}, "", newUrl);
            urlNormalizedRef.current = true;
          }
        }

        if (query_uuid && !currentQueryRef.current) {
          currentQueryRef.current = query_uuid;
          currentResponseRef.current = response_uuid ?? null;

          if (userInput) {
            setMessages((prev) => [
              ...prev,
              { uuid: query_uuid, role: "human", content: userInput, thinking: null }
            ]);
            setUserInput(null);
            lastUuidRef.current = query_uuid;
            scrollToBottom(listRef.current, false);
          }
        }
        break;
      }

      case "new_token": {
        if (!evt.data) break;
        if (typeof evt.data !== "string" && typeof evt.data !== "number") break;
        const token = typeof evt.data === "string" ? evt.data : "";
        if (token.length > 0) {
          setAiWriting((prev) => prev + token);
          scrollToBottom(listRef.current, false);
        }
        if (countPrintableChars(aiWriting) > 1 && evt.data.trim().length > 0) {
          setIsThinking(true);
        }
        break;
      }

      case "done": {
        const convUuid = conversationUuidRef.current;
        const text = aiWriting;
        const respUuid = currentResponseRef.current ?? crypto.randomUUID();

        if (newConvModeRef.current) {
          setAiWriting("");
          setUserInput(null);

          if (convUuid && !hasHydratedOnceRef.current) {
            hasHydratedOnceRef.current = true;
            loadConversationAndMessages(convUuid).catch(() => {});
            refreshTitleWithRetry(convUuid, 6, 700).catch(() => {});
          }
        } else {
          if (text.length > 0) {
            setMessages((prev) => [
              ...prev,
              { uuid: respUuid, role: "ai", content: text, thinking: thinking }
            ]);
            lastUuidRef.current = respUuid;
          }
          setAiWriting("");
          setUserInput(null);
        }
        inFlightRef.current = false;

        scrollToBottom(listRef.current, false);
        break;
      }
    }
  });

  useEffect(() => {
    scrollToBottom(listRef.current, false);
  }, [messages.length]);

  return (
    <div className="h-full w-full bg-[#0c0d10] text-white">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 h-full min-h-0">
        {/* Chat */}
        <div className="flex flex-col border-r border-white/10 min-h-0">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2 sticky top-0 bg-[#0c0d10]/80 backdrop-blur z-10">
            <Icon icon="iconoir:chat-bubble" className="w-5 h-5 opacity-80" />
            <motion.h1
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-semibold"
            >
              {chatTitle}
            </motion.h1>
          </div>

          <div className="flex-1 px-6 py-4 min-h-0">
            <div ref={listRef} className="space-y-4 h-full overflow-y-auto scroll-hide">
              {messages.map((m, i) => {
                const isLastAi =
                  m.role === "ai" &&
                  messages.slice(i + 1).every(next => next.role !== "ai");

                const currentThinking = m.thinking

                return (
                  <ChatMessage
                    key={m.uuid}
                    role={m.role}
                    uuid={m.uuid}
                    thinking={currentThinking}
                    isThinking={true}
                    content={m.content}
                  />
                );
              })}
              {userInput && <ChatMessage role="human" content={userInput}  />}
              {aiWriting && <ChatMessage role="ai" content={aiWriting} thinking={thinking} isThinking={isThinking} />}
            </div>
          </div>

          <div className="sticky bottom-0 bg-[#0c0d10]/80 backdrop-blur border-t border-white/10 px-4 md:px-6">
            <AskBar />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:flex flex-col h-full sticky top-0 right-0">
          <div className="p-4 pt-6 h-full overflow-y-auto space-y-4">
            <SourcesPanelPlaceholder />
            <Card className="bg-[#0f1014] border-white/10">
              <CardHeader>
                <CardTitle className="text-neutral-200 flex items-center gap-2">
                  <Icon icon="iconoir:copy" className="w-4 h-4" /> Quick actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Button
                    key={i}
                    variant="secondary"
                    className="bg-white/5 hover:bg-white/10 text-white animate-pulse"
                  >
                    Placeholder
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
