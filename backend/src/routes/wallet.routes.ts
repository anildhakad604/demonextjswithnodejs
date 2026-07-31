import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const walletRouter = Router();

walletRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const wallet = await prisma.wallet.upsert({
      where: { userId: req.user!.id },
      update: {},
      create: { userId: req.user!.id },
      include: { transactions: { orderBy: { createdAt: "desc" } } },
    });
    return res.json({ balance: wallet.balance, transactions: wallet.transactions });
  })
);
