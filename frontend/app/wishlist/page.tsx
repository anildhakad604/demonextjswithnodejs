"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/currency-context";
import { useWishlist } from "@/lib/wishlist-context";
import { getProductUrl, resolveImage } from "@/lib/api";

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const { items, loading: wishlistLoading, toggle } = useWishlist();
  const { format } = useCurrency();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/wishlist");
  }, [loading, user, router]);

  if (loading || !user) return <main className="container section">Loading...</main>;

  return (
    <main className="wishlist-page">
      <div className="main-container">
        <h2>My Wishlist</h2>
        {wishlistLoading ? (
          <p className="muted">Loading...</p>
        ) : items.length === 0 ? (
          <p className="muted">Your wishlist is empty.</p>
        ) : (
          <div className="wishlist-grid">
            {items.map((item) => {
              const product = item.product;
              return (
                <div className="wishlist-item" key={item.id}>
                  <button
                    className="remove-btn"
                    aria-label="Remove from wishlist"
                    onClick={() => toggle(product.id)}
                  >
                    &times;
                  </button>
                  <Link href={getProductUrl(product)}>
                    <Image src={resolveImage(product.image)} alt={product.name} width={220} height={280} />
                  </Link>
                  <div className="wishlist-content">
                    <div className="wishlist-title">{product.name}</div>
                    <div className="price-box">
                      <span className="offer">{format(product.price)}</span>
                      {product.actualPrice && (
                        <span className="actual">{format(product.actualPrice)}</span>
                      )}
                    </div>
                    <div className="wishlist-actions">
                      <Link href={getProductUrl(product)} className="move-btn">MOVE TO BAG</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
