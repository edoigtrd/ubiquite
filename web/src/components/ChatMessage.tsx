// components/ChatMessage.tsx
// React import not required with new JSX transform
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Icon } from "@iconify/react";
import ThinkingCapsule from "@/components/ThinkingCapsule";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import SyntaxHighlighter from "react-syntax-highlighter";
import Map from "@/components/Map";



type Attachment = {
  type: "map";
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

// Convert \(...\) -> $...$ et \[...\] -> $$...$$
// Gère aussi les backslashes double-échappés \\( \\[
// Ne touche pas aux blocs de code ``` ```
function normalizeMathDelimiters(md: string): string {
  // 1) découper par blocs de code pour ne PAS transformer ce qui est entre ```
  const parts = md.split(/(```[\s\S]*?```)/g);

  const mathify = (s: string) => {
    // unescape minimal des doubles backslashes pour les délimiteurs math
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
      // morceaux impairs = blocs de code (laisser tel quel)
      if (i % 2 === 1) return chunk;
      return mathify(chunk);
    })
    .join("");
}

function CodeBlock({ inline, className, children, language }: any) {
  if (inline) return <code className={className}>{children}</code>;

  // récupère le langage du className (language-js, language-python, etc.)
  const lang =
    language || className?.match(/language-([\w-]+)/)?.[1] || "text";

  const code = String(children).replace(/\n$/, "");

  return (
    <SyntaxHighlighter
      language={lang}
      style={atomOneDark}
      showLineNumbers={false}
      wrapLongLines
      PreTag="div"
    >
      {code}
    </SyntaxHighlighter>
  );
}

export default function ChatMessage({ role, content, uuid , thinking, isThinking, attachments }: Props) {
  const isUser = role === "human";

  // Pré-normaliser les délimiteurs math avant ReactMarkdown
  const source = normalizeMathDelimiters(content);

  return (
    <div className="w-full" key={uuid}>
      <div
        className={[
          "w-full rounded-2xl p-4 border",
          isUser ? "bg-[#1b1d22] border-white/10" : "bg-[#121318] border-white/10",
          "text-neutral-300",
        ].join(" ")}
      >
        <div className="flex items-center mb-2">
          <Icon
            icon={isUser ? "iconoir:user" : "fluent-emoji-high-contrast:peacock"}
            className="w-6 h-6 mb-2"
          />
        </div>
        {thinking && <ThinkingCapsule content={thinking} isThinking={isThinking} />}

        {
          attachments?.map((att, index) => {
            if (att.type === "map") {
              return (
                <Map data={att.content} key={index}
                  className="w-full h-[420px]"
                />
              );
            }
          }
        )
        }


        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            [remarkMath, { singleDollarTextMath: true }], // $...$ et $$...$$
          ]}
          rehypePlugins={[
            [rehypeKatex, { strict: false, throwOnError: false }], // tolérant
          ]}
          components={{
            h1: (p) => <h1 className="text-white text-xl font-semibold mb-2" {...p} />,
            h2: (p) => <h2 className="text-white text-lg font-semibold mb-2" {...p} />,
            p: (p) => <p className="mb-2 leading-7" {...p} />,
            ul: (p) => <ul className="list-disc pl-6 mb-2" {...p} />,
            ol: (p) => <ol className="list-decimal pl-6 mb-2" {...p} />,
          code: (p: any) => {
            const language = p.className?.match(/language-([\w-]+)/)?.[1] ?? "";
            return (
              <CodeBlock className={p.className} inline={p.inline} language={language}>
                {p.children}
              </CodeBlock>
            );
            },
            a: (p) => <a className="text-blue-400 underline hover:opacity-80" {...p} />,
            blockquote: (p) => (
              <blockquote className="border-l-2 border-white/20 pl-3 italic mb-2" {...p} />
            ),
            hr: () => <hr className="my-4 border-white/10" />,
          }}
        >
          {source}
        </ReactMarkdown>
      </div>
    </div>
  );
}
