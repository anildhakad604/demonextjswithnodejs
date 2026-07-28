"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import CurrencySwitcher from "@/components/CurrencySwitcher";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
      <div className="container nav">
        <Link className="brand" href="/">NovaShop</Link>
        <nav className="links">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/cart">Cart{count > 0 ? ` (${count})` : ""}</Link>
          {!loading && user && <Link href="/wishlist">Wishlist</Link>}
          {!loading && user && <Link href="/orders">Orders</Link>}
          {!loading && user?.role === "ADMIN" && <Link href="/admin">Admin</Link>}
          {!loading && !user && <Link href="/login">Login</Link>}
          {!loading && user && (
            <button className="link-button" onClick={handleLogout}>
              Logout ({user.name})
            </button>
          )}
          <CurrencySwitcher />
        </nav>
      </div>
    </header>
  );
}
