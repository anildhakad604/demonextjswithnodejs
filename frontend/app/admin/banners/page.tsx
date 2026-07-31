"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ApiRequestError,
  createBanner,
  deleteBanner,
  getAdminBanners,
  resolveImage,
  updateBanner,
  type Banner,
  type BannerType,
} from "@/lib/api";

const BANNER_TYPES: BannerType[] = ["HERO", "MID", "BIG_CATEGORY", "CATEGORY_CARD", "CELEB", "FASHION_VIDEO"];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [type, setType] = useState<BannerType>("HERO");
  const [title, setTitle] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    getAdminBanners().then(setBanners);
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Please choose an image");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("title", title);
      formData.append("sortOrder", sortOrder);
      formData.append("image", file);
      await createBanner(formData);
      setTitle("");
      setSortOrder("0");
      setFile(null);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to create banner");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(banner: Banner) {
    const formData = new FormData();
    formData.append("isActive", String(!banner.isActive));
    await updateBanner(banner.id, formData);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this banner?")) return;
    await deleteBanner(id);
    load();
  }

  return (
    <>
      <h1>Homepage Banners</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Controls the hero carousel, mid banner, category grids, and celeb carousel on the homepage.
      </p>

      <form className="form" onSubmit={handleCreate} style={{ marginBottom: 28 }}>
        {error && <p className="error-text">{error}</p>}
        <div className="form-row">
          <div className="field">
            <label>Placement</label>
            <select value={type} onChange={(e) => setType(e.target.value as BannerType)}>
              {BANNER_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Sort order</label>
            <input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Title / alt text</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Image</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Uploading..." : "Add banner"}
        </button>
      </form>

      <table className="table">
        <thead><tr><th>Image</th><th>Type</th><th>Title</th><th>Order</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {banners.map((banner) => (
            <tr key={banner.id}>
              <td><Image src={resolveImage(banner.imageUrl)} alt={banner.title || ""} width={64} height={40} style={{ objectFit: "cover" }} /></td>
              <td>{banner.type}</td>
              <td>{banner.title}</td>
              <td>{banner.sortOrder}</td>
              <td>{banner.isActive ? "Yes" : "No"}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button className="button button-secondary button-sm" onClick={() => toggleActive(banner)}>
                  {banner.isActive ? "Disable" : "Enable"}
                </button>
                <button className="button button-danger button-sm" onClick={() => handleDelete(banner.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
