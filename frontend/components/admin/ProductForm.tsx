"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiRequestError,
  createProduct,
  deleteProductImage,
  getCategories,
  resolveImage,
  updateProduct,
  type Category,
  type Product,
  type ProductImage,
} from "@/lib/api";

type SizeRow = { size: string; stock: string };

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [categoryId, setCategoryId] = useState(product?.categoryId || "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGallery, setExistingGallery] = useState<ProductImage[]>(product?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [hasSizes, setHasSizes] = useState((product?.sizes.length ?? 0) > 0);
  const [sizes, setSizes] = useState<SizeRow[]>(
    product?.sizes.map((s) => ({ size: s.size, stock: String(s.stock) })) ?? []
  );

  useEffect(() => {
    getCategories().then((list) => {
      setCategories(list);
      if (!categoryId && list[0]) setCategoryId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addSizeRow() {
    setSizes((prev) => [...prev, { size: "", stock: "0" }]);
  }
  function updateSizeRow(index: number, patch: Partial<SizeRow>) {
    setSizes((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function removeSizeRow(index: number) {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (hasSizes) {
      if (sizes.length === 0) return setError("Add at least one size, or turn off 'Sell by size'.");
      const labels = sizes.map((s) => s.size.trim().toUpperCase());
      if (labels.some((l) => !l)) return setError("Every size needs a label.");
      if (new Set(labels).size !== labels.length) return setError("Size labels must be unique.");
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("description", description);
      formData.set("price", price);
      formData.set("categoryId", categoryId);
      formData.set("isActive", String(isActive));
      if (image) formData.set("image", image);
      for (const file of galleryFiles) formData.append("gallery", file);

      if (hasSizes) {
        formData.set(
          "sizes",
          JSON.stringify(sizes.map((s) => ({ size: s.size.trim(), stock: Number(s.stock) || 0 })))
        );
      } else {
        formData.set("stock", stock);
        if (product && product.sizes.length > 0) {
          // Product previously had sizes — explicitly clear them since sizes are now off.
          formData.set("sizes", JSON.stringify([]));
        }
      }

      if (product) await updateProduct(product.id, formData);
      else await createProduct(formData);

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to save product");
    } finally {
      setSubmitting(false);
    }
  }

  const totalSizeStock = sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  return (
    <form className="form form-wide" onSubmit={handleSubmit}>
      {error && <p className="error-text">{error}</p>}
      <div className="field">
        <label>Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="field">
          <label>Price (₹)</label>
          <input required type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        {!hasSizes && (
          <div className="field">
            <label>Stock</label>
            <input required type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
        )}
      </div>
      <div className="field">
        <label>Category</label>
        <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Cover image {product ? "(leave blank to keep current)" : ""}</label>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} required={!product} />
      </div>

      <div className="field">
        <label>Gallery photos (additional angles, up to 6)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setGalleryFiles(Array.from(e.target.files || []).slice(0, 6))}
        />
      </div>
      {existingGallery.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {existingGallery.map((img) => (
            <div key={img.id} style={{ textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImage(img.url)}
                alt=""
                style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, display: "block" }}
              />
              <button
                type="button"
                className="link-button"
                style={{ fontSize: 12, color: "#c0392b", marginTop: 4 }}
                onClick={async () => {
                  if (!product) return;
                  await deleteProductImage(product.id, img.id);
                  setExistingGallery((prev) => prev.filter((i) => i.id !== img.id));
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="field">
        <label>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
        </label>
      </div>

      <div className="field">
        <label>
          <input type="checkbox" checked={hasSizes} onChange={(e) => setHasSizes(e.target.checked)} /> Sell by size
        </label>
      </div>

      {hasSizes && (
        <div>
          {sizes.map((row, i) => (
            <div className="form-row" key={i} style={{ alignItems: "flex-end", marginBottom: 8 }}>
              <div className="field">
                <label>Size label</label>
                <input
                  placeholder="S, M, L, 42..."
                  value={row.size}
                  onChange={(e) => updateSizeRow(i, { size: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Stock</label>
                <input
                  type="number"
                  min={0}
                  value={row.stock}
                  onChange={(e) => updateSizeRow(i, { stock: e.target.value })}
                />
              </div>
              <button type="button" className="button button-danger button-sm" onClick={() => removeSizeRow(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="button button-secondary button-sm" onClick={addSizeRow}>
            + Add size
          </button>
          <p className="muted" style={{ marginTop: 8 }}>Total stock across sizes: {totalSizeStock}</p>
        </div>
      )}

      <button className="button" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
