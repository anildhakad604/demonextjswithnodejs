"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await updateProfile(name);
      setMessage("Profile updated.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="about-you-form" onSubmit={handleSubmit}>
      {message && <p className="profile-message">{message}</p>}
      <div className="field">
        <label>Full Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <label>Mobile</label>
        <input value={user?.phone ?? "—"} readOnly disabled />
      </div>
      <div className="field">
        <label>Email</label>
        <input value={user?.email ?? ""} readOnly disabled />
      </div>
      <button type="submit" className="purchase-btn" disabled={submitting} style={{ width: "auto", padding: "10px 28px" }}>
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
