import { Icon } from "@iconify/react";
import ThinkingCapsule from "@/components/ThinkingCapsule";

import Map from "@/components/Map";
import MarkdownBlock from "@/components/MessageBlocks/MarkdownBlock";
import FollowupBlock from "@/components/MessageBlocks/FollowupBlock";
import ImagesCapsule from "./ImagesCapsule";
import React from "react";

import { getMessageImages } from "@/hooks/images";

type Attachment = {
  type: "map" | "image";
  content: string; // JSON stringified map data
};

type Props = {
  role: "human" | "ai";
  content: string;
  uuid?: string;
  thinking?: string | undefined | null;
  isThinking?: boolean | undefined | null;
  attachments?: Attachment[];
};

// Convert \(...\) -> $...$ and \[...\] -> $$...$$
// Also handles double-escaped backslashes \\( \\[
// Do not touch code blocks delimited by ``` ```
function normalizeMathDelimiters(md: string): string {
  // 1) split by code blocks so we DO NOT transform what's inside ``` code fences
  const parts = md.split(/(```[\s\S]*?```)/g);

  const mathify = (s: string) => {
    // minimally unescape double backslashes for math delimiters
    s = s.replace(/\\\\\[/g, "\\[").replace(/\\\\\]/g, "\\]");
    s = s.replace(/\\\\\(/g, "\\(").replace(/\\\\\)/g, "\\)");

    // display math: \[ ... \]  ->  $$ ... $$
    s = s.replace(/\\\[(.*?)\\\]/gs, "\n$$$1$$\n");

    // inline math: \( ... \)   ->  $ ... $
    s = s.replace(/\\\((.*?)\\\)/gs, "$$$1$");

    return s;
  };

  return parts
    .map((chunk, i) => {
      // odd parts = code blocks (leave them be)
      if (i % 2 === 1) return chunk;
      return mathify(chunk);
    })
    .join("");
}

interface Block {
  type: "text" | "REL";
  text: string;
  action?: string;
}

const parseRELBlocks = (input: string): Block[] => {
  const regex = /<REL\s+action="([^"]+)">(.*?)<\/REL>/gms;
  const blocks: Block[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    const [fullMatch, action, content] = match;
    const start = match.index;

    if (start > lastIndex) {
      blocks.push({
        type: "text",
        text: input.slice(lastIndex, start)
      });
    }

    blocks.push({
      type: "REL",
      text: content.trim(),
      action: action.trim()
    });

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < input.length) {
    blocks.push({
      type: "text",
      text: input.slice(lastIndex)
    });
  }

  return blocks;
};

export default function ChatMessage({
  role,
  content,
  uuid,
  thinking,
  isThinking,
  attachments
}: Props) {
  const isUser = role === "human";

  const initialAttachments = Array.isArray(attachments) ? attachments : [];

  const [attachmentsState, setAttachmentsState] =
    React.useState(initialAttachments);
  const [forceImageAttachmentsDisplay, setForceImageAttachmentsDisplay] =
    React.useState(false);

  React.useEffect(() => {
    if (Array.isArray(attachments)) {
      setAttachmentsState(attachments);
    }
  }, [attachments]);

  const imageAttachments = attachmentsState.filter(
    (att) => att.type === "image"
  );

  const source = normalizeMathDelimiters(content);

  function setImageAttachments(rawData: any) {
    // rawData = réponse de /images/get
    // ex: { images_results: [ { title, img, url, source, ... }, ... ] }

    const imagesArray = Array.isArray(rawData?.images_results)
      ? rawData.images_results
      : Array.isArray(rawData)
      ? rawData
      : [];

    const formattedImages = imagesArray.map((img: any) => ({
      type: "image",
      content: img.img || img.url || "",
      title: img.title || "",
      url: img.url || "",
      source: img.source || ""
    }));

    setAttachmentsState((prev) => [
      ...prev,
      {
        type: "image",
        content: formattedImages // ← array d’images
      }
    ]);
  }

  async function loadImages() {
    setForceImageAttachmentsDisplay(true);

    if (imageAttachments.length === 0 && uuid) {
      try {
        const data = await getMessageImages(uuid);
        setImageAttachments(data);
      } catch (error) {
        console.error("Error loading images for message", error);
      }
    }
  }

  return (
    <div className="w-full" key={uuid}>
      <div
        className={[
          "w-full rounded-2xl p-4 border",
          isUser
            ? "bg-[#1b1d22] border-white/10"
            : "bg-[#121318] border-white/10",
          "text-neutral-300"
        ].join(" ")}
      >
        <div className="flex items-center mb-2">
          <Icon
            icon={
              isUser ? "iconoir:user" : "fluent-emoji-high-contrast:peacock"
            }
            className="w-6 h-6 mb-2"
          />
          <div className="flex-1 flex justify-end items-center">
            {
              (!isUser && imageAttachments.length === 0 && !forceImageAttachmentsDisplay) && (
              <Icon
                icon="iconoir:media-image"
                className="w-6 h-6 ml-2 mb-2 text-neutral-400 hover:text-neutral-100 cursor-pointer"
                onClick={loadImages}
              />)
            }

          </div>
        </div>
        {(forceImageAttachmentsDisplay ||
          !!attachments?.some((att: any) => att.type === "image")) && (
          <ImagesCapsule
            items={imageAttachments.map((att: any) => att.content) as any[]}
          />
        )}

        {thinking && (
          <ThinkingCapsule content={thinking} isThinking={isThinking} />
        )}

        {attachments?.map((att, index) => {
          if (att.type === "map") {
            return (
              <Map
                data={att.content}
                key={index}
                className="w-full h-[420px] my-4 rounded-lg rounded-xl border border-white/10 overflow-hidden bg-[#0b0d12]"
              />
            );
          }
        })}

        {parseRELBlocks(source).map((block, index) => {
          if (block.type === "text") {
            return <MarkdownBlock key={index} source={block.text} />;
          } else if (block.type === "REL") {
            return (
              <FollowupBlock
                key={index}
                action={block.action!}
                text={block.text}
                parent={uuid}
              />
            );
          }
        })}
      </div>
    </div>
  );
}
