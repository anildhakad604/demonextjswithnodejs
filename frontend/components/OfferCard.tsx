"use client";

import { useEffect, useState } from "react";
import { getActiveCoupon, type ActiveCoupon } from "@/lib/api";

export default function OfferCard() {
  const [coupon, setCoupon] = useState<ActiveCoupon>(null);

  useEffect(() => {
    getActiveCoupon().then(setCoupon).catch(() => undefined);
  }, []);

  if (!coupon) return null;

  const detail =
    coupon.discountType === "PERCENTAGE"
      ? `${Number(coupon.discountValue)}% off`
      : `₹${Number(coupon.discountValue)} off`;

  return (
    <div className="offer-card">
      <span className="offer-left-bar">Offers</span>
      <div className="offer-text">
        <p className="offer-heading">{coupon.offerText}</p>
        <p className="offer-detail">{detail} — use code</p>
        <span className="offer-code">{coupon.code}</span>
      </div>
    </div>
  );
}
