"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Bold, ClassicEditor, Essentials, Italic, Link, List, Paragraph, type Editor } from "ckeditor5";
import "ckeditor5/ckeditor5.css";

export default function RichTextEditorInner({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={value}
      config={{
        licenseKey: "GPL",
        plugins: [Essentials, Paragraph, Bold, Italic, Link, List],
        toolbar: ["undo", "redo", "|", "bold", "italic", "link", "|", "bulletedList", "numberedList"],
      }}
      onChange={(_event, editor: Editor & { getData(): string }) => onChange(editor.getData())}
    />
  );
}
