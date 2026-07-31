"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterRedirect />
    </Suspense>
  );
}

// Signup is now part of the mobile+OTP login flow (a new phone number is
// registered automatically on first verify) — there's no separate signup
// step to land on, so this route just forwards to /login.
function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next");
    router.replace(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }, [router, searchParams]);

  return null;
}
