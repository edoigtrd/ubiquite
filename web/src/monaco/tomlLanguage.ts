import * as monaco from "monaco-editor";

export function registerToml(monacoNS = monaco) {
  monacoNS.languages.register({ id: "toml" });

  monacoNS.languages.setMonarchTokensProvider("toml", {
    tokenPostfix: ".toml",
    brackets: [],
    escapes: /\\(?:["\\bfnrt/]|u[0-9A-Fa-f]{4})/,
    tokenizer: {
      root: [
        [/^\s*#.*$/, "comment"],
        [/\s#.*$/, "comment"],

        // string triple quotes (multi-line)
        [/"""/, { token: "string.quote", next: "@tripleDoubleString" }],
        [/'''/, { token: "string.quote", next: "@tripleSingleString" }],

        // normal strings
        [/".*?"/, "string"],
        [/'[^'\n]*'/, "string"],

        [/\b(true|false)\b/, "keyword"],
        [
          /\b\d{4}-\d{2}-\d{2}(?:[Tt ][\d:\.]+(?:Z|[+\-]\d{2}:\d{2})?)?\b/,
          "number"
        ],
        [
          /\b[+\-]?(\d+(_\d+)*)(\.\d+(_\d+)*)?([eE][+\-]?\d+(_\d+)*)?\b/,
          "number"
        ],

        [/[[\]]/, "delimiter.square"],
        [/=|,/, "delimiter"],
        [/^[ \t]*\[[^\]]+\]/, "type"],
        [/^[ \t]*\[\[[^\]]+\]\]/, "type"],
        [/^[ \t]*[A-Za-z0-9_\-]+(?=\s*=)/, "key"]
      ],

      // state for """
      tripleDoubleString: [
        [/"""/, { token: "string.quote", next: "@pop" }],
        [/./, "string"]
      ],

      // state for '''
      tripleSingleString: [
        [/'''/, { token: "string.quote", next: "@pop" }],
        [/./, "string"]
      ]
    }
  });

  monacoNS.languages.setLanguageConfiguration("toml", {
    comments: { lineComment: "#" },
    brackets: [["[", "]"]],
    autoClosingPairs: [
      { open: "[", close: "]" },
      { open: '"', close: '"' }
    ]
  });
}
