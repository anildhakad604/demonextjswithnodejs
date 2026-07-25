"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminStats, type AdminStats } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { RevenueIcon, OrdersIcon, BagIcon, UsersIcon, AlertIcon } from "@/components/admin/icons";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => undefined);
  }, []);

  if (!stats) return <p className="muted">Loading dashboard...</p>;

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon stat-icon-indigo"><RevenueIcon /></span>
          <div>
            <div className="label">Revenue</div>
            <div className="value">{formatINR(stats.revenue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-blue"><OrdersIcon /></span>
          <div>
            <div className="label">Orders</div>
            <div className="value">{stats.orderCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-green"><BagIcon /></span>
          <div>
            <div className="label">Products</div>
            <div className="value">{stats.productCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-indigo"><UsersIcon /></span>
          <div>
            <div className="label">Users</div>
            <div className="value">{stats.userCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-amber"><AlertIcon /></span>
          <div>
            <div className="label">Low stock</div>
            <div className="value">{stats.lowStockCount}</div>
          </div>
        </div>
      </div>

      <h2>Recent Orders</h2>
      <table className="table">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          {stats.recentOrders.map((order) => (
            <tr key={order.id}>
              <td><Link href={`/admin/orders`}>#{order.id.slice(0, 8)}</Link></td>
              <td>{order.user?.name}</td>
              <td>{formatINR(order.total)}</td>
              <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
