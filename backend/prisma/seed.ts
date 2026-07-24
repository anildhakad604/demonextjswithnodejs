import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const adminEmail = "admin@example.com";
  const adminPassword = "Admin@12345";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "ADMIN",
      },
    });
    console.log(`Created admin user: ${adminEmail} / ${adminPassword}`);
  }

  const categories = ["Bags", "Shoes", "Accessories", "Clothing"];
  const categoryRecords: Record<string, string> = {};
  for (const name of categories) {
    const slug = slugify(name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    categoryRecords[name] = category.id;
  }

  const products = [
    {
      name: "Classic Leather Bag",
      description: "A premium everyday leather bag with a timeless design.",
      price: 3499,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
      category: "Bags",
      stock: 12,
    },
    {
      name: "Minimal Sneakers",
      description: "Comfortable minimalist sneakers for daily wear.",
      price: 2799,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      category: "Shoes",
      stock: 20,
      sizes: [
        { size: "7", stock: 6 },
        { size: "8", stock: 8 },
        { size: "9", stock: 5 },
        { size: "10", stock: 1 },
      ],
    },
    {
      name: "Modern Wrist Watch",
      description: "A clean modern watch suitable for work and weekends.",
      price: 4999,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
      category: "Accessories",
      stock: 8,
    },
    {
      name: "Premium Sunglasses",
      description: "UV-protected sunglasses with a premium lightweight frame.",
      price: 1999,
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80",
      category: "Accessories",
      stock: 15,
    },
    {
      name: "Canvas Backpack",
      description: "Durable canvas backpack with padded laptop compartment.",
      price: 2299,
      image: "https://images.unsplash.com/photo-1583300418584-8332e32b710e?auto=format&fit=crop&w=900&q=80",
      category: "Bags",
      stock: 18,
    },
    {
      name: "Canvas Tote Bag",
      description: "Spacious canvas tote for everyday errands and travel.",
      price: 2899,
      image: "https://images.unsplash.com/photo-1568650108567-f040f546ce15?auto=format&fit=crop&w=900&q=80",
      category: "Bags",
      stock: 3,
    },
    {
      name: "Running Sport Shoes",
      description: "Lightweight breathable sport shoes built for daily runs.",
      price: 3299,
      image: "https://images.unsplash.com/photo-1465453869711-7e174808ace9?auto=format&fit=crop&w=900&q=80",
      category: "Shoes",
      stock: 25,
      sizes: [
        { size: "7", stock: 7 },
        { size: "8", stock: 9 },
        { size: "9", stock: 9 },
        { size: "10", stock: 0 },
      ],
    },
    {
      name: "Colorblock Sneakers",
      description: "Statement colorblock sneakers with a cushioned sole.",
      price: 3799,
      image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80",
      category: "Shoes",
      stock: 14,
    },
    {
      name: "Casual Sneakers",
      description: "Easy everyday sneakers for relaxed, all-day wear.",
      price: 1899,
      image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=80",
      category: "Shoes",
      stock: 0,
    },
    {
      name: "Tan Leather Sneakers",
      description: "Low-top leather sneakers with a contrast rubber sole.",
      price: 2599,
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80",
      category: "Shoes",
      stock: 10,
    },
    {
      name: "Vintage Wrist Watch",
      description: "Vintage-styled wrist watch with a woven leather strap.",
      price: 5999,
      image: "https://images.unsplash.com/photo-1509941943102-10c232535736?auto=format&fit=crop&w=900&q=80",
      category: "Accessories",
      stock: 6,
    },
    {
      name: "Steel Analog Watch",
      description: "Slim analog watch with a brushed steel case.",
      price: 3999,
      image: "https://images.unsplash.com/photo-1606387318469-bada9b642157?auto=format&fit=crop&w=900&q=80",
      category: "Accessories",
      stock: 9,
    },
    {
      name: "Aviator Sunglasses",
      description: "Classic aviator frames with polarized lenses.",
      price: 1599,
      image: "https://images.unsplash.com/photo-1610136649349-0f646f318053?auto=format&fit=crop&w=900&q=80",
      category: "Accessories",
      stock: 22,
    },
    {
      name: "Leather Wallet",
      description: "Slim bifold leather wallet with card slots and a coin pocket.",
      price: 1299,
      image: "https://images.unsplash.com/photo-1620109176813-e91290f6c795?auto=format&fit=crop&w=900&q=80",
      category: "Accessories",
      stock: 30,
    },
    {
      name: "Classic Cotton T-Shirt",
      description: "Breathable 100% cotton t-shirt with a relaxed fit.",
      price: 899,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      category: "Clothing",
      stock: 40,
      sizes: [
        { size: "S", stock: 12 },
        { size: "M", stock: 15 },
        { size: "L", stock: 10 },
        { size: "XL", stock: 3 },
      ],
    },
    {
      name: "Denim Jacket",
      description: "Classic denim jacket with a button-front closure.",
      price: 3299,
      image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80",
      category: "Clothing",
      stock: 12,
      sizes: [
        { size: "S", stock: 4 },
        { size: "M", stock: 5 },
        { size: "L", stock: 3 },
        { size: "XL", stock: 0 },
      ],
    },
    {
      name: "Pullover Hoodie",
      description: "Fleece-lined pullover hoodie for cool weather layering.",
      price: 1799,
      image: "https://images.unsplash.com/photo-1632073143817-8cd5b2165e20?auto=format&fit=crop&w=900&q=80",
      category: "Clothing",
      stock: 17,
      sizes: [
        { size: "S", stock: 5 },
        { size: "M", stock: 6 },
        { size: "L", stock: 4 },
        { size: "XL", stock: 2 },
      ],
    },
    {
      name: "Slim Fit Jeans",
      description: "Stretch-denim slim fit jeans for everyday comfort.",
      price: 2199,
      image: "https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?auto=format&fit=crop&w=900&q=80",
      category: "Clothing",
      stock: 20,
      sizes: [
        { size: "30", stock: 6 },
        { size: "32", stock: 8 },
        { size: "34", stock: 5 },
        { size: "36", stock: 1 },
      ],
    },
    {
      name: "Bomber Jacket",
      description: "Lightweight bomber jacket with ribbed cuffs and hem.",
      price: 3599,
      image: "https://images.unsplash.com/photo-1582494425482-c6dac37c8eeb?auto=format&fit=crop&w=900&q=80",
      category: "Clothing",
      stock: 4,
    },
  ];

  // One-time cleanup: earlier seeded rows under these now-renamed slugs
  // (originally assigned mismatched product photos) would otherwise be
  // orphaned once the corrected products above create fresh slugs.
  const staleSlugs = [
    "quilted-tote-bag",
    "trail-running-shoes",
    "casual-canvas-shoes",
    "retro-high-tops",
    "chronograph-watch",
  ];
  await prisma.product.deleteMany({ where: { slug: { in: staleSlugs } } });

  for (const p of products) {
    const slug = slugify(p.name);
    const sizes = "sizes" in p ? p.sizes : undefined;
    const stock = sizes ? sizes.reduce((sum, s) => sum + s.stock, 0) : p.stock;

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        description: p.description,
        price: p.price,
        image: p.image,
        categoryId: categoryRecords[p.category],
      },
      create: {
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        image: p.image,
        stock,
        categoryId: categoryRecords[p.category],
        ...(sizes ? { sizes: { create: sizes } } : {}),
      },
    });

    if (sizes) {
      for (const s of sizes) {
        await prisma.productSize.upsert({
          where: { productId_size: { productId: product.id, size: s.size } },
          update: {},
          create: { productId: product.id, size: s.size, stock: s.stock },
        });
      }
    }
  }

  const coupon = await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 500,
      maxUses: 100,
    },
  });

  console.log(`Seeded ${products.length} products, ${categories.length} categories, coupon ${coupon.code}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
