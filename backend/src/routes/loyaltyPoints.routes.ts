import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const loyaltyPointsRouter = Router();

loyaltyPointsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const points = await prisma.loyaltyPoints.upsert({
      where: { userId: req.user!.id },
      update: {},
      create: { userId: req.user!.id },
      include: { transactions: { orderBy: { createdAt: "desc" } } },
    });
    return res.json({ balance: points.balance, transactions: points.transactions });
  })
);
