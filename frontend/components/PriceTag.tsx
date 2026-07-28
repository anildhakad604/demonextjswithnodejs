"use client";

import { useCurrency } from "@/lib/currency-context";

export default function PriceTag({ value, className }: { value: string | number; className?: string }) {
  const { format } = useCurrency();
  return <span className={className}>{format(value)}</span>;
}
