"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import { HeartIcon } from "@/components/admin/icons";

export default function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const router = useRouter();
  const active = isWishlisted(productId);
  const [popping, setPopping] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    toggle(productId);
    setPopping(true);
    setTimeout(() => setPopping(false), 400);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={`wishlist-btn ${active ? "active" : ""} ${popping ? "pop" : ""} ${className || ""}`}
    >
      <HeartIcon filled={active} />
    </button>
  );
}