"use client";

import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "@/lib/currency-context";
import { useWishlist } from "@/lib/wishlist-context";
import { getProductUrl, resolveImage } from "@/lib/api";

export default function WishlistTab() {
  const { items, loading, toggle } = useWishlist();
  const { format } = useCurrency();

  if (loading) return <p className="muted">Loading wishlist...</p>;
  if (items.length === 0) return <p className="muted">Your wishlist is empty.</p>;

  return (
    <div className="wishlist-grid">
      {items.map((item) => {
        const product = item.product;
        return (
          <div className="wishlist-item" key={item.id}>
            <button className="remove-btn" aria-label="Remove" onClick={() => toggle(product.id)}>&times;</button>
            <Link href={getProductUrl(product)}>
              <Image src={resolveImage(product.image)} alt={product.name} width={220} height={280} />
            </Link>
            <div className="wishlist-content">
              <div className="wishlist-title">{product.name}</div>
              <div className="price-box">
                <span className="offer">{format(product.price)}</span>
                {product.actualPrice && <span className="actual">{format(product.actualPrice)}</span>}
              </div>
              <div className="wishlist-actions">
                <Link href={getProductUrl(product)} className="move-btn">MOVE TO BAG</Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
