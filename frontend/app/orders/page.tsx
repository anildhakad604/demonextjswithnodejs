"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getMyOrders, type Order } from "@/lib/api";
import { formatINR } from "@/lib/format";

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/orders");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    getMyOrders()
      .then(setOrders)
      .finally(() => setLoadingOrders(false));
  }, [user]);

  if (loading || !user) return <main className="container section">Loading...</main>;

  return (
    <main className="container section">
      <h1>My Orders</h1>
      {loadingOrders ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/orders/${order.id}`}>#{order.id.slice(0, 8)}</Link></td>
                <td>{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                <td>{order.items.length}</td>
                <td>{formatINR(order.total)}</td>
                <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
