export type CurrencyCode = "INR" | "USD" | "GBP" | "SAR";

type CurrencyMeta = {
  code: CurrencyCode;
  country: string;
  symbol: string;
  locale: string;
  // 1 INR expressed in this currency. Static approximation for display
  // purposes only — the store's prices are stored in INR and Razorpay
  // always settles the actual charge in INR regardless of this rate.
  rateFromINR: number;
};

export const CURRENCIES: CurrencyMeta[] = [
  { code: "INR", country: "India", symbol: "₹", locale: "en-IN", rateFromINR: 1 },
  { code: "USD", country: "USA", symbol: "$", locale: "en-US", rateFromINR: 0.012 },
  { code: "GBP", country: "UK", symbol: "£", locale: "en-GB", rateFromINR: 0.0094 },
  { code: "SAR", country: "Saudi Arabia", symbol: "SAR", locale: "ar-SA", rateFromINR: 0.045 },
];

export function getCurrencyMeta(code: CurrencyCode): CurrencyMeta {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function convertFromINR(inrValue: string | number, code: CurrencyCode): number {
  return Number(inrValue) * getCurrencyMeta(code).rateFromINR;
}

export function formatCurrency(inrValue: string | number, code: CurrencyCode): string {
  const meta = getCurrencyMeta(code);
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    maximumFractionDigits: meta.code === "INR" ? 0 : 2,
  }).format(convertFromINR(inrValue, code));
}
