import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { requireParam } from "../lib/params.js";
import { upload } from "../middleware/upload.js";

export const bannerRouter = Router();

const BANNER_TYPES = ["HERO", "MID", "BIG_CATEGORY", "CATEGORY_CARD", "CELEB", "FASHION_VIDEO"] as const;

const listQuerySchema = z.object({ type: z.enum(BANNER_TYPES).optional() });

bannerRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { type } = listQuerySchema.parse(req.query);
    const banners = await prisma.banner.findMany({
      where: { isActive: true, ...(type ? { type } : {}) },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    });
    return res.json(banners);
  })
);

bannerRouter.get(
  "/admin",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const banners = await prisma.banner.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }] });
    return res.json(banners);
  })
);

const createBannerSchema = z.object({
  type: z.enum(BANNER_TYPES),
  linkUrl: z.string().max(300).optional(),
  title: z.string().max(150).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

bannerRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const data = createBannerSchema.parse(req.body);
    if (!req.file) throw new ApiError(400, "Banner image is required");

    const banner = await prisma.banner.create({
      data: { ...data, imageUrl: `/uploads/${req.file.filename}` },
    });
    return res.status(201).json(banner);
  })
);

const updateBannerSchema = createBannerSchema.partial();

bannerRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const data = updateBannerSchema.parse(req.body);
    const banner = await prisma.banner
      .update({
        where: { id },
        data: { ...data, ...(req.file ? { imageUrl: `/uploads/${req.file.filename}` } : {}) },
      })
      .catch(() => null);
    if (!banner) throw new ApiError(404, "Banner not found");
    return res.json(banner);
  })
);

bannerRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    await prisma.banner.delete({ where: { id } }).catch(() => {
      throw new ApiError(404, "Banner not found");
    });
    return res.status(204).send();
  })
);
