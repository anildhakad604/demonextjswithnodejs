import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { requireParam } from "../lib/params.js";

export const contentBlockRouter = Router();

const BLOCK_TYPES = ["HEADING_TEXT", "IMAGE_TEXT", "FEATURE_GRID", "FULL_IMAGE"] as const;
type BlockType = (typeof BLOCK_TYPES)[number];

const featureItemSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
});

function parseFeatureItems(raw: unknown): { title: string; body: string }[] {
  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new ApiError(400, "Invalid items payload");
  }
  const items = z.array(featureItemSchema).min(2).max(6).parse(parsed);
  return items;
}

// Builds the type-specific `data` JSON from raw multipart fields, validating
// the fields required for that block type. `existingData`/`existingImage`
// are used on update when a field (e.g. a replacement image) isn't resent.
function buildBlockData(
  type: BlockType,
  body: Record<string, unknown>,
  imageFile: Express.Multer.File | undefined,
  existing: Record<string, unknown> | undefined
): Record<string, unknown> {
  switch (type) {
    case "HEADING_TEXT": {
      const title = String(body.title ?? existing?.title ?? "").trim();
      const text = String(body.body ?? existing?.body ?? "").trim();
      if (!title) throw new ApiError(400, "Title is required for a heading + text block");
      if (!text) throw new ApiError(400, "Body text is required for a heading + text block");
      return { title, body: text };
    }
    case "IMAGE_TEXT": {
      const title = String(body.title ?? existing?.title ?? "").trim();
      const text = String(body.body ?? existing?.body ?? "").trim();
      const layoutRaw = String(body.layout ?? existing?.layout ?? "image-left");
      const layout = layoutRaw === "image-right" ? "image-right" : "image-left";
      const image = imageFile ? `/uploads/${imageFile.filename}` : (existing?.image as string | undefined);
      if (!title) throw new ApiError(400, "Title is required for an image + text block");
      if (!text) throw new ApiError(400, "Body text is required for an image + text block");
      if (!image) throw new ApiError(400, "Image is required for an image + text block");
      return { title, body: text, layout, image };
    }
    case "FEATURE_GRID": {
      const title = body.title !== undefined ? String(body.title).trim() : (existing?.title as string | undefined);
      const items = body.items !== undefined ? parseFeatureItems(body.items) : existing?.items;
      if (!items) throw new ApiError(400, "At least two feature items are required for a feature grid block");
      return { ...(title ? { title } : {}), items };
    }
    case "FULL_IMAGE": {
      const caption = body.caption !== undefined ? String(body.caption).trim() : (existing?.caption as string | undefined);
      const image = imageFile ? `/uploads/${imageFile.filename}` : (existing?.image as string | undefined);
      if (!image) throw new ApiError(400, "Image is required for a full-width image block");
      return { ...(caption ? { caption } : {}), image };
    }
  }
}

const blockImageUpload = upload.fields([{ name: "image", maxCount: 1 }]);

function imageOf(req: import("express").Request): Express.Multer.File | undefined {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  return files?.image?.[0];
}

const createBlockSchema = z.object({
  type: z.enum(BLOCK_TYPES),
});

contentBlockRouter.post(
  "/products/:productId/content-blocks",
  requireAuth,
  requireAdmin,
  blockImageUpload,
  asyncHandler(async (req, res) => {
    const productId = requireParam(req.params.productId, "productId");
    const { type } = createBlockSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new ApiError(404, "Product not found");

    const data = buildBlockData(type, req.body, imageOf(req), undefined);
    const maxSortOrder = await prisma.productContentBlock.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });

    const block = await prisma.productContentBlock.create({
      data: {
        productId,
        type,
        data: data as Prisma.InputJsonValue,
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
      },
    });
    return res.status(201).json(block);
  })
);

const updateBlockSchema = z.object({
  type: z.enum(BLOCK_TYPES).optional(),
});

contentBlockRouter.put(
  "/products/:productId/content-blocks/reorder",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const productId = requireParam(req.params.productId, "productId");
    const { order } = z.object({ order: z.array(z.string().min(1)) }).parse(req.body);

    const blocks = await prisma.productContentBlock.findMany({ where: { productId } });
    const blockIds = new Set(blocks.map((b) => b.id));
    if (order.length !== blocks.length || !order.every((id) => blockIds.has(id))) {
      throw new ApiError(400, "Order must contain exactly the current block ids");
    }

    await prisma.$transaction(
      order.map((id, index) => prisma.productContentBlock.update({ where: { id }, data: { sortOrder: index } }))
    );
    return res.status(204).send();
  })
);

contentBlockRouter.put(
  "/products/:productId/content-blocks/:blockId",
  requireAuth,
  requireAdmin,
  blockImageUpload,
  asyncHandler(async (req, res) => {
    const productId = requireParam(req.params.productId, "productId");
    const blockId = requireParam(req.params.blockId, "blockId");
    const { type } = updateBlockSchema.parse(req.body);

    const existing = await prisma.productContentBlock.findUnique({ where: { id: blockId } });
    if (!existing || existing.productId !== productId) throw new ApiError(404, "Content block not found");

    const effectiveType = (type ?? existing.type) as BlockType;
    const existingData = effectiveType === existing.type ? (existing.data as Record<string, unknown>) : undefined;
    const data = buildBlockData(effectiveType, req.body, imageOf(req), existingData);

    const block = await prisma.productContentBlock.update({
      where: { id: blockId },
      data: { type: effectiveType, data: data as Prisma.InputJsonValue },
    });
    return res.json(block);
  })
);

contentBlockRouter.delete(
  "/products/:productId/content-blocks/:blockId",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const productId = requireParam(req.params.productId, "productId");
    const blockId = requireParam(req.params.blockId, "blockId");

    const existing = await prisma.productContentBlock.findUnique({ where: { id: blockId } });
    if (!existing || existing.productId !== productId) throw new ApiError(404, "Content block not found");

    await prisma.productContentBlock.delete({ where: { id: blockId } });
    return res.status(204).send();
  })
);
