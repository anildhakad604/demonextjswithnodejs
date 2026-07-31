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
        name: "SweetyNX",
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
        theme: { color: "#ff236c" },
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
      <main className="checkout-page">
        <div className="cart-progress main-container">
          <span className="step">Shopping Bag</span>
          <span className="dash" />
          <span className="step active">Delivery Address</span>
          <span className="dash" />
          <span className="step">Payment</span>
        </div>
        <div className="main-container guest-checkout-form">
          <h2 className="address-title">Continue to Checkout</h2>
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
            <button className="purchase-btn" type="submit" disabled={guestSubmitting}>
              {guestSubmitting ? "Continuing..." : "Continue as Guest"}
            </button>
            <p className="muted" style={{ marginTop: 12 }}>
              Already have an account? <Link href="/login?next=/checkout">Login</Link>
            </p>
          </form>
        </div>
      </main>
    );
  }

  const afterDiscount = Math.max(subtotal - discount, 0);
  const shippingFee = computeShippingFee(afterDiscount);
  const total = afterDiscount + shippingFee;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <main className="checkout-page">
        <div className="cart-progress main-container">
          <span className="step">Shopping Bag</span>
          <span className="dash" />
          <span className="step active">Delivery Address</span>
          <span className="dash" />
          <span className="step">Payment</span>
        </div>

        <div className="main-container">
          {error && <p className="error-text">{error}</p>}

          <div className="checkout-grid">
            <div className="address-area">
              <div className="checkout-address-header">
                <h2 className="address-title">Select Your Delivery Address</h2>
              </div>

              {addresses.length > 0 && !showNewAddress ? (
                <>
                  {addresses.map((addr) => (
                    <label className="address-card" key={addr.id}>
                      <div className="address-head">
                        <input
                          type="radio"
                          name="address"
                          checked={addressId === addr.id}
                          onChange={() => setAddressId(addr.id)}
                        />
                        <strong>{addr.fullName}</strong>
                      </div>
                      <p className="address-line">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="address-line">Phone: <span className="fw-bold">{addr.phone}</span></p>
                    </label>
                  ))}
                  <button type="button" className="address-add-lite" onClick={() => setShowNewAddress(true)}>
                    + Add New Address
                  </button>
                </>
              ) : (
                <div className="address-card new-address-form">
                  <div className="modal-field-stack">
                    <div className="modal-row-two">
                      <input placeholder="Full Name" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} />
                      <input placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
                    </div>
                    <input placeholder="Address Line 1" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
                    <input placeholder="Address Line 2 (optional)" value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} />
                    <div className="modal-row-two">
                      <input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                      <input placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                    </div>
                    <div className="modal-row-two">
                      <input placeholder="Postal Code" value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} />
                      <input placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} />
                    </div>
                  </div>
                  {addresses.length > 0 && (
                    <button type="button" className="address-add-lite" onClick={() => setShowNewAddress(false)}>
                      Use a saved address instead
                    </button>
                  )}
                </div>
              )}
            </div>

            <aside className="summary-area">
              <div className="summary-card">
                <h6 className="summary-title">Order Details</h6>
                <hr />
                {items.map((item) => (
                  <div className="summary-line" key={`${item.productId}::${item.size ?? ""}`}>
                    <span>{item.name}{item.size ? ` (${item.size})` : ""} × {item.quantity}</span>
                    <span>{format(Number(item.price) * item.quantity)}</span>
                  </div>
                ))}

                <div className="coupon-row">
                  <input
                    className="chip-select"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button className="coupon-apply" onClick={handleApplyCoupon} type="button">Apply</button>
                </div>
                {couponMessage && <p className="muted">{couponMessage}</p>}

                <hr />
                <div className="summary-line"><span>Subtotal</span><span>{format(subtotal)}</span></div>
                {discount > 0 && (
                  <div className="summary-line text-success"><span>Coupon Discount</span><span>-{format(discount)}</span></div>
                )}
                <div className="summary-line text-success">
                  <span>Delivery Charges</span>
                  <span>{shippingFee === 0 ? "FREE" : format(shippingFee)}</span>
                </div>
                {shippingFee > 0 && (
                  <p className="free-shipping-note">
                    Add {format(FREE_SHIPPING_THRESHOLD - afterDiscount)} more for free shipping
                  </p>
                )}
                <div className="summary-total"><span>Total Amount</span><span>{format(total)}</span></div>
                {currency !== "INR" && (
                  <p className="free-shipping-note">
                    Shown in {currency} for reference — you&apos;ll be charged {formatINR(total)} (INR) at checkout.
                  </p>
                )}

                <button className="purchase-btn" onClick={handlePlaceOrder} disabled={submitting}>
                  {submitting ? "Processing..." : `Pay ${formatINR(total)}`}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
