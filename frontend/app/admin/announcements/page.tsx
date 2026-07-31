"use client";

import { useEffect, useState } from "react";
import {
  ApiRequestError,
  createAnnouncement,
  deleteAnnouncement,
  getAdminAnnouncements,
  updateAnnouncement,
  type AnnouncementRecord,
} from "@/lib/api";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    getAdminAnnouncements().then(setAnnouncements);
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createAnnouncement({ text, isActive: true });
      setText("");
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to create announcement");
    }
  }

  async function activate(id: string) {
    await updateAnnouncement(id, { isActive: true });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await deleteAnnouncement(id);
    load();
  }

  return (
    <>
      <h1>Announcement Bar</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        The top bar shows only the most recently activated announcement.
      </p>

      <form className="form" onSubmit={handleCreate} style={{ marginBottom: 24 }}>
        {error && <p className="error-text">{error}</p>}
        <div className="field">
          <label>Announcement text</label>
          <input required maxLength={300} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <button className="button" type="submit">Add &amp; activate</button>
      </form>

      <table className="table">
        <thead><tr><th>Text</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {announcements.map((a) => (
            <tr key={a.id}>
              <td>{a.text}</td>
              <td>{a.isActive ? "Yes" : "No"}</td>
              <td style={{ display: "flex", gap: 8 }}>
                {!a.isActive && (
                  <button className="button button-secondary button-sm" onClick={() => activate(a.id)}>Activate</button>
                )}
                <button className="button button-danger button-sm" onClick={() => handleDelete(a.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
