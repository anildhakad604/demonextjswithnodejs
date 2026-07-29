"use client";

import dynamic from "next/dynamic";

const RichTextEditorInner = dynamic(() => import("./RichTextEditorInner"), {
  ssr: false,
  loading: () => <div className="rich-text-editor-loading">Loading editor…</div>,
});

export default function RichTextEditor(props: { value: string; onChange: (html: string) => void }) {
  return <RichTextEditorInner {...props} />;
}
