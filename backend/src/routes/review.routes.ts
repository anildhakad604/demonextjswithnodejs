import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { requireParam } from "../lib/params.js";
import { upload } from "../middleware/upload.js";

export const reviewRouter = Router();

reviewRouter.get(
  "/products/:productId/reviews",
  asyncHandler(async (req, res) => {
    const productId = requireParam(req.params.productId, "productId");

    const [reviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { productId, isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.aggregate({
        where: { productId, isApproved: true },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return res.json({
      items: reviews,
      averageRating: aggregate._avg.rating ?? 0,
      count: aggregate._count,
    });
  })
);

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

reviewRouter.post(
  "/products/:productId/reviews",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const productId = requireParam(req.params.productId, "productId");
    const { rating, comment } = reviewSchema.parse(req.body);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new ApiError(404, "Product not found");

    const review = await prisma.review.upsert({
      where: { productId_userId: { productId, userId: req.user!.id } },
      update: { rating, comment, ...(imageUrl ? { imageUrl } : {}) },
      create: { productId, userId: req.user!.id, rating, comment, imageUrl },
      include: { user: { select: { name: true } } },
    });

    return res.status(201).json(review);
  })
);

reviewRouter.get(
  "/products/:productId/reviews/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = requireParam(req.params.productId, "productId");
    const review = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId: req.user!.id } },
    });
    return res.json(review);
  })
);

reviewRouter.delete(
  "/products/:productId/reviews/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = requireParam(req.params.productId, "productId");
    await prisma.review
      .delete({ where: { productId_userId: { productId, userId: req.user!.id } } })
      .catch(() => {
        throw new ApiError(404, "Review not found");
      });
    return res.status(204).send();
  })
);

// Admin moderation
reviewRouter.get(
  "/admin/reviews",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(reviews);
  })
);

const moderateSchema = z.object({ isApproved: z.boolean() });

reviewRouter.patch(
  "/admin/reviews/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const { isApproved } = moderateSchema.parse(req.body);
    const review = await prisma.review.update({ where: { id }, data: { isApproved } }).catch(() => {
      throw new ApiError(404, "Review not found");
    });
    return res.json(review);
  })
);

reviewRouter.delete(
  "/admin/reviews/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    await prisma.review.delete({ where: { id } }).catch(() => {
      throw new ApiError(404, "Review not found");
    });
    return res.status(204).send();
  })
);

