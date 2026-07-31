"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { computeShippingFee, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { resolveImage } from "@/lib/api";

export default function CartPage() {
  const { items, removeItem, setQuantity, setSize, subtotal, loading } = useCart();
  const { format } = useCurrency();

  const shippingFee = computeShippingFee(subtotal);
  const total = subtotal + shippingFee;

  return (
    <main className="cart-page">
      <div className="main-container">
        <div className="cart-progress">
          <span className="step active">Shopping Bag</span>
          <span className="dash" />
          <span className="step">Delivery Address</span>
          <span className="dash" />
          <span className="step">Payment</span>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart-state">
            <h5>Your bag is empty</h5>
            <Link href="/listing" className="button">Continue Shopping</Link>
          </div>
        ) : (
          <div className="bag-section">
            <div className="bag-area">
              <div className="bag-area-header">
                <h5>My Bag</h5>
                {loading && <span className="spinner" />}
              </div>

              {items.map((item) => (
                <div className="bag-card" key={`${item.id ?? item.productId}-${item.size ?? ""}`}>
                  <div className="bag-media">
                    <Image src={resolveImage(item.image)} alt={item.name} width={90} height={112} />
                  </div>
                  <div className="bag-info">
                    <p className="product-title">{item.name}</p>
                    <div className="bag-price-row">
                      <span className="bag-price">{format(Number(item.price) * item.quantity)}</span>
                      {item.actualPrice && (
                        <span className="price-discount">{format(Number(item.actualPrice) * item.quantity)}</span>
                      )}
                    </div>
                    <div className="chip-select-row">
                      {item.availableSizes && item.availableSizes.length > 0 && (
                        <select
                          className="chip-select"
                          value={item.size ?? ""}
                          onChange={(e) => setSize(item.productId, item.size, e.target.value)}
                        >
                          {item.availableSizes.map((s) => (
                            <option key={s} value={s}>Size: {s}</option>
                          ))}
                        </select>
                      )}
                      <select
                        className="chip-select"
                        value={item.quantity}
                        onChange={(e) => setQuantity(item.productId, Number(e.target.value), item.size)}
                      >
                        {Array.from({ length: Math.max(item.stock, item.quantity, 1) }, (_, i) => i + 1)
                          .slice(0, 10)
                          .map((n) => (
                            <option key={n} value={n}>Qty: {n}</option>
                          ))}
                      </select>
                    </div>
                    <button className="bag-remove-link" onClick={() => removeItem(item.productId, item.size)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="more-action-btns">
                <Link href="/wishlist" className="outline-pill">Add More Products From Wishlist</Link>
                <Link href="/listing" className="outline-pill">Continue Shopping</Link>
              </div>
            </div>

            <aside className="summary-area">
              <div className="summary-card">
                <h6 className="summary-title">Order Details</h6>
                <hr />
                <div className="summary-line">
                  <span>Order Total</span>
                  <span>{format(subtotal)}</span>
                </div>
                <div className="summary-line text-success">
                  <span>Delivery Charges</span>
                  <span>{shippingFee > 0 ? format(shippingFee) : "FREE"}</span>
                </div>
                {shippingFee > 0 && (
                  <p className="free-shipping-note">
                    Add {format(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
                  </p>
                )}
                <div className="summary-total">
                  <span>Total Amount</span>
                  <span>{format(total)}</span>
                </div>
                <Link href="/checkout" className="purchase-btn">Proceed to Checkout</Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
