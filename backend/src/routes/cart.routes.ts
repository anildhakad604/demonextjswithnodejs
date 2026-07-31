import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireParam } from "../lib/params.js";

export const cartRouter = Router();

const cartInclude = {
  items: {
    include: { product: { include: { sizes: true } } },
  },
} as const;

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId }, include: cartInclude });
}

function serializeCart(cart: NonNullable<Awaited<ReturnType<typeof getOrCreateCart>>>) {
  const items = cart.items.map((item) => {
    const stockCap =
      item.product.sizes.length > 0
        ? item.product.sizes.find((s) => s.size === item.size)?.stock ?? 0
        : item.product.stock;
    return {
      id: item.id,
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
      name: item.product.name,
      slug: item.product.slug,
      skuCode: item.product.skuCode,
      price: item.product.price.toString(),
      actualPrice: item.product.actualPrice?.toString() ?? null,
      image: item.product.image,
      stock: stockCap,
      availableSizes: item.product.sizes.map((s) => s.size),
    };
  });
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  return { items, count, subtotal };
}

cartRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.user!.id);
    return res.json(serializeCart(cart));
  })
);

const addItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().max(20).optional(),
  quantity: z.coerce.number().int().min(1).default(1),
});

cartRouter.post(
  "/items",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { productId, size, quantity } = addItemSchema.parse(req.body);
    const effectiveSize = size || null;

    const product = await prisma.product.findUnique({ where: { id: productId }, include: { sizes: true } });
    if (!product || !product.isActive) throw new ApiError(404, "Product not found");

    const stockCap =
      product.sizes.length > 0
        ? product.sizes.find((s) => s.size === effectiveSize)?.stock ?? 0
        : product.stock;
    if (stockCap <= 0) {
      throw new ApiError(409, "This item is out of stock", { productId, size: effectiveSize ?? undefined });
    }

    const cart = await getOrCreateCart(req.user!.id);
    const existing = cart.items.find((i) => i.productId === productId && i.size === effectiveSize);

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + quantity, stockCap) },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, size: effectiveSize, quantity: Math.min(quantity, stockCap) },
      });
    }

    const updated = await getOrCreateCart(req.user!.id);
    return res.status(201).json(serializeCart(updated));
  })
);

const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).optional(),
  size: z.string().max(20).optional(),
});

cartRouter.patch(
  "/items/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const { quantity, size } = updateItemSchema.parse(req.body);

    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true, product: { include: { sizes: true } } },
    });
    if (!item || item.cart.userId !== req.user!.id) throw new ApiError(404, "Cart item not found");

    const nextSize = size !== undefined ? size : item.size;
    const stockCap =
      item.product.sizes.length > 0
        ? item.product.sizes.find((s) => s.size === nextSize)?.stock ?? 0
        : item.product.stock;
    const nextQuantity = quantity ?? item.quantity;
    if (nextQuantity > stockCap) {
      throw new ApiError(409, "Not enough stock available", {
        productId: item.productId,
        size: nextSize ?? undefined,
      });
    }

    // Changing size can collide with another existing line for the same
    // product+size — merge quantities into that line instead of erroring.
    if (size !== undefined && size !== item.size) {
      const collision = await prisma.cartItem.findFirst({
        where: { cartId: item.cartId, productId: item.productId, size, NOT: { id: item.id } },
      });
      if (collision) {
        await prisma.cartItem.update({
          where: { id: collision.id },
          data: { quantity: Math.min(collision.quantity + nextQuantity, stockCap) },
        });
        await prisma.cartItem.delete({ where: { id: item.id } });
        const updated = await getOrCreateCart(req.user!.id);
        return res.json(serializeCart(updated));
      }
    }

    await prisma.cartItem.update({ where: { id }, data: { quantity: nextQuantity, size: nextSize } });
    const updated = await getOrCreateCart(req.user!.id);
    return res.json(serializeCart(updated));
  })
);

cartRouter.delete(
  "/items/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const item = await prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });
    if (!item || item.cart.userId !== req.user!.id) throw new ApiError(404, "Cart item not found");

    await prisma.cartItem.delete({ where: { id } });
    const updated = await getOrCreateCart(req.user!.id);
    return res.json(serializeCart(updated));
  })
);

cartRouter.delete(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.user!.id);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return res.json({ items: [], count: 0, subtotal: 0 });
  })
);
