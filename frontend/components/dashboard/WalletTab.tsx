"use client";

import { useEffect, useState } from "react";
import { getWallet, type Wallet } from "@/lib/api";

export default function WalletTab() {
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    getWallet().then(setWallet).catch(() => undefined);
  }, []);

  if (!wallet) return <p className="muted">Loading wallet...</p>;

  return (
    <div>
      <div className="reward-balance-card">
        <span className="reward-label">Wallet Balance</span>
        <span className="reward-value">₹{Number(wallet.balance).toFixed(0)}</span>
      </div>
      {wallet.transactions.length === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>No wallet activity yet.</p>
      ) : (
        <div className="reward-tx-list">
          {wallet.transactions.map((tx) => (
            <div className="reward-tx-row" key={tx.id}>
              <div>
                <p className="reward-tx-label">{tx.label}</p>
                <p className="reward-tx-date">{new Date(tx.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <span className={Number(tx.amount) >= 0 ? "text-success" : "text-danger"}>
                {Number(tx.amount) >= 0 ? "+" : ""}₹{Number(tx.amount).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
