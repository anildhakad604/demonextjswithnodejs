"use client";

import { useEffect, useState } from "react";
import { API_URL, getAdminOrders, updateOrderStatus, type Order } from "@/lib/api";
import { formatINR } from "@/lib/format";

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");

  function load() {
    getAdminOrders(filter || undefined).then((res) => setOrders(res.items));
  }

  useEffect(load, [filter]);

  async function handleStatusChange(id: string, status: string) {
    await updateOrderStatus(id, status);
    load();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Orders</h1>
        <a
          className="button button-secondary button-sm"
          href={`${API_URL}/admin/orders/export${filter ? `?status=${filter}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Export CSV
        </a>
      </div>
      <div className="field" style={{ maxWidth: 240, marginBottom: 16 }}>
        <label>Filter by status</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <table className="table">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Update</th></tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>#{order.id.slice(0, 8)}</td>
              <td>{order.user?.name}<br /><span className="muted">{order.user?.email}</span></td>
              <td>{formatINR(order.total)}</td>
              <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
              <td>
                <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
