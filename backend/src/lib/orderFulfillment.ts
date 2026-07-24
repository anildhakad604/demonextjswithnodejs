import { prisma } from "./prisma.js";

export type FulfillResult = "PAID" | "ALREADY_PAID" | "NOT_FOUND";

/**
 * Marks an order as paid, decrements stock, and records coupon usage.
 * Safe to call more than once for the same order (e.g. from both the
 * client-side verify-payment call and the async Razorpay webhook) —
 * the PAID status check makes it a no-op on repeat calls.
 */
export async function fulfillPaidOrder(
  orderId: string,
  payment: { paymentId: string; signature?: string }
): Promise<FulfillResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return "NOT_FOUND";
  if (order.status === "PAID") return "ALREADY_PAID";

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        razorpayPaymentId: payment.paymentId,
        ...(payment.signature ? { razorpaySignature: payment.signature } : {}),
      },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      if (item.size) {
        await tx.productSize.updateMany({
          where: { productId: item.productId, size: item.size },
          data: { stock: { decrement: item.quantity } },
        });
        const productSize = await tx.productSize.findFirst({
          where: { productId: item.productId, size: item.size },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            productSizeId: productSize?.id,
            change: -item.quantity,
            reason: `Order ${order.id}`,
          },
        });
      } else {
        await tx.stockMovement.create({
          data: { productId: item.productId, change: -item.quantity, reason: `Order ${order.id}` },
        });
      }
    }

    if (order.couponId) {
      await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
    }
  });

  return "PAID";
}
