// Category slugs become the first path segment of every product/listing URL
// (/{category}/{subcategory}/{sku}, /listing/{category}/{subcategory}).
// Next.js always prefers a static route folder over a dynamic one at the
// same level, so a category slug matching one of these would simply be
// unreachable — reject it at creation time instead of failing silently.
export const RESERVED_CATEGORY_SLUGS = new Set([
  "admin",
  "admin-login",
  "cart",
  "checkout",
  "forgot-password",
  "login",
  "orders",
  "products",
  "register",
  "reset-password",
  "wishlist",
  "listing",
  "api",
]);
