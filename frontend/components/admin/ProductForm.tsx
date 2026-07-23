"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiRequestError,
  createProduct,
  getCategories,
  updateProduct,
  type Category,
  type Product,
} from "@/lib/api";

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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategories().then((list) => {
      setCategories(list);
      if (!categoryId && list[0]) setCategoryId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("description", description);
      formData.set("price", price);
      formData.set("stock", stock);
      formData.set("categoryId", categoryId);
      formData.set("isActive", String(isActive));
      if (image) formData.set("image", image);

      if (product) await updateProduct(product.id, formData);
      else await createProduct(formData);

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to save product");
    } finally {
      setSubmitting(false);
    }
  }

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
        <div className="field">
          <label>Stock</label>
          <input required type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
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
        <label>Product image {product ? "(leave blank to keep current)" : ""}</label>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} required={!product} />
      </div>
      <div className="field">
        <label>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
        </label>
      </div>
      <button className="button" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
