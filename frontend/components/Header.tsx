"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { getAnnouncement, getCategories, resolveImage, type Announcement, type Category } from "@/lib/api";
import CurrencySwitcher from "@/components/CurrencySwitcher";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { items, subtotal, removeItem } = useCart();
  const { items: wishlistItems } = useWishlist();
  const router = useRouter();

  const [announcement, setAnnouncement] = useState<Announcement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getAnnouncement().then(setAnnouncement).catch(() => undefined);
    getCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-open", mobileNavOpen);
    return () => document.body.classList.remove("mobile-nav-open");
  }, [mobileNavOpen]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchTerm.trim();
    setSearchOpen(false);
    router.push(q ? `/listing?search=${encodeURIComponent(q)}` : "/listing");
  }

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      {announcement && (
        <div className="top-bar">
          {announcement.text}
        </div>
      )}

      <header className="site-header sticky-top">
        <div className="main-container">
          <div className="header-row">
            <button
              className={`menu-toggle ${mobileNavOpen ? "is-open" : ""}`}
              aria-label="Menu"
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>

            <Link href="/" className="logo">
              <Image src="/sweetynx/logo.png" alt="SweetyNX" width={160} height={53} priority />
            </Link>

            <div className="header-icons">
              <button className="header-icon-btn" aria-label="Search" onClick={() => setSearchOpen((v) => !v)}>
                <i className="bi bi-search" />
              </button>

              {!loading && (
                <Link href="/wishlist" className="header-icon-btn" aria-label="Wishlist">
                  <i className="bi bi-heart" />
                  {wishlistItems.length > 0 && <span className="icon-count">{wishlistItems.length}</span>}
                </Link>
              )}

              <span className="cart-parent">
                <Link href="/cart" className="header-icon-btn" aria-label="Cart">
                  <i className="bi bi-handbag" />
                  {cartCount > 0 && <span className="icon-count">{cartCount}</span>}
                </Link>
                <div className="cart-dropdown">
                  <div className="cart-dropdown-header">
                    <h4>Shopping Bag ({cartCount})</h4>
                  </div>
                  {items.length === 0 ? (
                    <div className="cart-dropdown-empty">You have no items in your shopping bag</div>
                  ) : (
                    <>
                      <div className="cart-dropdown-body">
                        {items.map((item) => (
                          <div className="cart-dropdown-item" key={`${item.productId}-${item.size ?? ""}`}>
                            <Image src={resolveImage(item.image)} alt={item.name} width={56} height={56} />
                            <div className="cart-dropdown-item-info">
                              <p className="title">{item.name}</p>
                              {item.size && <p className="meta">Size: {item.size}</p>}
                              <p className="meta">Qty: {item.quantity}</p>
                            </div>
                            <button
                              className="cart-dropdown-remove"
                              onClick={() => removeItem(item.productId, item.size)}
                              aria-label={`Remove ${item.name}`}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="cart-dropdown-footer">
                        <div className="cart-dropdown-total">
                          <span>Total</span>
                          <span>₹{subtotal.toFixed(0)}</span>
                        </div>
                        <Link href="/cart" className="view-bag-btn">VIEW BAG</Link>
                      </div>
                    </>
                  )}
                </div>
              </span>

              {!loading && user ? (
                <>
                  <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="header-icon-btn" aria-label="Account">
                    <i className="bi bi-person" />
                  </Link>
                  <button className="header-text-link" onClick={handleLogout}>Logout</button>
                </>
              ) : (
                !loading && <Link href="/login" className="header-text-link">Login</Link>
              )}

              <CurrencySwitcher />
            </div>
          </div>

          <nav className={`main-nav ${mobileNavOpen ? "is-open" : ""}`}>
            <Link href="/" onClick={() => setMobileNavOpen(false)}>Home</Link>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/listing/${cat.slug}`} onClick={() => setMobileNavOpen(false)}>
                {cat.name}
              </Link>
            ))}
            <Link href="/listing" onClick={() => setMobileNavOpen(false)}>All Products</Link>
            {!loading && user && (
              <Link href="/dashboard" onClick={() => setMobileNavOpen(false)}>My Account</Link>
            )}
          </nav>
        </div>

        {searchOpen && (
          <div className="search-overlay">
            <form className="search-overlay-inner" onSubmit={handleSearchSubmit}>
              <i className="bi bi-search" />
              <input
                autoFocus
                type="text"
                placeholder="Search for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="button" className="search-overlay-close" aria-label="Close" onClick={() => setSearchOpen(false)}>
                &times;
              </button>
            </form>
          </div>
        )}
      </header>

      {mobileNavOpen && <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />}
    </>
  );
}
