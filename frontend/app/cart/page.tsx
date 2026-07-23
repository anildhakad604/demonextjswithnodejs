"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatINR } from "@/lib/format";

export default function CartPage() {
  const { items, removeItem, setQuantity, subtotal } = useCart();

  return (
    <main className="container section">
      <h1>Shopping Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {items.map((item) => (
            <div className="cart-row" key={item.productId}>
              <div>
                <strong>{item.name}</strong>
                <div>
                  Qty:{" "}
                  <input
                    className="qty-input"
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <strong>{formatINR(Number(item.price) * item.quantity)}</strong>{" "}
                <button className="button button-secondary button-sm" onClick={() => removeItem(item.productId)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <h2>Total: {formatINR(subtotal)}</h2>
          <Link className="button" href="/checkout">Proceed to Checkout</Link>
        </>
      )}
    </main>
  );
}
