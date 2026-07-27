"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiRequestError, resetPassword } from "@/lib/api";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to reset password");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="container section auth-page">
        <h1>Reset Password</h1>
        <p className="error-text">This reset link is missing its token. Please use the link from your email.</p>
        <p className="muted">
          <Link href="/forgot-password">Request a new link</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container section auth-page">
      <h1>Reset Password</h1>
      <form className="form" onSubmit={handleSubmit}>
        {error && <p className="error-text">{error}</p>}
        <div className="field">
          <label htmlFor="password">New password (min 8 characters)</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="container section">Loading...</main>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
