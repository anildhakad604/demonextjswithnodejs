export const FLAT_SHIPPING_FEE = 49;
export const FREE_SHIPPING_THRESHOLD = 999;

export function computeShippingFee(amountAfterDiscount: number): number {
  return amountAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}
