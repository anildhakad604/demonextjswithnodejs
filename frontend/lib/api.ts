export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function resolveImage(src: string): string {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  // Only backend-uploaded files live under /uploads on the API origin — other
  // relative paths (e.g. seeded banner assets like /sweetynx/banners/...) are
  // static files served by the frontend's own public/ folder, same origin.
  if (src.startsWith("/uploads/")) return `${API_ORIGIN}${src}`;
  return src;
}

export type SubCategory = { id: string; name: string; slug: string; categoryId: string };
export type Category = { id: string; name: string; slug: string; subCategories?: SubCategory[] };

export type ProductSize = { id: string; size: string; stock: number };
export type ProductImage = { id: string; url: string; sortOrder: number };

// A+ style enhanced content modules rendered on the product detail page.
export type ContentBlockType = "HEADING_TEXT" | "IMAGE_TEXT" | "FEATURE_GRID" | "FULL_IMAGE";
export type HeadingTextData = { title: string; body: string };
export type ImageTextData = { title: string; body: string; layout: "image-left" | "image-right"; image: string };
export type FeatureGridData = { title?: string; items: { title: string; body: string }[] };
export type FullImageData = { caption?: string; image: string };
export type ContentBlock =
  | { id: string; productId: string; type: "HEADING_TEXT"; sortOrder: number; data: HeadingTextData }
  | { id: string; productId: string; type: "IMAGE_TEXT"; sortOrder: number; data: ImageTextData }
  | { id: string; productId: string; type: "FEATURE_GRID"; sortOrder: number; data: FeatureGridData }
  | { id: string; productId: string; type: "FULL_IMAGE"; sortOrder: number; data: FullImageData };

// Products sharing a colorGroupId (Sweetynx models color variants as
// sibling products, each with its own PDP page, rather than a dropdown).
export type ColorVariant = {
  id: string;
  slug: string;
  skuCode: string;
  colorName: string | null;
  colorSwatchHex: string | null;
  image: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  /// URL-facing short code — see getProductUrl().
  skuCode: string;
  description: string;
  price: string;
  /// Strikethrough "original" price shown alongside `price` when set.
  actualPrice: string | null;
  isFlashSale: boolean;
  isFastDelivery: boolean;
  colorGroupId: string | null;
  colorName: string | null;
  colorSwatchHex: string | null;
  image: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  categoryId: string;
  category: Category;
  subCategoryId: string | null;
  subCategory: SubCategory | null;
  sizes: ProductSize[];
  images: ProductImage[];
  contentBlocks?: ContentBlock[];
  /// Only present on the single-product GET response.
  colorVariants?: ColorVariant[];
  createdAt: string;
};

/// Canonical storefront URL for a product, matching Sweetynx's
/// /{category}/{subcategory}/{sku} structure. Products without a
/// subcategory fall back to "all" for that segment — the PDP route
/// resolves by category + sku regardless of what's in the middle segment.
export function getProductUrl(product: Product): string {
  const subSlug = product.subCategory?.slug ?? "all";
  return `/${product.category.slug}/${subSlug}/${product.skuCode}`;
}

export type Review = {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  user: { name: string };
  product?: { name: string; slug: string };
};
export type ReviewListResponse = { items: Review[]; averageRating: number; count: number };

export type ProductListResponse = { items: Product[]; total: number; page: number; limit: number; totalPages: number };

export type User = { id: string; name: string; email: string; phone?: string | null; role: "USER" | "ADMIN" };

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  size: string | null;
  price: string;
  quantity: number;
};

export type Order = {
  id: string;
  status: string;
  subtotal: string;
  discount: string;
  shippingFee: string;
  total: string;
  couponId: string | null;
  razorpayOrderId: string | null;
  paidAt: string | null;
  createdAt: string;
  items: OrderItem[];
  address: Address;
  coupon: Coupon | null;
  user?: { id: string; name: string; email: string };
};

export type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  minOrderValue: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  offerText: string | null;
};

export type WishlistItem = { id: string; productId: string; createdAt: string; product: Product };

export class ApiRequestError extends Error {
  status: number;
  productId?: string;
  size?: string;
  constructor(status: number, message: string, productId?: string, size?: string) {
    super(message);
    this.status = status;
    this.productId = productId;
    this.size = size;
  }
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers:
      options.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
  });

  if (response.status === 401 && retry && path !== "/auth/refresh") {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
    if (refreshed.ok) return request<T>(path, options, false);
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiRequestError(response.status, data.message || "Request failed", data.productId, data.size);
  }
  return data as T;
}

// Products & categories
export type ProductSort = "popular" | "new" | "discount" | "priceLow" | "priceHigh";

export function getProducts(
  params: {
    category?: string;
    subCategory?: string;
    search?: string;
    size?: string;
    color?: string;
    minPrice?: number;
    maxPrice?: number;
    isFlashSale?: boolean;
    sort?: ProductSort;
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  } = {}
) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.subCategory) qs.set("subCategory", params.subCategory);
  if (params.search) qs.set("search", params.search);
  if (params.size) qs.set("size", params.size);
  if (params.color) qs.set("color", params.color);
  if (params.minPrice !== undefined) qs.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) qs.set("maxPrice", String(params.maxPrice));
  if (params.isFlashSale) qs.set("isFlashSale", "true");
  if (params.sort) qs.set("sort", params.sort);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.includeInactive) qs.set("includeInactive", "true");
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<ProductListResponse>(`/products${suffix}`);
}
export function getProduct(idOrSlug: string) {
  return request<Product>(`/products/${idOrSlug}`);
}
export type ProductFilters = {
  sizes: string[];
  colors: { name: string | null; hex: string | null }[];
  subCategories: SubCategory[];
  priceRange: { min: string | number; max: string | number };
};
export function getProductFilters(category?: string) {
  const suffix = category ? `?category=${encodeURIComponent(category)}` : "";
  return request<ProductFilters>(`/products/filters${suffix}`);
}
export function getCategories() {
  return request<Category[]>("/categories");
}

// Marketing content (homepage banners, top announcement bar)
export type BannerType = "HERO" | "MID" | "BIG_CATEGORY" | "CATEGORY_CARD" | "CELEB" | "FASHION_VIDEO";
export type Banner = {
  id: string;
  type: BannerType;
  imageUrl: string;
  linkUrl: string | null;
  title: string | null;
  sortOrder: number;
  isActive: boolean;
};
export function getBanners(type?: BannerType) {
  const suffix = type ? `?type=${type}` : "";
  return request<Banner[]>(`/banners${suffix}`);
}
export type AnnouncementRecord = { id: string; text: string; isActive: boolean };
export type Announcement = AnnouncementRecord | null;
export function getAnnouncement() {
  return request<Announcement>("/announcement");
}

// Auth
export function register(input: { name: string; email: string; password: string }) {
  return request<User>("/auth/register", { method: "POST", body: JSON.stringify(input) });
}
export function login(input: { email: string; password: string }) {
  return request<User>("/auth/login", { method: "POST", body: JSON.stringify(input) });
}
export function guestCheckout(input: { name: string; email: string }) {
  return request<User>("/auth/guest", { method: "POST", body: JSON.stringify(input) });
}
export function logout() {
  return request<void>("/auth/logout", { method: "POST" });
}
export function getMe() {
  return request<User>("/auth/me");
}
export function updateProfile(name: string) {
  return request<User>("/auth/me", { method: "PATCH", body: JSON.stringify({ name }) });
}
export function forgotPassword(email: string) {
  return request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}
export function resetPassword(token: string, password: string) {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
export function requestOtp(phone: string) {
  return request<{ message: string; resendSecondsLeft: number; devOtp?: string }>("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}
export function verifyOtp(phone: string, code: string) {
  return request<User>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code }) });
}

// Server-side cart
export type ServerCartItem = {
  id: string;
  productId: string;
  size: string | null;
  quantity: number;
  name: string;
  slug: string;
  skuCode: string;
  price: string;
  actualPrice: string | null;
  image: string;
  stock: number;
  availableSizes: string[];
};
export type ServerCart = { items: ServerCartItem[]; count: number; subtotal: number };

export function getCart() {
  return request<ServerCart>("/cart");
}
export function addCartItem(input: { productId: string; size?: string; quantity?: number }) {
  return request<ServerCart>("/cart/items", { method: "POST", body: JSON.stringify(input) });
}
export function updateCartItem(id: string, input: { quantity?: number; size?: string }) {
  return request<ServerCart>(`/cart/items/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
export function removeCartItem(id: string) {
  return request<ServerCart>(`/cart/items/${id}`, { method: "DELETE" });
}
export function clearCart() {
  return request<ServerCart>("/cart", { method: "DELETE" });
}

// Wallet & loyalty points ("Sweety Points")
export type WalletTransaction = { id: string; amount: string; label: string; orderId: string | null; createdAt: string };
export type Wallet = { balance: string; transactions: WalletTransaction[] };
export function getWallet() {
  return request<Wallet>("/wallet");
}
export type LoyaltyPointsTransaction = { id: string; points: number; label: string; orderId: string | null; createdAt: string };
export type LoyaltyPoints = { balance: number; transactions: LoyaltyPointsTransaction[] };
export function getLoyaltyPoints() {
  return request<LoyaltyPoints>("/loyalty-points");
}

// Contact
export function submitContact(input: { name: string; email: string; phone?: string; message: string }) {
  return request<{ message: string }>("/contact", { method: "POST", body: JSON.stringify(input) });
}

// Addresses
export function getAddresses() {
  return request<Address[]>("/addresses");
}
export function createAddress(input: Omit<Address, "id">) {
  return request<Address>("/addresses", { method: "POST", body: JSON.stringify(input) });
}
export function deleteAddress(id: string) {
  return request<void>(`/addresses/${id}`, { method: "DELETE" });
}

// Coupons
export type ActiveCoupon = { code: string; discountType: "PERCENTAGE" | "FIXED"; discountValue: string; offerText: string | null } | null;
export function getActiveCoupon() {
  return request<ActiveCoupon>("/coupons/active");
}
export function validateCoupon(code: string, subtotal: number) {
  return request<{ id: string; code: string; discount: number; total: number }>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });
}

// Orders
export function createOrder(input: {
  items: { productId: string; quantity: number; size?: string }[];
  addressId: string;
  couponCode?: string;
}) {
  return request<{ orderId: string; razorpayOrderId: string; amount: number; currency: string; keyId: string }>(
    "/orders",
    { method: "POST", body: JSON.stringify(input) }
  );
}
export function verifyPayment(
  orderId: string,
  input: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
) {
  return request<{ status: string }>(`/orders/${orderId}/verify-payment`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export function getMyOrders() {
  return request<Order[]>("/orders");
}
export function getOrder(id: string) {
  return request<Order>(`/orders/${id}`);
}
export function cancelMyOrder(id: string) {
  return request<Order>(`/orders/${id}/cancel`, { method: "POST" });
}

// Admin
export type AdminStats = {
  productCount: number;
  orderCount: number;
  userCount: number;
  revenue: number;
  lowStockCount: number;
  recentOrders: Order[];
};
export function getAdminStats() {
  return request<AdminStats>("/admin/stats");
}
export function getAdminOrders(status?: string) {
  const suffix = status ? `?status=${status}` : "";
  return request<{ items: Order[]; total: number }>(`/admin/orders${suffix}`);
}
export function updateOrderStatus(id: string, status: string) {
  return request<{ status: string }>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
export function getAdminUsers() {
  return request<User[]>("/admin/users");
}

export function createCategory(name: string) {
  return request<Category>("/categories", { method: "POST", body: JSON.stringify({ name }) });
}
export function updateCategory(id: string, name: string) {
  return request<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify({ name }) });
}
export function deleteCategory(id: string) {
  return request<void>(`/categories/${id}`, { method: "DELETE" });
}

export function createSubCategory(name: string, categoryId: string) {
  return request<SubCategory>("/subcategories", { method: "POST", body: JSON.stringify({ name, categoryId }) });
}
export function updateSubCategory(id: string, name: string) {
  return request<SubCategory>(`/subcategories/${id}`, { method: "PUT", body: JSON.stringify({ name }) });
}
export function deleteSubCategory(id: string) {
  return request<void>(`/subcategories/${id}`, { method: "DELETE" });
}

export function getAdminBanners() {
  return request<Banner[]>("/banners/admin");
}
export function createBanner(formData: FormData) {
  return request<Banner>("/banners", { method: "POST", body: formData });
}
export function updateBanner(id: string, formData: FormData) {
  return request<Banner>(`/banners/${id}`, { method: "PUT", body: formData });
}
export function deleteBanner(id: string) {
  return request<void>(`/banners/${id}`, { method: "DELETE" });
}

export function getAdminAnnouncements() {
  return request<AnnouncementRecord[]>("/announcement/admin");
}
export function createAnnouncement(input: { text: string; isActive?: boolean }) {
  return request<AnnouncementRecord>("/announcement", { method: "POST", body: JSON.stringify(input) });
}
export function updateAnnouncement(id: string, input: Partial<{ text: string; isActive: boolean }>) {
  return request<AnnouncementRecord>(`/announcement/${id}`, { method: "PUT", body: JSON.stringify(input) });
}
export function deleteAnnouncement(id: string) {
  return request<void>(`/announcement/${id}`, { method: "DELETE" });
}

export function createProduct(formData: FormData) {
  return request<Product>("/products", { method: "POST", body: formData });
}
export function updateProduct(id: string, formData: FormData) {
  return request<Product>(`/products/${id}`, { method: "PUT", body: formData });
}
export function deleteProduct(id: string) {
  return request<void>(`/products/${id}`, { method: "DELETE" });
}
export function adjustStock(id: string, change: number, reason: string) {
  return request<Product>(`/products/${id}/stock`, { method: "POST", body: JSON.stringify({ change, reason }) });
}
export function adjustSizeStock(productId: string, sizeId: string, change: number, reason: string) {
  return request<ProductSize>(`/products/${productId}/sizes/${sizeId}/stock`, {
    method: "POST",
    body: JSON.stringify({ change, reason }),
  });
}

export function getAdminCoupons() {
  return request<Coupon[]>("/coupons");
}
export function createCoupon(input: {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number;
  expiresAt?: string;
  offerText?: string;
}) {
  return request<Coupon>("/coupons", { method: "POST", body: JSON.stringify(input) });
}
export function updateCoupon(id: string, input: Partial<{ isActive: boolean; offerText: string }>) {
  return request<Coupon>(`/coupons/${id}`, { method: "PUT", body: JSON.stringify(input) });
}
export function deleteCoupon(id: string) {
  return request<void>(`/coupons/${id}`, { method: "DELETE" });
}

export function deleteProductImage(productId: string, imageId: string) {
  return request<void>(`/products/${productId}/images/${imageId}`, { method: "DELETE" });
}

// A+ content blocks
export function createContentBlock(productId: string, formData: FormData) {
  return request<ContentBlock>(`/products/${productId}/content-blocks`, { method: "POST", body: formData });
}
export function updateContentBlock(productId: string, blockId: string, formData: FormData) {
  return request<ContentBlock>(`/products/${productId}/content-blocks/${blockId}`, {
    method: "PUT",
    body: formData,
  });
}
export function deleteContentBlock(productId: string, blockId: string) {
  return request<void>(`/products/${productId}/content-blocks/${blockId}`, { method: "DELETE" });
}
export function reorderContentBlocks(productId: string, order: string[]) {
  return request<void>(`/products/${productId}/content-blocks/reorder`, {
    method: "PUT",
    body: JSON.stringify({ order }),
  });
}

// Reviews
export function getProductReviews(productId: string) {
  return request<ReviewListResponse>(`/products/${productId}/reviews`);
}
export function submitReview(productId: string, input: { rating: number; comment: string }) {
  return request<Review>(`/products/${productId}/reviews`, { method: "POST", body: JSON.stringify(input) });
}
export function getMyReview(productId: string) {
  return request<Review | null>(`/products/${productId}/reviews/me`);
}
export function deleteMyReview(productId: string) {
  return request<void>(`/products/${productId}/reviews/me`, { method: "DELETE" });
}
export function getAdminReviews() {
  return request<Review[]>("/admin/reviews");
}
export function moderateReview(id: string, isApproved: boolean) {
  return request<Review>(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ isApproved }) });
}
export function deleteAdminReview(id: string) {
  return request<void>(`/admin/reviews/${id}`, { method: "DELETE" });
}

// Wishlist
export function getWishlist() {
  return request<WishlistItem[]>("/wishlist");
}
export function addToWishlist(productId: string) {
  return request<WishlistItem>("/wishlist", { method: "POST", body: JSON.stringify({ productId }) });
}
export function removeFromWishlist(productId: string) {
  return request<void>(`/wishlist/${productId}`, { method: "DELETE" });
}
