"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AddressBookTab from "@/components/dashboard/AddressBookTab";
import OrdersTab from "@/components/dashboard/OrdersTab";
import PointsTab from "@/components/dashboard/PointsTab";
import ProfileTab from "@/components/dashboard/ProfileTab";
import WalletTab from "@/components/dashboard/WalletTab";
import WishlistTab from "@/components/dashboard/WishlistTab";

const TABS = [
  { key: "orders", label: "My Orders" },
  { key: "help", label: "Help Center" },
  { key: "profile", label: "About You" },
  { key: "address", label: "Address Book" },
  { key: "wishlist", label: "My Wishlist" },
  { key: "returns", label: "My Returns" },
  { key: "wallet", label: "My Wallet" },
  { key: "points", label: "Sweety Points" },
] as const;

function DashboardInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "orders";

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/dashboard");
  }, [loading, user, router]);

  if (loading || !user) return <main className="container section">Loading...</main>;

  return (
    <main className="dashboard-page">
      <div className="main-container dashboard-container">
        <aside className="dashboard-sidebar">
          <h2>My Account</h2>
          <ul className="dashboard-nav">
            {TABS.map((t) => (
              <li key={t.key} className={tab === t.key ? "active" : ""}>
                <Link href={`/dashboard?tab=${t.key}`}>{t.label}</Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="dashboard-content">
          {tab !== "help" && (
            <div className="help-banner">
              <span>Need help with an order?</span>
              <a href="tel:7982475117">Call us: 7982475117</a>
            </div>
          )}

          {tab === "orders" && <OrdersTab />}
          {tab === "help" && (
            <div>
              <h5>LET US HELP YOU</h5>
              <ul className="help-query-list">
                <li><Link href="/info/faq?q=orders">Order Issues</Link></li>
                <li><Link href="/info/faq?q=returns">Returns &amp; Refunds</Link></li>
                <li><Link href="/info/faq?q=payments">Payments</Link></li>
                <li><Link href="/info/faq?q=coupons">Coupons &amp; Offers</Link></li>
              </ul>
            </div>
          )}
          {tab === "profile" && <ProfileTab />}
          {tab === "address" && <AddressBookTab />}
          {tab === "wishlist" && <WishlistTab />}
          {tab === "returns" && (
            <div>
              <p className="muted">Return within 5 days of delivery from your Orders tab, or read our policy below.</p>
              <Link href="/info/returns-policy" className="button">Return Policy</Link>
            </div>
          )}
          {tab === "wallet" && <WalletTab />}
          {tab === "points" && <PointsTab />}
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="container section">Loading...</main>}>
      <DashboardInner />
    </Suspense>
  );
}
