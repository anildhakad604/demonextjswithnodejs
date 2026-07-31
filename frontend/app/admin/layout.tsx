"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  DashboardIcon,
  ProductsIcon,
  CategoriesIcon,
  CouponsIcon,
  OrdersIcon,
  ReviewsIcon,
  StoreLinkIcon,
  BagIcon,
  AlertIcon,
} from "@/components/admin/icons";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon, exact: true },
  { href: "/admin/products", label: "Products", icon: ProductsIcon },
  { href: "/admin/categories", label: "Categories", icon: CategoriesIcon },
  { href: "/admin/banners", label: "Banners", icon: BagIcon },
  { href: "/admin/announcements", label: "Announcements", icon: AlertIcon },
  { href: "/admin/coupons", label: "Coupons", icon: CouponsIcon },
  { href: "/admin/orders", label: "Orders", icon: OrdersIcon },
  { href: "/admin/reviews", label: "Reviews", icon: ReviewsIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) router.push("/admin-login?next=/admin");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return <main className="container section">Loading...</main>;
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">S</span>
          SweetyNX Admin
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={isActive ? "active" : ""}>
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="admin-store-link">
          <StoreLinkIcon />
          View Store
        </Link>
        <div className="admin-user">
          <span className="avatar">{initial}</span>
          <span>
            <span className="name">{user.name}</span>
            <span className="role">Administrator</span>
          </span>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
