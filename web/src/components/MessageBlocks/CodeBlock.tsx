import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import SyntaxHighlighter from "react-syntax-highlighter";

export default function CodeBlock({ inline, className, children, language }: any) {
  if (inline) return <code className={className}>{children}</code>;

  // get the language from className
  const lang = language || className?.match(/language-([\w-]+)/)?.[1] || "text";

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