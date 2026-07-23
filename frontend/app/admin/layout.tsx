"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) router.push("/login?next=/admin");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return <main className="container section">Loading...</main>;
  }

  return (
    <main className="container admin-shell">
      <nav className="admin-nav">
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/categories">Categories</Link>
        <Link href="/admin/coupons">Coupons</Link>
        <Link href="/admin/orders">Orders</Link>
      </nav>
      <div>{children}</div>
    </main>
  );
}
