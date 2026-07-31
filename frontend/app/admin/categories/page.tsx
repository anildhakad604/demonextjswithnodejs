"use client";

import { useEffect, useState } from "react";
import {
  ApiRequestError,
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  getCategories,
  type Category,
} from "@/lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [subCategoryInputs, setSubCategoryInputs] = useState<Record<string, string>>({});

  function load() {
    getCategories().then(setCategories);
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createCategory(name);
      setName("");
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to create category");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      load();
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : "Unable to delete category");
    }
  }

  async function handleAddSubCategory(categoryId: string) {
    const subName = (subCategoryInputs[categoryId] || "").trim();
    if (!subName) return;
    try {
      await createSubCategory(subName, categoryId);
      setSubCategoryInputs((prev) => ({ ...prev, [categoryId]: "" }));
      load();
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : "Unable to create subcategory");
    }
  }

  async function handleDeleteSubCategory(id: string) {
    if (!confirm("Delete this subcategory?")) return;
    try {
      await deleteSubCategory(id);
      load();
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : "Unable to delete subcategory");
    }
  }

  return (
    <>
      <h1>Categories</h1>
      <form className="form" onSubmit={handleCreate} style={{ marginBottom: 24 }}>
        {error && <p className="error-text">{error}</p>}
        <div className="field">
          <label>New category name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button className="button" type="submit">Add category</button>
      </form>

      {categories.map((cat) => (
        <div className="card" key={cat.id} style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>{cat.name} <small className="muted">/{cat.slug}</small></h3>
            <button className="button button-danger button-sm" onClick={() => handleDelete(cat.id)}>Delete</button>
          </div>

          <h4 style={{ marginTop: 16, marginBottom: 8, fontSize: 14 }}>Subcategories</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px" }}>
            {(cat.subCategories || []).map((sub) => (
              <li key={sub.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-light)" }}>
                <span>{sub.name}</span>
                <button className="link-button" onClick={() => handleDeleteSubCategory(sub.id)}>Remove</button>
              </li>
            ))}
            {(!cat.subCategories || cat.subCategories.length === 0) && <li className="muted">No subcategories yet.</li>}
          </ul>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="New subcategory name"
              value={subCategoryInputs[cat.id] || ""}
              onChange={(e) => setSubCategoryInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))}
            />
            <button className="button button-secondary button-sm" onClick={() => handleAddSubCategory(cat.id)}>Add</button>
          </div>
        </div>
      ))}
    </>
  );
}
