import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireParam } from "../lib/params.js";

export const wishlistRouter = Router();
wishlistRouter.use(requireAuth);

wishlistRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      include: { product: { include: { category: true, sizes: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(items);
  })
);

const addSchema = z.object({ productId: z.string().min(1) });

wishlistRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { productId } = addSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new ApiError(404, "Product not found");

    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user!.id, productId } },
      update: {},
      create: { userId: req.user!.id, productId },
      include: { product: { include: { category: true, sizes: true } } },
    });

    return res.status(201).json(item);
  })
);

wishlistRouter.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    const productId = requireParam(req.params.productId, "productId");
    await prisma.wishlistItem
      .delete({ where: { userId_productId: { userId: req.user!.id, productId } } })
      .catch(() => undefined);
    return res.status(204).send();
  })
);
