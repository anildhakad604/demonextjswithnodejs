import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { requireParam } from "../lib/params.js";

export const couponRouter = Router();

export function computeDiscount(
  coupon: { discountType: string; discountValue: Prisma.Decimal },
  subtotal: number
): number {
  const value = Number(coupon.discountValue);
  const raw = coupon.discountType === "PERCENTAGE" ? (subtotal * value) / 100 : value;
  return Math.min(raw, subtotal);
}

// Public — powers the PDP/cart "offer card" (Sweetynx's Model.Coupon).
// Only exposes what's safe to show pre-login: code + marketing copy, not
// usage counts or admin metadata.
couponRouter.get(
  "/active",
  asyncHandler(async (_req, res) => {
    const coupon = await prisma.coupon.findFirst({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        offerText: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!coupon) return res.json(null);
    return res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      offerText: coupon.offerText,
    });
  })
);

couponRouter.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return res.json(coupons);
  })
);

const createCouponSchema = z.object({
  code: z.string().min(3).max(30).transform((s) => s.toUpperCase()),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().positive(),
  minOrderValue: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().positive().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.coerce.boolean().optional(),
  /// Marketing line shown on the PDP offer card (Sweetynx's OfferText).
  offerText: z.string().max(200).optional(),
});

couponRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = createCouponSchema.parse(req.body);
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) throw new ApiError(409, "Coupon code already exists");

    const coupon = await prisma.coupon.create({ data });
    return res.status(201).json(coupon);
  })
);

// Not createCouponSchema.partial() directly — .partial() keeps .default(0)
// active for minOrderValue, so any partial update omitting it (e.g. the
// admin "Enable/Disable" toggle, which only sends isActive) would silently
// reset minOrderValue back to 0. See the same fix in banner.routes.ts.
const updateCouponSchema = createCouponSchema.partial().extend({
  minOrderValue: z.coerce.number().min(0).optional(),
});

couponRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const data = updateCouponSchema.parse(req.body);
    const coupon = await prisma.coupon
      .update({ where: { id }, data })
      .catch(() => null);
    if (!coupon) throw new ApiError(404, "Coupon not found");
    return res.json(coupon);
  })
);

couponRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    await prisma.coupon.delete({ where: { id } }).catch(() => {
      throw new ApiError(404, "Coupon not found");
    });
    return res.status(204).send();
  })
);

const validateCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.coerce.number().positive(),
});

couponRouter.post(
  "/validate",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { code, subtotal } = validateCouponSchema.parse(req.body);

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) throw new ApiError(404, "Invalid coupon code");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, "Coupon has expired");
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new ApiError(400, "Coupon usage limit reached");
    if (subtotal < Number(coupon.minOrderValue)) {
      throw new ApiError(400, `Minimum order value is ₹${coupon.minOrderValue}`);
    }

    const discount = computeDiscount(coupon, subtotal);
    return res.json({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      total: subtotal - discount,
    });
  })
);
