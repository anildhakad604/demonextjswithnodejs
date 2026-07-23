import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { requireParam } from "../lib/params.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [productCount, orderCount, userCount, paidOrders, allProducts, recentOrders] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.findMany({ where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } } }),
      prisma.product.findMany({ select: { stock: true, lowStockThreshold: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { items: true, user: { select: { name: true, email: true } } },
      }),
    ]);

    const revenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const lowStockProducts = allProducts.filter((p) => p.stock <= p.lowStockThreshold);

    return res.json({
      productCount,
      orderCount,
      userCount,
      revenue,
      lowStockCount: lowStockProducts.length,
      recentOrders,
    });
  })
);

const listOrdersQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

adminRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const { status, page, limit } = listOrdersQuerySchema.parse(req.query);
    const where = status ? { status: status as never } : {};

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, address: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  })
);

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"]),
});

adminRouter.patch(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const id = requireParam(req.params.id);
    const { status } = updateStatusSchema.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new ApiError(404, "Order not found");

    const wasFulfilled = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status);
    const isCancelling = status === "CANCELLED";

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status } });

      if (isCancelling && wasFulfilled) {
        for (const item of order.items) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          await tx.stockMovement.create({
            data: { productId: item.productId, change: item.quantity, reason: `Order ${order.id} cancelled` },
          });
        }
      }
    });

    return res.json({ status });
  })
);

adminRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(users);
  })
);
