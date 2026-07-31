"use client";

import { useEffect, useState } from "react";
import { getLoyaltyPoints, type LoyaltyPoints } from "@/lib/api";

export default function PointsTab() {
  const [points, setPoints] = useState<LoyaltyPoints | null>(null);

  useEffect(() => {
    getLoyaltyPoints().then(setPoints).catch(() => undefined);
  }, []);

  if (!points) return <p className="muted">Loading Sweety Points...</p>;

  return (
    <div>
      <div className="reward-balance-card">
        <span className="reward-label">Sweety Points Balance</span>
        <span className="reward-value">{points.balance} pts</span>
      </div>
      <p className="muted" style={{ margin: "10px 0 16px" }}>Earn 1 point for every ₹100 spent — redeemable on future orders.</p>
      {points.transactions.length === 0 ? (
        <p className="muted">No points activity yet.</p>
      ) : (
        <div className="reward-tx-list">
          {points.transactions.map((tx) => (
            <div className="reward-tx-row" key={tx.id}>
              <div>
                <p className="reward-tx-label">{tx.label}</p>
                <p className="reward-tx-date">{new Date(tx.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <span className={tx.points >= 0 ? "text-success" : "text-danger"}>
                {tx.points >= 0 ? "+" : ""}{tx.points} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
