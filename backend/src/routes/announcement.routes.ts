import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { requireParam } from "../lib/params.js";

export const announcementRouter = Router();

announcementRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const announcement = await prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(announcement);
  })
);

announcementRouter.get(
  "/admin",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
    return res.json(announcements);
  })
);

const createAnnouncementSchema = z.object({
  text: z.string().min(1).max(300),
  isActive: z.coerce.boolean().default(true),
});

announcementRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = createAnnouncementSchema.parse(req.body);
    // Only one announcement is ever shown (the most recent active one), so
    // activating a new one deactivates the rest rather than stacking them.
    if (data.isActive) {
      await prisma.announcement.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }
    const announcement = await prisma.announcement.create({ data });
    return res.status(201).json(announcement);
  })
);

const updateAnnouncementSchema = createAnnouncementSchema.partial();

announcementRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const data = updateAnnouncementSchema.parse(req.body);
    if (data.isActive) {
      await prisma.announcement.updateMany({ where: { isActive: true, NOT: { id } }, data: { isActive: false } });
    }
    const announcement = await prisma.announcement.update({ where: { id }, data }).catch(() => null);
    if (!announcement) throw new ApiError(404, "Announcement not found");
    return res.json(announcement);
  })
);

announcementRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    await prisma.announcement.delete({ where: { id } }).catch(() => {
      throw new ApiError(404, "Announcement not found");
    });
    return res.status(204).send();
  })
);
