"use client";

import { useEffect, useState } from "react";
import {
  ApiRequestError,
  createCoupon,
  deleteCoupon,
  getAdminCoupons,
  updateCoupon,
  type Coupon,
} from "@/lib/api";
import { formatINR } from "@/lib/format";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrderValue, setMinOrderValue] = useState("0");
  const [error, setError] = useState<string | null>(null);

  function load() {
    getAdminCoupons().then(setCoupons);
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createCoupon({
        code,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue),
      });
      setCode("");
      setDiscountValue("10");
      setMinOrderValue("0");
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to create coupon");
    }
  }

  async function toggleActive(coupon: Coupon) {
    await updateCoupon(coupon.id, { isActive: !coupon.isActive });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await deleteCoupon(id);
    load();
  }

  return (
    <>
      <h1>Coupons</h1>
      <form className="form" onSubmit={handleCreate} style={{ marginBottom: 24 }}>
        {error && <p className="error-text">{error}</p>}
        <div className="field">
          <label>Code</label>
          <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Type</label>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </select>
          </div>
          <div className="field">
            <label>Value</label>
            <input required type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Minimum order value (₹)</label>
          <input type="number" min={0} value={minOrderValue} onChange={(e) => setMinOrderValue(e.target.value)} />
        </div>
        <button className="button" type="submit">Add coupon</button>
      </form>
      <table className="table">
        <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {coupons.map((coupon) => (
            <tr key={coupon.id}>
              <td>{coupon.code}</td>
              <td>{coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : formatINR(coupon.discountValue)}</td>
              <td>{formatINR(coupon.minOrderValue)}</td>
              <td>{coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ""}</td>
              <td>{coupon.isActive ? "Yes" : "No"}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button className="button button-secondary button-sm" onClick={() => toggleActive(coupon)}>
                  {coupon.isActive ? "Disable" : "Enable"}
                </button>
                <button className="button button-danger button-sm" onClick={() => handleDelete(coupon.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
