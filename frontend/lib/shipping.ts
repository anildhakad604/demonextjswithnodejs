// Mirrors backend/src/lib/shipping.ts — used only for instant checkout-page
// display before the order is placed. The server remains the source of truth
// for the amount actually charged.
export const FLAT_SHIPPING_FEE = 49;
export const FREE_SHIPPING_THRESHOLD = 999;

export function computeShippingFee(amountAfterDiscount: number): number {
  return amountAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}
