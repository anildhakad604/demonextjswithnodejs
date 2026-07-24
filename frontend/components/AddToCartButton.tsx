"use client";

import { useState } from "react";
import type { Product } from "@/lib/api";
import { useCart } from "@/lib/cart-context";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const hasSizes = product.sizes.length > 0;
  const selectedSizeStock = hasSizes
    ? product.sizes.find((s) => s.size === selectedSize)?.stock ?? null
    : product.stock;
  const outOfStock = hasSizes ? selectedSize !== null && selectedSizeStock === 0 : product.stock === 0;
  const disabled = (hasSizes && !selectedSize) || outOfStock;

  function handleAdd() {
    addItem(product, 1, selectedSize || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div>
      {hasSizes && (
        <div className="field" style={{ maxWidth: 320, marginBottom: 16 }}>
          <label>Size</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {product.sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`button-sm ${selectedSize === s.size ? "button" : "button button-secondary"}`}
                disabled={s.stock === 0}
                onClick={() => setSelectedSize(s.size)}
                style={s.stock === 0 ? { opacity: 0.4, textDecoration: "line-through" } : undefined}
              >
                {s.size}
              </button>
            ))}
          </div>
          {selectedSize && (
            <p className="muted">
              {selectedSizeStock && selectedSizeStock > 0 ? `${selectedSizeStock} in stock` : "Out of stock"}
            </p>
          )}
        </div>
      )}
      <button className="button" onClick={handleAdd} disabled={disabled}>
        {outOfStock ? "Out of stock" : hasSizes && !selectedSize ? "Select a size" : added ? "Added!" : "Add to Cart"}
      </button>
    </div>
  );
}
