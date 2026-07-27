"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiRequestError, forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to send reset link");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container section auth-page">
      <h1>Forgot Password</h1>
      <form className="form" onSubmit={handleSubmit}>
        {error && <p className="error-text">{error}</p>}
        {message ? (
          <p className="muted">{message}</p>
        ) : (
          <>
            <p className="muted">Enter your account email and we&apos;ll send you a reset link.</p>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </>
        )}
        <p className="muted">
          <Link href="/login">Back to login</Link>
        </p>
      </form>
    </main>
  );
}
