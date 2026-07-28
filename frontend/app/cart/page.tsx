"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";

export default function CartPage() {
  const { items, removeItem, setQuantity, subtotal } = useCart();
  const { format } = useCurrency();

  return (
    <main className="container section">
      <h1>Shopping Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {items.map((item) => (
            <div className="cart-row" key={`${item.productId}::${item.size ?? ""}`}>
              <div>
                <strong>
                  {item.name}
                  {item.size ? ` (${item.size})` : ""}
                </strong>
                <div>
                  Qty:{" "}
                  <input
                    className="qty-input"
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.productId, Number(e.target.value), item.size)}
                  />
                </div>
              </div>
              <div>
                <strong>{format(Number(item.price) * item.quantity)}</strong>{" "}
                <button
                  className="button button-secondary button-sm"
                  onClick={() => removeItem(item.productId, item.size)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <h2>Total: {format(subtotal)}</h2>
          <Link className="button" href="/checkout">Proceed to Checkout</Link>
        </>
      )}
    </main>
  );
}
