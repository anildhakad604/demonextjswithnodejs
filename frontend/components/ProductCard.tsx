"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/api";
import { resolveImage } from "@/lib/api";
import { useCurrency } from "@/lib/currency-context";
import WishlistButton from "@/components/WishlistButton";

export default function ProductCard({ product }: { product: Product }) {
  const { format } = useCurrency();
  return (
    <article className="card" style={{ position: "relative" }}>
      <WishlistButton productId={product.id} className="wishlist-btn-card" />
      <Link href={`/products/${product.slug}`} style={{ display: "contents" }}>
        <Image src={resolveImage(product.image)} alt={product.name} width={600} height={600} />
        <div className="card-body">
          <small>{product.category?.name}</small>
          <h3>{product.name}</h3>
          <div className="price">{format(product.price)}</div>
          <span className="card-cta">
            View Product
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}