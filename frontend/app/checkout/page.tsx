"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { formatINR } from "@/lib/format";
import { computeShippingFee, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import {
  ApiRequestError,
  type Address,
  createAddress,
  createOrder,
  getAddresses,
  verifyPayment,
  validateCoupon,
} from "@/lib/api";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const { user, loading: authLoading, continueAsGuest } = useAuth();
  const { items, subtotal, clear, removeItem } = useCart();
  const { currency, format } = useCurrency();
  const router = useRouter();

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGuestContinue(e: React.FormEvent) {
    e.preventDefault();
    setGuestError(null);
    setGuestSubmitting(true);
    try {
      await continueAsGuest(guestName, guestEmail);
    } catch (err) {
      setGuestError(err instanceof ApiRequestError ? err.message : "Unable to continue as guest");
    } finally {
      setGuestSubmitting(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    getAddresses()
      .then((list) => {
        setAddresses(list);
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        if (defaultAddr) setAddressId(defaultAddr.id);
        else setShowNewAddress(true);
      })
      .catch(() => undefined);
  }, [user]);

  async function handleApplyCoupon() {
    setCouponMessage(null);
    if (!couponCode.trim()) return;
    try {
      const result = await validateCoupon(couponCode.trim(), subtotal);
      setDiscount(result.discount);
      setCouponMessage(`Coupon applied: -${format(result.discount)}`);
    } catch (err) {
      setDiscount(0);
      setCouponMessage(err instanceof ApiRequestError ? err.message : "Invalid coupon");
    }
  }

  async function ensureAddress(): Promise<string> {
    if (!showNewAddress && addressId) return addressId;
    if (!showNewAddress && !addressId && addresses.length > 0) {
      // Addresses loaded but none selected yet — pick the default or first one
      const fallback = addresses.find((a) => a.isDefault) || addresses[0];
      setAddressId(fallback.id);
      return fallback.id;
    }
    if (showNewAddress && (!newAddress.line1 || !newAddress.city || !newAddress.postalCode)) {
      throw new ApiRequestError(400, "Please fill in the required address fields (line 1, city, postal code)");
    }
    const created = await createAddress({ ...newAddress, isDefault: addresses.length === 0 });
    setAddresses((prev) => [...prev, created]);
    setAddressId(created.id);
    setShowNewAddress(false);
    return created.id;
  }

  async function handlePlaceOrder() {
    setError(null);
    setSubmitting(true);
    try {
      const finalAddressId = await ensureAddress();
      const order = await createOrder({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size || undefined,
        })),
        addressId: finalAddressId,
        couponCode: couponCode.trim() || undefined,
      });

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "NovaShop",
        description: "Order payment",
        order_id: order.razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment(order.orderId, response);
            clear();
            router.push(`/orders/${order.orderId}`);
          } catch {
            setError("Payment succeeded but verification failed. Contact support.");
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#111111" },
      });
      razorpay.open();
    } catch (err) {
      if (err instanceof ApiRequestError && err.productId) {
        removeItem(err.productId, err.size);
        setError(`${err.message}. It has been removed from your cart — please review and try again.`);
      } else {
        setError(err instanceof ApiRequestError ? err.message : "Unable to start checkout");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <main className="container section">Loading...</main>;

  if (items.length === 0) {
    return (
      <main className="container section">
        <h1>Checkout</h1>
        {error && <p className="error-text">{error}</p>}
        <p>Your cart is empty.</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container section auth-page">
        <h1>Checkout</h1>
        <form className="form" onSubmit={handleGuestContinue}>
          {guestError && <p className="error-text">{guestError}</p>}
          <p className="muted">Continue as a guest, or log in if you already have an account.</p>
          <div className="field">
            <label htmlFor="guestName">Full name</label>
            <input id="guestName" required value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="guestEmail">Email</label>
            <input
              id="guestEmail"
              type="email"
              required
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
          </div>
          <button className="button" type="submit" disabled={guestSubmitting}>
            {guestSubmitting ? "Continuing..." : "Continue as Guest"}
          </button>
          <p className="muted">
            Already have an account? <Link href="/login?next=/checkout">Login</Link>
          </p>
        </form>
      </main>
    );
  }

  const afterDiscount = Math.max(subtotal - discount, 0);
  const shippingFee = computeShippingFee(afterDiscount);
  const total = afterDiscount + shippingFee;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <main className="container section">
        <h1>Checkout</h1>
        {error && <p className="error-text">{error}</p>}

        <h2>Shipping Address</h2>
        {addresses.length > 0 && !showNewAddress && (
          <div className="field">
            <select value={addressId} onChange={(e) => setAddressId(e.target.value)}>
              {addresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.fullName} — {addr.line1}, {addr.city} ({addr.postalCode})
                </option>
              ))}
            </select>
            <button className="link-button" onClick={() => setShowNewAddress(true)}>
              + Use a new address
            </button>
          </div>
        )}
        {showNewAddress && (
          <div className="form form-wide">
            <div className="form-row">
              <div className="field">
                <label>Full name</label>
                <input value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Address line 1</label>
              <input value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
            </div>
            <div className="field">
              <label>Address line 2 (optional)</label>
              <input value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="field">
                <label>City</label>
                <input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
              </div>
              <div className="field">
                <label>State</label>
                <input value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Postal code</label>
                <input value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} />
              </div>
              <div className="field">
                <label>Country</label>
                <input value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} />
              </div>
            </div>
            {addresses.length > 0 && (
              <button className="link-button" onClick={() => setShowNewAddress(false)}>
                Use a saved address instead
              </button>
            )}
          </div>
        )}

        <h2>Order Summary</h2>
        {items.map((item) => (
          <div className="summary-row" key={`${item.productId}::${item.size ?? ""}`}>
            <span>{item.name}{item.size ? ` (${item.size})` : ""} × {item.quantity}</span>
            <span>{format(Number(item.price) * item.quantity)}</span>
          </div>
        ))}

        <div className="field" style={{ maxWidth: 320, marginTop: 16 }}>
          <label>Coupon code</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            <button className="button button-secondary button-sm" onClick={handleApplyCoupon} type="button">
              Apply
            </button>
          </div>
          {couponMessage && <p className="muted">{couponMessage}</p>}
        </div>

        <div className="summary-row"><strong>Subtotal</strong><span>{format(subtotal)}</span></div>
        {discount > 0 && <div className="summary-row"><strong>Discount</strong><span>-{format(discount)}</span></div>}
        <div className="summary-row">
          <strong>Shipping</strong>
          <span>{shippingFee === 0 ? "Free" : format(shippingFee)}</span>
        </div>
        {shippingFee > 0 && (
          <p className="muted">
            Add {format(FREE_SHIPPING_THRESHOLD - afterDiscount)} more for free shipping
          </p>
        )}
        <div className="summary-row"><strong>Total</strong><strong>{format(total)}</strong></div>
        {currency !== "INR" && (
          <p className="muted">
            Shown in {currency} for reference — you&apos;ll be charged {formatINR(total)} (Indian Rupees) at checkout.
          </p>
        )}

        <button className="button" onClick={handlePlaceOrder} disabled={submitting} style={{ marginTop: 16 }}>
          {submitting ? "Processing..." : `Pay ${formatINR(total)}`}
        </button>
      </main>
    </>
  );
}
