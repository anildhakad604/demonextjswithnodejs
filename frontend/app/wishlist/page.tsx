"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const { items, loading: wishlistLoading } = useWishlist();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/wishlist");
  }, [loading, user, router]);

  if (loading || !user) return <main className="container section">Loading...</main>;

  return (
    <main className="container section">
      <h1>My Wishlist</h1>
      {wishlistLoading ? (
        <p className="muted">Loading...</p>
      ) : items.length === 0 ? (
        <p className="muted">You haven&apos;t saved any products yet.</p>
      ) : (
        <div className="grid wishlist-page-grid">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </main>
  );
}
