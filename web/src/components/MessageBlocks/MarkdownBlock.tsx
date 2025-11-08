import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import CodeBlock from "@/components/MessageBlocks/CodeBlock";
import React from "react";

type Props = {
  source: string;
};

export default function MarkdownBlock({ source }: Props) { 
  return (
      <ReactMarkdown
      remarkPlugins={[
        remarkGfm,
        [remarkMath, { singleDollarTextMath: true }] // $...$ and $$...$$
      ]}
      rehypePlugins={[
        [rehypeKatex, { strict: false, throwOnError: false }] // tolerant
      ]}
      components={{
        h1: (p) => (
          <h1
            className="text-white text-xl font-semibold mb-2"
            {...p}
          />
        ),
        h2: (p) => (
          <h2
            className="text-white text-lg font-semibold mb-2"
            {...p}
          />
        ),
        p: (p) => {
  const hasBlockChild = React.Children.toArray(p.children).some(
    (child: any) =>
      typeof child === "object" &&
      ["ul", "ol", "pre", "code", "blockquote"].includes(child?.type)
  );

  return hasBlockChild ? (
    <p className="mb-2 leading-7" {...p} />
  ) : (
    <span className="leading-7" {...p} />
  );
},

        ul: (p) => <ul className="list-disc pl-6 mb-2" {...p} />,
        ol: (p) => <ol className="list-decimal pl-6 mb-2" {...p} />,
        code: (p: any) => {
          const language =
            p.className?.match(/language-([\w-]+)/)?.[1] ?? "";
          return (
            <CodeBlock
              className={p.className}
              inline={p.inline}
              language={language}
            >
              {p.children}
            </CodeBlock>
          );
        },
        a: (p) => (
          <a
            className="text-blue-400 underline hover:opacity-80"
            {...p}
          />
        ),
        blockquote: (p) => (
          <blockquote
            className="border-l-2 border-white/20 pl-3 italic mb-2"
            {...p}
          />
        ),
        hr: () => <hr className="my-4 border-white/10" />
      }}
    >
      {source}
    </ReactMarkdown>
  );
}