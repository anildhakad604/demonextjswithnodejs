"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getOrder, type Order, ApiRequestError } from "@/lib/api";
import { useCurrency } from "@/lib/currency-context";

export default function OrderDetailPage() {
  const { user, loading } = useAuth();
  const { format } = useCurrency();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    getOrder(params.id)
      .then(setOrder)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Unable to load order"));
  }, [user, params.id]);

  if (loading || !user) return <main className="container section">Loading...</main>;
  if (error) return <main className="container section"><p className="error-text">{error}</p></main>;
  if (!order) return <main className="container section">Loading order...</main>;

  return (
    <main className="container section">
      <h1>Order #{order.id.slice(0, 8)}</h1>
      <p>
        Status: <span className={`badge badge-${order.status}`}>{order.status}</span>
      </p>
      <p className="muted">Placed on {new Date(order.createdAt).toLocaleString("en-IN")}</p>

      <h2>Items</h2>
      {order.items.map((item) => (
        <div className="summary-row" key={item.id}>
          <span>{item.name}{item.size ? ` (${item.size})` : ""} × {item.quantity}</span>
          <span>{format(Number(item.price) * item.quantity)}</span>
        </div>
      ))}

      <div className="summary-row"><strong>Subtotal</strong><span>{format(order.subtotal)}</span></div>
      {Number(order.discount) > 0 && (
        <div className="summary-row"><strong>Discount</strong><span>-{format(order.discount)}</span></div>
      )}
      <div className="summary-row">
        <strong>Shipping</strong>
        <span>{Number(order.shippingFee) === 0 ? "Free" : format(order.shippingFee)}</span>
      </div>
      <div className="summary-row"><strong>Total</strong><strong>{format(order.total)}</strong></div>

      <h2>Shipping Address</h2>
      <p>
        {order.address.fullName}<br />
        {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}<br />
        {order.address.city}, {order.address.state} {order.address.postalCode}<br />
        {order.address.country} — {order.address.phone}
      </p>
    </main>
  );
}
