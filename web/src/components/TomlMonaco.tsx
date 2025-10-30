import { useCallback, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { registerToml } from "@/monaco/tomlLanguage";
import { parse as parseToml } from "toml";

type Props = {
  initialValue: string;
  onSave: (content: string) => Promise<void>;
};

export default function TomlMonaco({ initialValue, onSave }: Props) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const autosaveTimer = useRef<number | null>(null);

  const validate = useCallback((code: string) => {
    const model = editorRef.current?.getModel();
    if (!model) return;
    try {
      parseToml(code);
      monaco.editor.setModelMarkers(model, "toml-validate", []);
    } catch (e: any) {
      monaco.editor.setModelMarkers(model, "toml-validate", [{
        severity: monaco.MarkerSeverity.Error,
        message: e.message || "TOML parse error",
        startLineNumber: e.line ?? 1,
        startColumn: e.column ?? 1,
        endLineNumber: e.line ?? 1,
        endColumn: (e.column ?? 1) + 1,
      }]);
    }
  }, []);

  const doSave = useCallback(async (explicit?: string) => {
    if (saving) return;
    const current = explicit ?? editorRef.current?.getValue() ?? "";
    setSaving(true);
    try {
      await onSave(current);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [onSave, saving]);

  const onMount: OnMount = (editor, monacoNS) => {
    editorRef.current = editor;
    registerToml(monacoNS);

    // Ctrl/Cmd+S -> read from the editor
    editor.addCommand(monacoNS.KeyMod.CtrlCmd | monacoNS.KeyCode.KeyS, () => {
      void doSave();
    });

    // On change -> capture v, validate it, and autosave will send v
    editor.onDidChangeModelContent(() => {
      const v = editor.getValue();
      setDirty(true);
      validate(v);
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = window.setTimeout(() => { void doSave(v); }, 1200);
    });


    validate(initialValue);
  };

  return (
    <div className="h-full w-full relative">
      <div className="absolute right-2 top-2 text-xs z-10">
        {saving ? "Saving..." : dirty ? "Unsaved changes" : "Saved"}
      </div>
      <Editor
        height="100%"
        width="100%"
        defaultLanguage="toml"
        defaultValue={initialValue}
        theme="vs-dark"
        onMount={onMount}
        options={{ minimap:{enabled:false}, automaticLayout:true, wordWrap:"on" }}
      />
    </div>
  );
}
