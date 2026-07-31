"use client";

import { useState } from "react";
import type { Product } from "@/lib/api";
import { useCart } from "@/lib/cart-context";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeAlert, setShowSizeAlert] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const hasSizes = product.sizes.length > 0;
  const selectedSizeStock = hasSizes
    ? product.sizes.find((s) => s.size === selectedSize)?.stock ?? null
    : product.stock;
  const outOfStock = hasSizes ? selectedSize !== null && selectedSizeStock === 0 : product.stock === 0;
  const maxQty = Math.min(hasSizes ? selectedSizeStock ?? 1 : product.stock, 10) || 1;

  function handleAdd() {
    if (hasSizes && !selectedSize) {
      setShowSizeAlert(true);
      setTimeout(() => setShowSizeAlert(false), 2500);
      return;
    }
    addItem(product, quantity, selectedSize || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div>
      {hasSizes && (
        <div className="product-options-sizes">
          <span className="section-label">Select Size</span>
          <div className="size-chip-row">
            {product.sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`size-chip ${selectedSize === s.size ? "active" : ""} ${s.stock === 0 ? "disabled" : ""}`}
                disabled={s.stock === 0}
                onClick={() => setSelectedSize(s.size)}
              >
                {s.size}
              </button>
            ))}
          </div>
          {selectedSize && (
            <p className="stock-note">
              {selectedSizeStock && selectedSizeStock > 0 ? `${selectedSizeStock} in stock` : "Out of stock"}
            </p>
          )}
          {showSizeAlert && <p className="size-alert">Please select a size.</p>}
        </div>
      )}

      <div className="product-options-quantity">
        <span className="section-label">Quantity</span>
        <div className="qty-control">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
            &minus;
          </button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty}>
            +
          </button>
        </div>
      </div>

      <button className="add-to-bag" onClick={handleAdd} disabled={outOfStock}>
        <i className="bi bi-handbag" />
        {outOfStock ? "Out of stock" : added ? "Added to Bag" : "Add to Bag"}
      </button>
    </div>
  );
}
