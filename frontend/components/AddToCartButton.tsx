"use client";

import { useState } from "react";
import type { Product } from "@/lib/api";
import { useCart } from "@/lib/cart-context";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button className="button" onClick={handleAdd} disabled={product.stock === 0}>
      {product.stock === 0 ? "Out of stock" : added ? "Added!" : "Add to Cart"}
    </button>
  );
}
