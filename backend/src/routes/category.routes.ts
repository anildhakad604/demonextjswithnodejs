import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { requireParam } from "../lib/params.js";

export const categoryRouter = Router();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

categoryRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return res.json(categories);
  })
);

const createCategorySchema = z.object({ name: z.string().min(1).max(100) });

categoryRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name } = createCategorySchema.parse(req.body);
    const slug = slugify(name);

    const existing = await prisma.category.findFirst({ where: { OR: [{ name }, { slug }] } });
    if (existing) throw new ApiError(409, "Category already exists");

    const category = await prisma.category.create({ data: { name, slug } });
    return res.status(201).json(category);
  })
);

categoryRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const { name } = createCategorySchema.parse(req.body);
    const slug = slugify(name);
    const category = await prisma.category
      .update({ where: { id }, data: { name, slug } })
      .catch(() => null);
    if (!category) throw new ApiError(404, "Category not found");
    return res.json(category);
  })
);

categoryRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new ApiError(400, "Cannot delete a category that still has products");
    }
    await prisma.category.delete({ where: { id } }).catch(() => {
      throw new ApiError(404, "Category not found");
    });
    return res.status(204).send();
  })
);
