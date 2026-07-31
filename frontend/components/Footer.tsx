"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) return null;

  return (
    <footer className="footer">
      <div className="main-container">
        <div className="footer-grid">
          <div className="footer-col">
            <h6 className="footer-title">ABOUT</h6>
            <ul className="footer-links">
              <li><Link href="/info/terms-conditions">Terms &amp; Conditions</Link></li>
              <li><Link href="/info/contact-us">Contact Us</Link></li>
            </ul>
            <h6 className="footer-title mt">FOLLOW US</h6>
            <div className="social-icons">
              <a href="#" aria-label="Facebook"><i className="bi bi-facebook" /></a>
              <a href="#" aria-label="Instagram"><i className="bi bi-instagram" /></a>
              <a href="#" aria-label="Twitter"><i className="bi bi-twitter" /></a>
            </div>
          </div>

          <div className="footer-col">
            <h6 className="footer-title">CUSTOMER SERVICE</h6>
            <ul className="footer-links">
              <li><Link href="/info/returns-policy">Returns Policy</Link></li>
              <li><Link href="/info/shipping-information">Shipping Information</Link></li>
              <li><Link href="/info/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/info/faq">FAQs</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h6 className="footer-title">QUICK LINKS</h6>
            <ul className="footer-links">
              <li><Link href="/listing">Shop All</Link></li>
              <li><Link href="/cart">Cart</Link></li>
              <li><Link href="/wishlist">Wishlist</Link></li>
              <li><Link href="/orders">Orders</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h6 className="footer-title">RETURNS</h6>
            <p className="footer-text">Return within 5 days of delivery.</p>
            <h6 className="footer-title mt">SECURE SHOPPING</h6>
            <p className="footer-text">100% secure checkout, every order.</p>
          </div>
        </div>

        <div className="footer-bottom">
          COPYRIGHTS &copy; {new Date().getFullYear()} SWEETYNX. ALL RIGHTS RESERVED
        </div>
      </div>
    </footer>
  );
}
