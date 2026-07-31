"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Legacy URL shape kept only as a redirect to /listing (see
// app/listing/[[...slug]]/page.tsx), which now carries category/subcategory
// as path segments instead of a ?category= query param.
export default function LegacyProductsRedirect() {
  return (
    <Suspense fallback={null}>
      <RedirectToListing />
    </Suspense>
  );
}

function RedirectToListing() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get("category");
    const rest = new URLSearchParams(searchParams);
    rest.delete("category");
    const query = rest.toString();
    const path = category ? `/listing/${category}` : "/listing";
    router.replace(query ? `${path}?${query}` : path);
  }, [router, searchParams]);

  return null;
}
