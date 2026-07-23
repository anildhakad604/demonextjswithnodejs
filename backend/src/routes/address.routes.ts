import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireParam } from "../lib/params.js";

export const addressRouter = Router();
addressRouter.use(requireAuth);

addressRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { isDefault: "desc" },
    });
    return res.json(addresses);
  })
);

const addressSchema = z.object({
  fullName: z.string().min(1).max(150),
  phone: z.string().min(6).max(20),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100).default("India"),
  isDefault: z.boolean().default(false),
});

addressRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = addressSchema.parse(req.body);
    const userId = req.user!.id;

    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({ data: { ...data, userId } });
    return res.status(201).json(address);
  })
);

addressRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== req.user!.id) throw new ApiError(404, "Address not found");
    await prisma.address.delete({ where: { id } });
    return res.status(204).send();
  })
);
