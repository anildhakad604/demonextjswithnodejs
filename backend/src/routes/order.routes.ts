import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { razorpay, verifyPaymentSignature } from "../lib/razorpay.js";
import { computeDiscount } from "./coupon.routes.js";
import { requireParam } from "../lib/params.js";
import { computeShippingFee } from "../lib/shipping.js";
import { fulfillPaidOrder } from "../lib/orderFulfillment.js";
import { orderLimiter } from "../middleware/rateLimit.js";

export const orderRouter = Router();
orderRouter.use(requireAuth);

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        size: z.string().optional(),
      })
    )
    .min(1),
  addressId: z.string().min(1),
  couponCode: z.string().optional(),
});

orderRouter.post(
  "/",
  orderLimiter,
  asyncHandler(async (req, res) => {
    const { items, addressId, couponCode } = createOrderSchema.parse(req.body);
    const userId = req.user!.id;

    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) throw new ApiError(400, "Invalid address");

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { sizes: true },
    });

    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.isActive) {
        throw new ApiError(400, `Product ${item.productId} is unavailable`, { productId: item.productId });
      }

      if (product.sizes.length > 0) {
        if (!item.size) throw new ApiError(400, `Please select a size for ${product.name}`, { productId: item.productId });
        const productSize = product.sizes.find((s) => s.size === item.size);
        if (!productSize) throw new ApiError(400, `Invalid size for ${product.name}`, { productId: item.productId, size: item.size });
        if (productSize.stock < item.quantity) {
          throw new ApiError(400, `Insufficient stock for ${product.name} (size ${item.size})`, {
            productId: item.productId,
            size: item.size,
          });
        }
      } else if (product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for ${product.name}`, { productId: item.productId });
      }

      const price = Number(product.price);
      subtotal += price * item.quantity;
      return {
        productId: product.id,
        name: product.name,
        size: product.sizes.length > 0 ? item.size : null,
        price,
        quantity: item.quantity,
      };
    });

    let discount = 0;
    let couponId: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (!coupon || !coupon.isActive) throw new ApiError(400, "Invalid coupon code");
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, "Coupon has expired");
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new ApiError(400, "Coupon usage limit reached");
      if (subtotal < Number(coupon.minOrderValue)) throw new ApiError(400, "Order does not meet coupon minimum");
      discount = computeDiscount(coupon, subtotal);
      couponId = coupon.id;
    }

    const shippingFee = computeShippingFee(subtotal - discount);
    const total = subtotal - discount + shippingFee;

    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        subtotal,
        discount,
        shippingFee,
        total,
        couponId,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: order.id,
      });
    } catch (err) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      console.error("Razorpay order creation failed:", err);
      throw new ApiError(502, "Unable to initiate payment. Please try again shortly.");
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return res.status(201).json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  })
);

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

orderRouter.post(
  "/:id/verify-payment",
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifyPaymentSchema.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== req.user!.id) throw new ApiError(404, "Order not found");
    if (order.status === "PAID") return res.json({ status: "PAID" });
    if (order.razorpayOrderId !== razorpay_order_id) throw new ApiError(400, "Order mismatch");

    const valid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!valid) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      throw new ApiError(400, "Payment verification failed");
    }

    await fulfillPaidOrder(order.id, { paymentId: razorpay_payment_id, signature: razorpay_signature });
    return res.json({ status: "PAID" });
  })
);

orderRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { items: true, address: true, coupon: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(orders);
  })
);

orderRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, address: true, coupon: true },
    });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new ApiError(403, "Not allowed to view this order");
    }
    return res.json(order);
  })
);

orderRouter.post(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== req.user!.id) throw new ApiError(404, "Order not found");
    // Only PENDING (unpaid) orders can be self-cancelled — once paid, stock
    // has been decremented and coupon usage recorded, so that path goes
    // through admin cancellation instead, which reverses both.
    if (order.status !== "PENDING") {
      throw new ApiError(400, "Only orders awaiting payment can be cancelled here");
    }
    const updated = await prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
    return res.json(updated);
  })
);
