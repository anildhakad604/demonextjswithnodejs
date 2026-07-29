import bcrypt from "bcryptjs";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type SeedBlock =
  | { type: "HEADING_TEXT"; title: string; body: string }
  | { type: "IMAGE_TEXT"; title: string; body: string; layout: "image-left" | "image-right"; image: string }
  | { type: "FEATURE_GRID"; title?: string; items: { title: string; body: string }[] }
  | { type: "FULL_IMAGE"; caption?: string; image: string };

// A+ style content per product. Every product gets an intro + feature grid;
// one flagship product per category additionally gets an image module to
// show off the richer block types. Image URLs reuse each product's own
// (already-verified) Unsplash photo at a larger width rather than sourcing
// new photo ids blind.
const contentBlocksByProduct: Record<string, SeedBlock[]> = {
  "Classic Leather Bag": [
    {
      type: "HEADING_TEXT",
      title: "Why you'll love it",
      body: "Cut from full-grain leather and finished by hand, this bag is built to soften and deepen in color with age — the kind of everyday piece that looks better a year in than it did on day one.",
    },
    {
      type: "IMAGE_TEXT",
      title: "Full-grain leather, cut by hand",
      body: "Each bag is cut from a single full-grain hide and hand-finished at the edges, so the grain and tone deepen naturally with age instead of peeling like bonded leather.",
      layout: "image-left",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80",
    },
    {
      type: "FEATURE_GRID",
      title: "Highlights",
      items: [
        { title: "Full-grain leather", body: "Develops a natural patina instead of wearing out" },
        { title: "Reinforced handles", body: "Double-stitched to carry a full day's essentials" },
        { title: "Structured base", body: "Holds its shape even when the bag is half-empty" },
      ],
    },
    {
      type: "FULL_IMAGE",
      caption: "Designed for the commute, the weekend, and everywhere in between.",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1600&q=80",
    },
  ],
  "Minimal Sneakers": [
    {
      type: "HEADING_TEXT",
      title: "Made for daily miles",
      body: "A clean, no-logo silhouette with a cushioned midsole so it feels as good on hour six of walking as it did on the first step.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Cushioned midsole", body: "Absorbs impact on hard pavement" },
        { title: "Breathable upper", body: "Keeps feet cool through a full day" },
        { title: "Flexible outsole", body: "Bends naturally with your stride" },
      ],
    },
  ],
  "Modern Wrist Watch": [
    {
      type: "HEADING_TEXT",
      title: "One watch, every occasion",
      body: "A slim case and clean dial mean this watch moves easily from a morning meeting to dinner without ever looking out of place.",
    },
    {
      type: "IMAGE_TEXT",
      title: "Detail in every finish",
      body: "A sapphire-hardened crystal and brushed case bring durability to a dial designed to look as sharp in five years as it does today.",
      layout: "image-left",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    },
    {
      type: "FEATURE_GRID",
      title: "Highlights",
      items: [
        { title: "Sapphire-hardened glass", body: "Resists scratches from daily wear" },
        { title: "Water resistant", body: "Handles rain and hand-washing without worry" },
        { title: "Adjustable strap", body: "Fits most wrist sizes out of the box" },
      ],
    },
    {
      type: "FULL_IMAGE",
      caption: "A watch that moves as easily from the boardroom to the weekend.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
    },
  ],
  "Premium Sunglasses": [
    {
      type: "HEADING_TEXT",
      title: "Protection that doesn't compromise on style",
      body: "Full UV400 protection built into a lightweight frame that stays comfortable even after hours in the sun.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "UV400 protection", body: "Blocks 100% of harmful UV rays" },
        { title: "Lightweight frame", body: "Barely noticeable on longer wears" },
        { title: "Scratch-resistant lenses", body: "Stay clear trip after trip" },
      ],
    },
  ],
  "Canvas Backpack": [
    {
      type: "HEADING_TEXT",
      title: "Built for the daily commute",
      body: "A padded laptop compartment and heavyweight canvas shell make this the backpack you reach for on work days and weekend trips alike.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Padded laptop sleeve", body: "Fits most 15-inch laptops" },
        { title: "Heavyweight canvas", body: "Resists tearing and abrasion" },
        { title: "Multiple compartments", body: "Keeps cables, books, and essentials organized" },
      ],
    },
  ],
  "Canvas Tote Bag": [
    {
      type: "HEADING_TEXT",
      title: "The bag that does it all",
      body: "Spacious enough for a grocery run or a weekend away, with reinforced seams that hold up to heavier loads than a typical tote.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Reinforced seams", body: "Built to carry heavier loads" },
        { title: "Wide opening", body: "Easy to pack and unpack quickly" },
        { title: "Flat-bottomed base", body: "Stands upright when set down" },
      ],
    },
  ],
  "Running Sport Shoes": [
    {
      type: "HEADING_TEXT",
      title: "Engineered for the long run",
      body: "A lightweight, breathable build with a responsive sole designed to keep you comfortable from the first kilometer to the last.",
    },
    {
      type: "IMAGE_TEXT",
      title: "Cushioning that keeps pace with you",
      body: "A responsive foam midsole absorbs impact on every stride, so the shoe feels as fresh on kilometer ten as it did at the start line.",
      layout: "image-right",
      image: "https://images.unsplash.com/photo-1465453869711-7e174808ace9?auto=format&fit=crop&w=1200&q=80",
    },
    {
      type: "FEATURE_GRID",
      title: "Highlights",
      items: [
        { title: "Breathable mesh upper", body: "Ventilates heat during intense runs" },
        { title: "Responsive cushioning", body: "Returns energy with every stride" },
        { title: "Reinforced heel counter", body: "Keeps your foot locked in place" },
      ],
    },
    {
      type: "FULL_IMAGE",
      caption: "Built for the runs that go the distance.",
      image: "https://images.unsplash.com/photo-1465453869711-7e174808ace9?auto=format&fit=crop&w=1600&q=80",
    },
  ],
  "Colorblock Sneakers": [
    {
      type: "HEADING_TEXT",
      title: "A statement, underfoot",
      body: "Bold colorblocking on a cushioned sole — sneakers that stand out without sacrificing the comfort you'd expect from an everyday pair.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Cushioned sole", body: "All-day comfort without breaking in" },
        { title: "Durable outsole", body: "Grips pavement and indoor floors alike" },
        { title: "Colorfast dye", body: "Resists fading through repeated wear" },
      ],
    },
  ],
  "Casual Sneakers": [
    {
      type: "HEADING_TEXT",
      title: "Effortless, every day",
      body: "No-fuss sneakers designed for the days you just want to slip on and go — light, flexible, and comfortable from the first wear.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Lightweight build", body: "Won't weigh down all-day wear" },
        { title: "Slip-friendly fit", body: "Easy on, easy off" },
        { title: "Flexible sole", body: "Moves naturally with your foot" },
      ],
    },
  ],
  "Tan Leather Sneakers": [
    {
      type: "HEADING_TEXT",
      title: "Leather with an edge",
      body: "Low-top leather sneakers with a contrast rubber sole — polished enough for the office, relaxed enough for the weekend.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Genuine leather upper", body: "Ages into a richer tan over time" },
        { title: "Contrast rubber sole", body: "Adds grip and a modern edge" },
        { title: "Low-top cut", body: "Pairs easily with jeans or chinos" },
      ],
    },
  ],
  "Vintage Wrist Watch": [
    {
      type: "HEADING_TEXT",
      title: "Timeless, on purpose",
      body: "A woven leather strap and vintage-inspired dial bring old-world character to a watch built for daily wear.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Woven leather strap", body: "Softens and molds to your wrist" },
        { title: "Vintage-inspired dial", body: "Classic details, legible at a glance" },
        { title: "Precision quartz movement", body: "Reliable timekeeping with low upkeep" },
      ],
    },
  ],
  "Steel Analog Watch": [
    {
      type: "HEADING_TEXT",
      title: "Understated precision",
      body: "A brushed steel case and slim profile make this the watch that works under a cuff as easily as it does on its own.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Brushed steel case", body: "Resists scuffs better than polished finishes" },
        { title: "Slim profile", body: "Sits comfortably under a shirt cuff" },
        { title: "Quartz accuracy", body: "Keeps precise time with minimal maintenance" },
      ],
    },
  ],
  "Aviator Sunglasses": [
    {
      type: "HEADING_TEXT",
      title: "A classic that never dates",
      body: "Aviator frames with polarized lenses — cutting glare on the road without compromising on the shape that's stayed in style for decades.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Polarized lenses", body: "Cuts glare off roads, water, and screens" },
        { title: "Metal frame", body: "Lightweight yet durable" },
        { title: "Classic silhouette", body: "Pairs with any face shape" },
      ],
    },
  ],
  "Leather Wallet": [
    {
      type: "HEADING_TEXT",
      title: "Slim by design",
      body: "A bifold cut from full-grain leather, sized to hold what you actually carry without the bulk of a wallet built for more.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Full-grain leather", body: "Wears in, not out" },
        { title: "Slim bifold cut", body: "Fits comfortably in a front pocket" },
        { title: "Dedicated coin pocket", body: "Keeps loose change contained" },
      ],
    },
  ],
  "Classic Cotton T-Shirt": [
    {
      type: "HEADING_TEXT",
      title: "The basics, done right",
      body: "100% cotton with a relaxed fit that holds its shape wash after wash — the kind of t-shirt that earns a permanent spot in the rotation.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "100% cotton", body: "Soft, breathable, and easy to wear" },
        { title: "Relaxed fit", body: "Comfortable without looking oversized" },
        { title: "Pre-shrunk fabric", body: "Holds its size through repeated washes" },
      ],
    },
  ],
  "Denim Jacket": [
    {
      type: "HEADING_TEXT",
      title: "A layer for every season",
      body: "Classic button-front denim that layers over a t-shirt in summer or a hoodie in winter — one jacket, worn all year.",
    },
    {
      type: "IMAGE_TEXT",
      title: "Denim that earns its wear",
      body: "Heavyweight denim and reinforced stitching mean this jacket only gets better with age — fading naturally at the creases while holding its shape everywhere else.",
      layout: "image-right",
      image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1200&q=80",
    },
    {
      type: "FEATURE_GRID",
      title: "Highlights",
      items: [
        { title: "Heavyweight denim", body: "Holds up to daily layering" },
        { title: "Button-front closure", body: "Classic, easy-to-style silhouette" },
        { title: "Reinforced pockets", body: "Stitched to carry more than the essentials" },
      ],
    },
    {
      type: "FULL_IMAGE",
      caption: "One jacket, worn through every season.",
      image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1600&q=80",
    },
  ],
  "Pullover Hoodie": [
    {
      type: "HEADING_TEXT",
      title: "Built for cool weather",
      body: "Fleece-lined on the inside, clean on the outside — this hoodie layers easily under a jacket or stands on its own on cooler days.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Fleece lining", body: "Traps warmth without adding bulk" },
        { title: "Ribbed cuffs and hem", body: "Keeps drafts out" },
        { title: "Kangaroo pocket", body: "Warms hands or holds a phone" },
      ],
    },
  ],
  "Slim Fit Jeans": [
    {
      type: "HEADING_TEXT",
      title: "Stretch where it counts",
      body: "Stretch-denim construction that moves with you through a full day, without losing the slim shape by evening.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Stretch denim", body: "Moves with you, not against you" },
        { title: "Slim fit", body: "Tailored without feeling restrictive" },
        { title: "Fade-resistant dye", body: "Holds its color through repeated washes" },
      ],
    },
  ],
  "Bomber Jacket": [
    {
      type: "HEADING_TEXT",
      title: "Light layer, big impact",
      body: "Ribbed cuffs and hem give this bomber a snug, classic fit, while the lightweight shell keeps it wearable well past the first cool day of fall.",
    },
    {
      type: "FEATURE_GRID",
      items: [
        { title: "Lightweight shell", body: "Layers easily without bulk" },
        { title: "Ribbed cuffs and hem", body: "Seals in warmth at the openings" },
        { title: "Zip-front closure", body: "Quick on, quick off" },
      ],
    },
  ],
};

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

    const blocks = contentBlocksByProduct[p.name];
    if (blocks) {
      // Only seed on a product that has no A+ content yet, so re-running
      // the seed never overwrites content an admin has since edited.
      const existingBlockCount = await prisma.productContentBlock.count({ where: { productId: product.id } });
      if (existingBlockCount === 0) {
        await prisma.productContentBlock.createMany({
          data: blocks.map((block, index) => {
            const { type, ...data } = block;
            return {
              productId: product.id,
              type,
              sortOrder: index,
              data: data as Prisma.InputJsonValue,
            };
          }),
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
