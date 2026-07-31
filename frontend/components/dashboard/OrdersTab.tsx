"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cancelMyOrder, getMyOrders, type Order } from "@/lib/api";
import { useCurrency } from "@/lib/currency-context";

export default function OrdersTab() {
  const { format } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    getMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this order?")) return;
    await cancelMyOrder(id).catch(() => undefined);
    load();
  }

  if (loading) return <p className="muted">Loading orders...</p>;
  if (orders.length === 0) {
    return (
      <div className="orders-empty-wrap">
        <p className="muted">You have no orders yet.</p>
        <Link href="/listing" className="button">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="order-list">
      {orders.map((order) => (
        <div className="order-card" key={order.id}>
          <div className="order-card-header">
            <span>Order #{order.id.slice(0, 8)}</span>
            <span className={`badge badge-${order.status}`}>{order.status}</span>
          </div>
          <div className="order-card-body">
            <span>{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
            <span>{order.items.length} item{order.items.length === 1 ? "" : "s"}</span>
            <span className="order-total">{format(order.total)}</span>
          </div>
          <div className="order-card-actions">
            <Link href={`/orders/${order.id}`} className="order-action-link">Details</Link>
            {order.status === "PENDING" && (
              <button className="order-action-link danger" onClick={() => handleCancel(order.id)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
