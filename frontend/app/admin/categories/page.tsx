"use client";

import { useEffect, useState } from "react";
import { ApiRequestError, createCategory, deleteCategory, getCategories, type Category } from "@/lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      <table className="table">
        <thead><tr><th>Name</th><th>Slug</th><th></th></tr></thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.name}</td>
              <td>{cat.slug}</td>
              <td><button className="button button-danger button-sm" onClick={() => handleDelete(cat.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
