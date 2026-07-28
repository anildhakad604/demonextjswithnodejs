"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div className="footer-brand">NovaShop</div>
          <p className="footer-tagline">Modern essentials for everyday living.</p>
        </div>
        <nav className="footer-links">
          <Link href="/products">Products</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/wishlist">Wishlist</Link>
        </nav>
        <p className="footer-copy">&copy; {new Date().getFullYear()} NovaShop. All rights reserved.</p>
      </div>
    </footer>
  );
}
