"use client";

import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      className="currency-switcher"
      aria-label="Currency"
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.country}
        </option>
      ))}
    </select>
  );
}
