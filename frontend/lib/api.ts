export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function resolveImage(src: string): string {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${API_ORIGIN}${src}`;
}

export type Category = { id: string; name: string; slug: string };

export type ProductSize = { id: string; size: string; stock: number };
export type ProductImage = { id: string; url: string; sortOrder: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  image: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  categoryId: string;
  category: Category;
  sizes: ProductSize[];
  images: ProductImage[];
  createdAt: string;
};

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

export type User = { id: string; name: string; email: string; role: "USER" | "ADMIN" };

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
export function getProducts(
  params: { category?: string; search?: string; page?: number; limit?: number; includeInactive?: boolean } = {}
) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.includeInactive) qs.set("includeInactive", "true");
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<ProductListResponse>(`/products${suffix}`);
}
export function getProduct(idOrSlug: string) {
  return request<Product>(`/products/${idOrSlug}`);
}
export function getCategories() {
  return request<Category[]>("/categories");
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
export function forgotPassword(email: string) {
  return request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}
export function resetPassword(token: string, password: string) {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
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
}) {
  return request<Coupon>("/coupons", { method: "POST", body: JSON.stringify(input) });
}
export function updateCoupon(id: string, input: Partial<{ isActive: boolean }>) {
  return request<Coupon>(`/coupons/${id}`, { method: "PUT", body: JSON.stringify(input) });
}
export function deleteCoupon(id: string) {
  return request<void>(`/coupons/${id}`, { method: "DELETE" });
}

export function deleteProductImage(productId: string, imageId: string) {
  return request<void>(`/products/${productId}/images/${imageId}`, { method: "DELETE" });
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
