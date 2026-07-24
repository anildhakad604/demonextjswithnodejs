import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { requireParam } from "../lib/params.js";

export const productRouter = Router();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const sizeInputSchema = z.array(
  z.object({ size: z.string().min(1).max(20), stock: z.coerce.number().int().min(0) })
);

function parseSizes(raw: unknown): { size: string; stock: number }[] {
  if (raw === undefined || raw === null || raw === "") return [];
  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new ApiError(400, "Invalid sizes payload");
  }
  const sizes = sizeInputSchema.parse(parsed);
  const labels = new Set(sizes.map((s) => s.size.toUpperCase()));
  if (labels.size !== sizes.length) throw new ApiError(400, "Duplicate size labels");
  return sizes;
}

const listQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeInactive: z.coerce.boolean().default(false),
});

productRouter.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { category, search, page, limit, includeInactive } = listQuerySchema.parse(req.query);
    const canSeeInactive = includeInactive && req.user?.role === "ADMIN";

    const where = {
      ...(canSeeInactive ? {} : { isActive: true }),
      ...(category ? { category: { slug: category } } : {}),
      ...(search ? { name: { contains: search } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, sizes: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  })
);

productRouter.get(
  "/:idOrSlug",
  asyncHandler(async (req, res) => {
    const idOrSlug = requireParam(req.params.idOrSlug, "idOrSlug");
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { category: true, sizes: true },
    });
    if (!product) throw new ApiError(404, "Product not found");
    return res.json(product);
  })
);

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0).default(0),
  categoryId: z.string().min(1),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  isActive: z.coerce.boolean().default(true),
  sizes: z.string().optional(),
});

productRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const data = createProductSchema.parse(req.body);
    const sizes = parseSizes(data.sizes);
    if (!req.file) throw new ApiError(400, "Product image is required");

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new ApiError(400, "Invalid category");

    let slug = slugify(data.name);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    const stock = sizes.length > 0 ? sizes.reduce((sum, s) => sum + s.stock, 0) : data.stock;

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        stock,
        categoryId: data.categoryId,
        lowStockThreshold: data.lowStockThreshold,
        isActive: data.isActive,
        image: `/uploads/${req.file.filename}`,
        ...(sizes.length > 0 ? { sizes: { create: sizes } } : {}),
      },
      include: { sizes: true, category: true },
    });

    if (sizes.length === 0 && data.stock > 0) {
      await prisma.stockMovement.create({
        data: { productId: product.id, change: data.stock, reason: "Initial stock" },
      });
    }

    return res.status(201).json(product);
  })
);

const updateProductSchema = createProductSchema.partial();

productRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const data = updateProductSchema.parse(req.body);
    const existing = await prisma.product.findUnique({ where: { id }, include: { sizes: true } });
    if (!existing) throw new ApiError(404, "Product not found");

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new ApiError(400, "Invalid category");
    }

    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = slugify(data.name);
      const clash = await prisma.product.findFirst({ where: { slug, NOT: { id: existing.id } } });
      if (clash) slug = `${slug}-${Date.now()}`;
    }

    const sizesProvided = data.sizes !== undefined;
    const sizes = sizesProvided ? parseSizes(data.sizes) : [];

    if (sizesProvided) {
      const incomingLabels = new Set(sizes.map((s) => s.size));
      const toRemove = existing.sizes.filter((s) => !incomingLabels.has(s.size));
      for (const removed of toRemove) {
        await prisma.productSize.delete({ where: { id: removed.id } }).catch(() => {
          throw new ApiError(
            409,
            `Cannot remove size "${removed.size}" because it has stock adjustment history. Set its stock to 0 instead.`
          );
        });
      }
      for (const s of sizes) {
        await prisma.productSize.upsert({
          where: { productId_size: { productId: id, size: s.size } },
          update: { stock: s.stock },
          create: { productId: id, size: s.size, stock: s.stock },
        });
      }
    }

    const stockOverride = sizesProvided
      ? sizes.reduce((sum, s) => sum + s.stock, 0)
      : data.stock !== undefined
        ? data.stock
        : undefined;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name, slug } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data.lowStockThreshold !== undefined ? { lowStockThreshold: data.lowStockThreshold } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(req.file ? { image: `/uploads/${req.file.filename}` } : {}),
        ...(stockOverride !== undefined ? { stock: stockOverride } : {}),
      },
      include: { sizes: true, category: true },
    });

    return res.json(product);
  })
);

productRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Product not found");

    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      throw new ApiError(409, "Cannot delete a product that appears in existing orders. Deactivate it instead.");
    }

    await prisma.product.delete({ where: { id } });
    return res.status(204).send();
  })
);

const adjustStockSchema = z.object({
  change: z.number().int().refine((n) => n !== 0, "change must not be zero"),
  reason: z.string().min(1).max(200),
});

productRouter.post(
  "/:id/stock",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const { change, reason } = adjustStockSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id }, include: { sizes: true } });
    if (!product) throw new ApiError(404, "Product not found");
    if (product.sizes.length > 0) {
      throw new ApiError(400, "This product is sold by size — adjust stock on a specific size instead.");
    }

    const newStock = product.stock + change;
    if (newStock < 0) throw new ApiError(400, "Stock cannot go below zero");

    const [updated] = await prisma.$transaction([
      prisma.product.update({ where: { id: product.id }, data: { stock: newStock } }),
      prisma.stockMovement.create({ data: { productId: product.id, change, reason } }),
    ]);

    return res.json(updated);
  })
);

productRouter.post(
  "/:id/sizes/:sizeId/stock",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const sizeId = requireParam(req.params.sizeId, "sizeId");
    const { change, reason } = adjustStockSchema.parse(req.body);

    const productSize = await prisma.productSize.findUnique({ where: { id: sizeId } });
    if (!productSize || productSize.productId !== id) throw new ApiError(404, "Size not found");

    const newStock = productSize.stock + change;
    if (newStock < 0) throw new ApiError(400, "Stock cannot go below zero");

    const [updatedSize] = await prisma.$transaction([
      prisma.productSize.update({ where: { id: sizeId }, data: { stock: newStock } }),
      prisma.stockMovement.create({ data: { productId: id, productSizeId: sizeId, change, reason } }),
      prisma.product.update({ where: { id }, data: { stock: { increment: change } } }),
    ]);

    return res.json(updatedSize);
  })
);
