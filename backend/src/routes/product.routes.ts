import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { requireParam, zBoolean } from "../lib/params.js";

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

const sortOptions = ["popular", "new", "discount", "priceLow", "priceHigh"] as const;

const listQuerySchema = z.object({
  category: z.string().optional(),
  subCategory: z.string().optional(),
  search: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isFlashSale: zBoolean().optional(),
  sort: z.enum(sortOptions).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeInactive: zBoolean().default(false),
});

const sortOrderByFor: Record<(typeof sortOptions)[number], Prisma.ProductOrderByWithRelationInput> = {
  popular: { createdAt: "desc" },
  new: { createdAt: "desc" },
  discount: { actualPrice: "desc" },
  priceLow: { price: "asc" },
  priceHigh: { price: "desc" },
};

productRouter.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      category,
      subCategory,
      search,
      size,
      color,
      minPrice,
      maxPrice,
      isFlashSale,
      sort,
      page,
      limit,
      includeInactive,
    } = listQuerySchema.parse(req.query);
    const canSeeInactive = includeInactive && req.user?.role === "ADMIN";

    const where: Prisma.ProductWhereInput = {
      ...(canSeeInactive ? {} : { isActive: true }),
      ...(category ? { category: { slug: category } } : {}),
      ...(subCategory ? { subCategory: { slug: subCategory } } : {}),
      ...(search ? { name: { contains: search } } : {}),
      ...(size ? { sizes: { some: { size } } } : {}),
      ...(color ? { colorName: color } : {}),
      ...(isFlashSale ? { isFlashSale: true } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, subCategory: true, sizes: true, images: true },
        orderBy: sortOrderByFor[sort ?? "popular"],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  })
);

const filtersQuerySchema = z.object({ category: z.string().optional() });

productRouter.get(
  "/filters",
  asyncHandler(async (req, res) => {
    const { category } = filtersQuerySchema.parse(req.query);
    const where: Prisma.ProductWhereInput = { isActive: true, ...(category ? { category: { slug: category } } : {}) };

    const [sizes, colors, subCategories, priceAgg] = await Promise.all([
      prisma.productSize.findMany({
        where: { product: where },
        select: { size: true },
        distinct: ["size"],
      }),
      prisma.product.findMany({
        where: { ...where, colorName: { not: null } },
        select: { colorName: true, colorSwatchHex: true },
        distinct: ["colorName"],
      }),
      prisma.subCategory.findMany({
        where: category ? { category: { slug: category } } : {},
        select: { id: true, name: true, slug: true },
      }),
      prisma.product.aggregate({ where, _min: { price: true }, _max: { price: true } }),
    ]);

    return res.json({
      sizes: sizes.map((s) => s.size),
      colors: colors.map((c) => ({ name: c.colorName, hex: c.colorSwatchHex })),
      subCategories,
      priceRange: { min: priceAgg._min.price ?? 0, max: priceAgg._max.price ?? 0 },
    });
  })
);

productRouter.get(
  "/:idOrSlug",
  asyncHandler(async (req, res) => {
    const idOrSlug = requireParam(req.params.idOrSlug, "idOrSlug");
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }, { skuCode: idOrSlug }] },
      include: {
        category: true,
        subCategory: true,
        sizes: true,
        images: true,
        contentBlocks: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) throw new ApiError(404, "Product not found");

    const colorVariants = product.colorGroupId
      ? await prisma.product.findMany({
          where: { colorGroupId: product.colorGroupId, isActive: true },
          select: { id: true, slug: true, skuCode: true, colorName: true, colorSwatchHex: true, image: true },
          orderBy: { colorName: "asc" },
        })
      : [];

    return res.json({ ...product, colorVariants });
  })
);

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.coerce.number().positive(),
  actualPrice: z.coerce.number().positive().optional(),
  isFlashSale: zBoolean().default(false),
  isFastDelivery: zBoolean().default(false),
  colorGroupId: z.string().max(100).optional(),
  colorName: z.string().max(50).optional(),
  colorSwatchHex: z.string().max(20).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  categoryId: z.string().min(1),
  subCategoryId: z.string().optional(),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  isActive: zBoolean().default(true),
  sizes: z.string().optional(),
});

const productFiles = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "gallery", maxCount: 6 },
]);

function filesOf(req: import("express").Request, field: "image" | "gallery"): Express.Multer.File[] {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  return files?.[field] || [];
}

productRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  productFiles,
  asyncHandler(async (req, res) => {
    const data = createProductSchema.parse(req.body);
    const sizes = parseSizes(data.sizes);
    const coverImage = filesOf(req, "image")[0];
    if (!coverImage) throw new ApiError(400, "Product image is required");
    const galleryFiles = filesOf(req, "gallery");

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new ApiError(400, "Invalid category");
    if (data.subCategoryId) {
      const subCategory = await prisma.subCategory.findUnique({ where: { id: data.subCategoryId } });
      if (!subCategory || subCategory.categoryId !== data.categoryId) {
        throw new ApiError(400, "Invalid subcategory for the selected category");
      }
    }

    let slug = slugify(data.name);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    const stock = sizes.length > 0 ? sizes.reduce((sum, s) => sum + s.stock, 0) : data.stock;

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        skuCode: slug,
        description: data.description,
        price: data.price,
        actualPrice: data.actualPrice,
        isFlashSale: data.isFlashSale,
        isFastDelivery: data.isFastDelivery,
        colorGroupId: data.colorGroupId,
        colorName: data.colorName,
        colorSwatchHex: data.colorSwatchHex,
        stock,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        lowStockThreshold: data.lowStockThreshold,
        isActive: data.isActive,
        image: `/uploads/${coverImage.filename}`,
        ...(sizes.length > 0 ? { sizes: { create: sizes } } : {}),
        ...(galleryFiles.length > 0
          ? { images: { create: galleryFiles.map((f, i) => ({ url: `/uploads/${f.filename}`, sortOrder: i })) } }
          : {}),
      },
      include: { sizes: true, category: true, subCategory: true, images: true },
    });

    if (sizes.length === 0 && data.stock > 0) {
      await prisma.stockMovement.create({
        data: { productId: product.id, change: data.stock, reason: "Initial stock" },
      });
    }

    return res.status(201).json(product);
  })
);

// Not createProductSchema.partial() — see the comment on updateBannerSchema
// in banner.routes.ts. Every field that had a .default(...) on create is
// spelled out with plain .optional() here so an absent field means "leave
// it alone", not "reset to the create-time default".
const updateProductSchema = createProductSchema.partial().extend({
  isFlashSale: zBoolean().optional(),
  isFastDelivery: zBoolean().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  isActive: zBoolean().optional(),
});

productRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  productFiles,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const data = updateProductSchema.parse(req.body);
    const existing = await prisma.product.findUnique({ where: { id }, include: { sizes: true } });
    if (!existing) throw new ApiError(404, "Product not found");
    const coverImage = filesOf(req, "image")[0];
    const galleryFiles = filesOf(req, "gallery");

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new ApiError(400, "Invalid category");
    }
    if (data.subCategoryId) {
      const subCategory = await prisma.subCategory.findUnique({ where: { id: data.subCategoryId } });
      const categoryId = data.categoryId ?? existing.categoryId;
      if (!subCategory || subCategory.categoryId !== categoryId) {
        throw new ApiError(400, "Invalid subcategory for the selected category");
      }
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
        ...(data.actualPrice !== undefined ? { actualPrice: data.actualPrice } : {}),
        ...(data.isFlashSale !== undefined ? { isFlashSale: data.isFlashSale } : {}),
        ...(data.isFastDelivery !== undefined ? { isFastDelivery: data.isFastDelivery } : {}),
        ...(data.colorGroupId !== undefined ? { colorGroupId: data.colorGroupId } : {}),
        ...(data.colorName !== undefined ? { colorName: data.colorName } : {}),
        ...(data.colorSwatchHex !== undefined ? { colorSwatchHex: data.colorSwatchHex } : {}),
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data.subCategoryId !== undefined ? { subCategoryId: data.subCategoryId } : {}),
        ...(data.lowStockThreshold !== undefined ? { lowStockThreshold: data.lowStockThreshold } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(coverImage ? { image: `/uploads/${coverImage.filename}` } : {}),
        ...(stockOverride !== undefined ? { stock: stockOverride } : {}),
        ...(galleryFiles.length > 0
          ? { images: { create: galleryFiles.map((f, i) => ({ url: `/uploads/${f.filename}`, sortOrder: i })) } }
          : {}),
      },
      include: { sizes: true, category: true, subCategory: true, images: true },
    });

    return res.json(product);
  })
);

productRouter.delete(
  "/:id/images/:imageId",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const imageId = requireParam(req.params.imageId, "imageId");

    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== id) throw new ApiError(404, "Image not found");

    await prisma.productImage.delete({ where: { id: imageId } });
    return res.status(204).send();
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
