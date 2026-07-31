"use client";

import { useState } from "react";
import { ApiRequestError, submitContact } from "@/lib/api";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitContact(form);
      setStatus(res.message);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to send message");
    } finally {
      setSubmitting(false);
    }
  }

  if (status) return <p className="profile-message">{status}</p>;

  return (
    <form className="form contact-form" onSubmit={handleSubmit}>
      {error && <p className="error-text">{error}</p>}
      <div className="field">
        <label>Name</label>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="field">
        <label>Phone (optional)</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="field">
        <label>Message</label>
        <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </div>
      <button type="submit" className="purchase-btn" disabled={submitting} style={{ width: "auto", padding: "10px 28px" }}>
        {submitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
