import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { requireParam } from "../lib/params.js";

export const subCategoryRouter = Router();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const createSubCategorySchema = z.object({
  name: z.string().min(1).max(100),
  categoryId: z.string().min(1),
});

subCategoryRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, categoryId } = createSubCategorySchema.parse(req.body);
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new ApiError(400, "Invalid category");

    const slug = slugify(name);
    const existing = await prisma.subCategory.findUnique({ where: { categoryId_slug: { categoryId, slug } } });
    if (existing) throw new ApiError(409, "Subcategory already exists for this category");

    const subCategory = await prisma.subCategory.create({ data: { name, slug, categoryId } });
    return res.status(201).json(subCategory);
  })
);

const updateSubCategorySchema = z.object({ name: z.string().min(1).max(100) });

subCategoryRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const { name } = updateSubCategorySchema.parse(req.body);
    const existing = await prisma.subCategory.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Subcategory not found");

    const slug = slugify(name);
    const clash = await prisma.subCategory.findFirst({
      where: { categoryId: existing.categoryId, slug, NOT: { id } },
    });
    if (clash) throw new ApiError(409, "Subcategory already exists for this category");

    const subCategory = await prisma.subCategory.update({ where: { id }, data: { name, slug } });
    return res.json(subCategory);
  })
);

subCategoryRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const productCount = await prisma.product.count({ where: { subCategoryId: id } });
    if (productCount > 0) {
      throw new ApiError(400, "Cannot delete a subcategory that still has products");
    }
    await prisma.subCategory.delete({ where: { id } }).catch(() => {
      throw new ApiError(404, "Subcategory not found");
    });
    return res.status(204).send();
  })
);
