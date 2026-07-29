"use client";

import { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import {
  ApiRequestError,
  createContentBlock,
  deleteContentBlock,
  reorderContentBlocks,
  updateContentBlock,
  type ContentBlock,
  type ContentBlockType,
} from "@/lib/api";

const BLOCK_TYPE_LABELS: Record<ContentBlockType, string> = {
  HEADING_TEXT: "Heading + Text",
  IMAGE_TEXT: "Image + Text",
  FEATURE_GRID: "Feature Grid",
  FULL_IMAGE: "Full-width Image",
};

type FeatureItemRow = { title: string; body: string };

function blockPreview(block: ContentBlock): string {
  switch (block.type) {
    case "HEADING_TEXT":
      return block.data.title;
    case "IMAGE_TEXT":
      return block.data.title;
    case "FEATURE_GRID":
      return block.data.title || `${block.data.items.length} feature items`;
    case "FULL_IMAGE":
      return block.data.caption || "Full-width image";
  }
}

export default function ContentBlockEditor({
  productId,
  initialBlocks,
}: {
  productId: string;
  initialBlocks: ContentBlock[];
}) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([...initialBlocks].sort((a, b) => a.sortOrder - b.sortOrder));
  const [editingId, setEditingId] = useState<string | null>(null); // null = closed, "new" = creating
  const [listError, setListError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<ContentBlockType>("HEADING_TEXT");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [layout, setLayout] = useState<"image-left" | "image-right">("image-left");
  const [caption, setCaption] = useState("");
  const [items, setItems] = useState<FeatureItemRow[]>([
    { title: "", body: "" },
    { title: "", body: "" },
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  function resetForm() {
    setType("HEADING_TEXT");
    setTitle("");
    setBody("");
    setLayout("image-left");
    setCaption("");
    setItems([{ title: "", body: "" }, { title: "", body: "" }]);
    setImageFile(null);
    setError(null);
  }

  function startCreate() {
    resetForm();
    setEditingId("new");
  }

  function startEdit(block: ContentBlock) {
    resetForm();
    setType(block.type);
    if (block.type === "HEADING_TEXT") {
      setTitle(block.data.title);
      setBody(block.data.body);
    } else if (block.type === "IMAGE_TEXT") {
      setTitle(block.data.title);
      setBody(block.data.body);
      setLayout(block.data.layout);
    } else if (block.type === "FEATURE_GRID") {
      setTitle(block.data.title ?? "");
      setItems(block.data.items.map((i) => ({ ...i })));
    } else if (block.type === "FULL_IMAGE") {
      setCaption(block.data.caption ?? "");
    }
    setEditingId(block.id);
  }

  function cancelEdit() {
    setEditingId(null);
    resetForm();
  }

  function addItemRow() {
    setItems((prev) => [...prev, { title: "", body: "" }]);
  }
  function updateItemRow(index: number, patch: Partial<FeatureItemRow>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function removeItemRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if ((type === "HEADING_TEXT" || type === "IMAGE_TEXT") && !body.replace(/<[^>]*>/g, "").trim()) {
      return setError("Body text is required.");
    }

    let cleanedItems: FeatureItemRow[] = [];
    if (type === "FEATURE_GRID") {
      cleanedItems = items.map((i) => ({ title: i.title.trim(), body: i.body.trim() })).filter((i) => i.title || i.body);
      if (cleanedItems.length < 2) return setError("Add at least two feature items.");
      if (cleanedItems.some((i) => !i.title || !i.body)) return setError("Every feature item needs a title and text.");
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("type", type);
      if (type === "HEADING_TEXT" || type === "IMAGE_TEXT") {
        formData.set("title", title);
        formData.set("body", body);
      }
      if (type === "IMAGE_TEXT") {
        formData.set("layout", layout);
      }
      if (type === "FEATURE_GRID") {
        if (title) formData.set("title", title);
        formData.set("items", JSON.stringify(cleanedItems));
      }
      if (type === "FULL_IMAGE" && caption) {
        formData.set("caption", caption);
      }
      if ((type === "IMAGE_TEXT" || type === "FULL_IMAGE") && imageFile) {
        formData.set("image", imageFile);
      }

      const saved =
        editingId && editingId !== "new"
          ? await updateContentBlock(productId, editingId, formData)
          : await createContentBlock(productId, formData);

      setBlocks((prev) =>
        editingId && editingId !== "new" ? prev.map((b) => (b.id === saved.id ? saved : b)) : [...prev, saved]
      );
      cancelEdit();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to save content block");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(blockId: string) {
    setListError(null);
    try {
      await deleteContentBlock(productId, blockId);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    } catch (err) {
      setListError(err instanceof ApiRequestError ? err.message : "Unable to delete content block");
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const previous = blocks;
    const reordered = [...blocks];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBlocks(reordered);
    setListError(null);
    try {
      await reorderContentBlocks(
        productId,
        reordered.map((b) => b.id)
      );
    } catch (err) {
      setBlocks(previous);
      setListError(err instanceof ApiRequestError ? err.message : "Unable to reorder content blocks");
    }
  }

  return (
    <div className="content-block-editor" style={{ marginTop: 40 }}>
      <h2>A+ Content</h2>
      <p className="muted">Rich content modules shown on the product page, below the standard description.</p>
      {listError && <p className="error-text">{listError}</p>}

      {blocks.map((block, index) => (
        <div className="block-admin-row" key={block.id}>
          <div>
            <strong>{BLOCK_TYPE_LABELS[block.type]}</strong>
            <p className="muted">{blockPreview(block)}</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              className="button button-secondary button-sm"
              onClick={() => move(index, -1)}
              disabled={index === 0}
            >
              ↑
            </button>
            <button
              type="button"
              className="button button-secondary button-sm"
              onClick={() => move(index, 1)}
              disabled={index === blocks.length - 1}
            >
              ↓
            </button>
            <button type="button" className="button button-secondary button-sm" onClick={() => startEdit(block)}>
              Edit
            </button>
            <button type="button" className="button button-danger button-sm" onClick={() => handleDelete(block.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {editingId ? (
        <form className="form form-wide" onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          {error && <p className="error-text">{error}</p>}
          <div className="field">
            <label>Block type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ContentBlockType)}
              disabled={editingId !== "new"}
            >
              {Object.entries(BLOCK_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {(type === "HEADING_TEXT" || type === "IMAGE_TEXT") && (
            <>
              <div className="field">
                <label>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="field">
                <label>Body text</label>
                <RichTextEditor value={body} onChange={setBody} />
              </div>
            </>
          )}

          {type === "IMAGE_TEXT" && (
            <div className="field">
              <label>Image layout</label>
              <select value={layout} onChange={(e) => setLayout(e.target.value as "image-left" | "image-right")}>
                <option value="image-left">Image on left</option>
                <option value="image-right">Image on right</option>
              </select>
            </div>
          )}

          {(type === "IMAGE_TEXT" || type === "FULL_IMAGE") && (
            <div className="field">
              <label>Image {editingId !== "new" ? "(leave blank to keep current)" : ""}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                required={editingId === "new"}
              />
            </div>
          )}

          {type === "FEATURE_GRID" && (
            <>
              <div className="field">
                <label>Section title (optional)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              {items.map((row, i) => (
                <div className="form-row" key={i} style={{ alignItems: "flex-end", marginBottom: 8 }}>
                  <div className="field">
                    <label>Feature title</label>
                    <input value={row.title} onChange={(e) => updateItemRow(i, { title: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Feature text</label>
                    <input value={row.body} onChange={(e) => updateItemRow(i, { body: e.target.value })} />
                  </div>
                  <button type="button" className="button button-danger button-sm" onClick={() => removeItemRow(i)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="button button-secondary button-sm" onClick={addItemRow}>
                + Add feature
              </button>
            </>
          )}

          {type === "FULL_IMAGE" && (
            <div className="field">
              <label>Caption (optional)</label>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingId === "new" ? "Add block" : "Save changes"}
            </button>
            <button type="button" className="button button-secondary" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="button button-secondary" style={{ marginTop: 16 }} onClick={startCreate}>
          + Add content block
        </button>
      )}
    </div>
  );
}
