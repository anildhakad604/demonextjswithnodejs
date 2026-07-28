# Project Overview: Next.js + Node.js E-commerce (NovaShop)

A full-stack e-commerce application built with **Next.js 15 (App Router)** and **Node.js/Express**, using **MySQL** as the database with **Prisma ORM**. The project runs as a monorepo with concurrent development servers.

---

## Architecture

### Monorepo Structure
```
next-node-ecommerce/
├── package.json              # Root: orchestrates dev servers
├── README.md
├── Agent.md                  # This file – project knowledge base
│
├── backend/                  # Express API server (port 5000)
│   ├── .env / .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── prisma/
│       ├── schema.prisma     # Database schema (MySQL)
│       ├── seed.ts           # Seed script for development
│       └── migrations/       # Prisma migrations
│   └── src/
│       ├── server.ts         # Express app entry point
│       ├── lib/
│       │   ├── prisma.ts     # Prisma client singleton
│       │   ├── jwt.ts        # JWT signing and verification (access + refresh tokens)
│       │   ├── razorpay.ts   # Razorpay payment SDK + signature verification
│       │   ├── email.ts      # Nodemailer email sending utility
│       │   ├── emailTemplates.ts # HTML email templates (password reset, order status)
│       │   ├── orderFulfillment.ts # Order fulfillment logic (deduct stock, record movement)
│       │   ├── shipping.ts   # Shipping fee calculation (free threshold ₹1,999)
│       │   └── params.ts     # Parameter validation helper
│       ├── middleware/
│       │   ├── auth.ts       # requireAuth, optionalAuth, requireAdmin middleware
│       │   ├── errorHandler.ts # ApiError class + global error handler + asyncHandler wrapper
│       │   ├── rateLimit.ts  # Rate limiters (auth, order)
│       │   └── upload.ts     # Multer file upload config (images)
│       └── routes/
│           ├── auth.routes.ts      # Register, login, guest checkout, refresh, logout, /me, forgot/reset password
│           ├── product.routes.ts   # CRUD + stock adjustment (+ size-specific stock)
│           ├── category.routes.ts  # CRUD
│           ├── address.routes.ts   # CRUD (user-scoped)
│           ├── coupon.routes.ts    # CRUD + validate (with discount computation)
│           ├── order.routes.ts     # Create order, verify payment, list/get orders
│           ├── admin.routes.ts     # Dashboard stats, admin order management, CSV export, users
│           ├── review.routes.ts    # Product reviews (submit, list, moderate)
│           ├── wishlist.routes.ts  # Wishlist CRUD (add/remove/list)
│           └── webhook.routes.ts   # Razorpay webhook handler (raw body)
│
├── frontend/                 # Next.js app (port 3000)
    ├── .env.local / .env.local.example
    ├── package.json
    ├── tsconfig.json
    ├── next-env.d.ts
    ├── next.config.ts
    ├── app/
    │   ├── globals.css                 # Global styles (single CSS file)
    │   ├── layout.tsx                  # Root layout: fonts, AuthProvider → CartProvider → WishlistProvider → Header → children → Footer
    │   ├── template.tsx                # Page fade-in animation wrapper
    │   ├── page.tsx                    # Homepage (hero + featured products grid + trust badges)
    │   ├── login/page.tsx              # Login form (redirects to admin or ?next)
    │   ├── register/page.tsx           # Registration form (min 8 char password)
    │   ├── forgot-password/page.tsx    # Email input → sends reset link
    │   ├── reset-password/page.tsx     # Token from URL + new password form
    │   ├── cart/page.tsx               # Cart (from localStorage context)
    │   ├── checkout/page.tsx           # Full checkout: guest flow, address selection/creation, coupon, Razorpay
    │   ├── orders/page.tsx             # My Orders list (table with status badges)
    │   ├── orders/[id]/page.tsx        # Order detail (items, address, pricing breakdown)
    │   ├── products/page.tsx           # Product listing with search, category filter, pagination
    │   ├── products/[id]/page.tsx      # Product detail (gallery, sizes, add to cart, reviews)
    │   ├── wishlist/page.tsx           # User's wishlisted products grid
    │   └── admin/
    │       ├── layout.tsx              # Admin layout (role-gated, sidebar nav, avatar)
    │       ├── page.tsx                # Dashboard stats (revenue, orders, products, users, low stock)
    │       ├── products/page.tsx       # Admin product list (edit/delete)
    │       ├── products/new/page.tsx   # New product form
    │       ├── products/[id]/page.tsx  # Edit product form
    │       ├── categories/page.tsx     # Admin category management (create/delete)
    │       ├── coupons/page.tsx        # Admin coupon management (create/enable/disable/delete)
    │       ├── orders/page.tsx         # Admin order management (filter by status, update, CSV export)
    │       └── reviews/page.tsx        # Admin review moderation (show/hide/delete)
    ├── components/
    │   ├── Header.tsx                  # Sticky header (scroll-aware, auth-aware, cart count)
    │   ├── Footer.tsx                  # Footer (hidden on admin pages)
    │   ├── ProductCard.tsx             # Product grid card (image, category, name, price, wishlist button)
    │   ├── ProductGallery.tsx          # Image gallery with thumbnail selector
    │   ├── ProductReviews.tsx          # Review list + submit/update/delete (star rating)
    │   ├── AddToCartButton.tsx         # Client: size selector + add to localStorage cart
    │   ├── WishlistButton.tsx          # Heart toggle button (with login redirect)
    │   ├── StarRating.tsx              # Interactive/static star rating SVG component
    │   ├── Reveal.tsx                  # Scroll-reveal animation (IntersectionObserver)
    │   └── admin/
    │       ├── ProductForm.tsx         # Admin product create/edit form (images, sizes, stock)
    │       └── icons.tsx               # SVG icon components for admin sidebar
    └── lib/
        ├── api.ts                     # Full API client (fetch with auto-refresh on 401, TypeScript types)
        ├── auth-context.tsx            # React context for auth state (login, register, logout, guest)
        ├── cart-context.tsx            # React context for localStorage cart (add, remove, quantity, subtotal)
        ├── wishlist-context.tsx        # React context for wishlist (sync with backend, isWishlisted, toggle)
        ├── format.ts                  # formatINR() — Indian Rupee formatter
        └── shipping.ts                # FREE_SHIPPING_THRESHOLD, computeShippingFee()
```

---

## Backend (`backend/`)

### Stack
- **Runtime**: Node.js with TypeScript (ESM via `"type": "module"`)
- **Framework**: Express.js (with `tsx` hot-reload for development)
- **Database**: **MySQL** via Prisma ORM (NOT SQL Server)
- **Auth**: JWT (access + refresh tokens) with bcrypt password hashing (12 rounds)
- **Payment**: Razorpay payment gateway
- **File Uploads**: Multer (JPEG/PNG/WEBP/GIF, max 5MB per file)

### Key Dependencies
| Package | Purpose |
|---|---|
| `express` | HTTP framework |
| `@prisma/client` + `prisma` | Database ORM & migrations |
| `jsonwebtoken` | JWT access & refresh tokens |
| `bcryptjs` | Password hashing |
| `razorpay` | Payment gateway integration |
| `zod` | Request validation |
| `multer` | Image upload handling |
| `cookie-parser` | Cookie-based token management |
| `cors` | Cross-origin requests |
| `helmet` | Security headers |
| `dotenv` | Environment variables |

### Environment Variables (`.env.example`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `DATABASE_URL` | (required) | **MySQL** connection string |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |
| `JWT_ACCESS_SECRET` | (required) | Secret for access tokens (15m expiry) |
| `JWT_REFRESH_SECRET` | (required) | Secret for refresh tokens (30d expiry) |
| `RAZORPAY_KEY_ID` | (required) | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | (required) | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | (optional) | Webhook signature verification |
| `UPLOADS_DIR` | `uploads` | Image storage directory |
| `NODE_ENV` | `development` | Environment mode |

### Database Schema (Prisma – MySQL) — 14 Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **User** | id (uuid), name, email (unique), passwordHash, role (USER/ADMIN) | Authentication & authorization |
| **RefreshToken** | token (unique), userId, expiresAt | JWT refresh token rotation (one-time-use) |
| **PasswordResetToken** | token (unique), userId, expiresAt | Password reset flow (1hr expiry) |
| **Address** | userId, fullName, phone, line1, line2?, city, state, postalCode, country (default "India"), isDefault | Shipping addresses |
| **Category** | name (unique), slug (unique) | Product categorization |
| **Product** | name, slug (unique), description, price (Decimal(10,2)), image, stock, lowStockThreshold (default 5), isActive, categoryId | Core product data |
| **ProductImage** | productId, url, sortOrder | Gallery photos (up to 6 additional images) |
| **ProductSize** | productId, size, stock | Size variants (S/M/L/XL etc.) — unique per product+size |
| **StockMovement** | productId, productSizeId?, change, reason, createdAt | Audit trail for all stock changes |
| **Review** | productId, userId, rating (1-5), comment, isApproved (default true) | Product reviews — one per user per product |
| **WishlistItem** | userId, productId | User wishlist — unique per user+product |
| **Coupon** | code (unique), discountType (PERCENTAGE/FIXED), discountValue (Decimal), minOrderValue, maxUses?, usedCount, expiresAt?, isActive | Discount coupons |
| **Order** | userId, addressId, status (PENDING/PAID/PROCESSING/SHIPPED/DELIVERED/CANCELLED/FAILED), subtotal, discount, shippingFee, total, couponId?, razorpayOrderId?, razorpayPaymentId?, razorpaySignature?, paidAt? | Order management |
| **OrderItem** | orderId, productId, name (snapshot), size?, price (Decimal), quantity | Line items within orders |

Key relationships:
- User has many Addresses, Orders, RefreshTokens, PasswordResetTokens, Reviews, WishlistItems
- Product belongs to Category, has many OrderItems, StockMovements, ProductSizes, ProductImages, Reviews, WishlistItems
- Order belongs to User and Address, optionally has Coupon, has many OrderItems
- StockMovement tracks inventory changes per product (optionally per size)
- Roles and statuses are validated at the application layer (MySQL has no enums)

### API Endpoints

#### Public
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/products` | List products (filter: category slug, search, page, limit) |
| `GET` | `/api/products/:idOrSlug` | Get single product (by ID or slug) |
| `GET` | `/api/categories` | List all categories |
| `POST` | `/api/coupons/validate` | Validate coupon code and compute discount |

#### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | No | Register new user (name, email, password min 8 chars) |
| `POST` | `/login` | No | Login (email, password) |
| `POST` | `/guest` | No | Guest checkout account (random password) |
| `POST` | `/refresh` | Cookie | Refresh access token (rotates refresh token) |
| `POST` | `/logout` | Cookie | Logout (clear cookies + delete refresh token) |
| `POST` | `/forgot-password` | No | Send password reset email (doesn't reveal if email exists) |
| `POST` | `/reset-password` | No | Reset password with token from email |
| `GET` | `/me` | Required | Get current authenticated user |

#### Addresses (`/api/addresses`) – Auth Required
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List user's saved addresses |
| `POST` | `/` | Create address (auto-set default if first) |
| `DELETE` | `/:id` | Delete address |

#### Coupons (`/api/coupons`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Admin | List all coupons |
| `POST` | `/` | Admin | Create coupon (code, type, value, min order, max uses, expiry) |
| `PUT` | `/:id` | Admin | Update coupon (e.g., toggle isActive) |
| `DELETE` | `/:id` | Admin | Delete coupon |

#### Orders (`/api/orders`) – Auth Required
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Create order (validates stock, computes discount/shipping, creates Razorpay order) |
| `POST` | `/:id/verify-payment` | Verify Razorpay payment signature, fulfill order (deduct stock) |
| `GET` | `/` | List current user's orders (with items, address, coupon) |
| `GET` | `/:id` | Get order detail (own order or admin) |

#### Admin (`/api/admin`) – Auth + Admin Required
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stats` | Dashboard statistics (revenue, product/order/user count, low stock count, 10 recent orders) |
| `GET` | `/orders` | List all orders (pagination + status filter) |
| `GET` | `/orders/export` | Export orders as CSV file download |
| `PATCH` | `/orders/:id/status` | Update order status (auto-restores stock on cancellation) |
| `GET` | `/users` | List all users |

#### Product Management – Admin Only
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/products` | Create product (multipart: image + gallery files, sizes JSON) |
| `PUT` | `/api/products/:id` | Update product (partial update, size upsert, gallery management) |
| `DELETE` | `/api/products/:id` | Delete product (blocks if referenced in orders — deactivate instead) |
| `DELETE` | `/api/products/:id/images/:imageId` | Remove a single gallery image |
| `POST` | `/api/products/:id/stock` | Adjust stock level (with reason tracking, blocks if product has sizes) |
| `POST` | `/api/products/:id/sizes/:sizeId/stock` | Adjust per-size stock level |

#### Reviews
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products/:productId/reviews` | No | List approved reviews for a product (with average rating + count) |
| `POST` | `/api/products/:productId/reviews` | Required | Submit or update review |
| `GET` | `/api/products/:productId/reviews/me` | Required | Get current user's review for product |
| `DELETE` | `/api/products/:productId/reviews/me` | Required | Delete own review |
| `GET` | `/api/admin/reviews` | Admin | List all reviews (for moderation) |
| `PATCH` | `/api/admin/reviews/:id` | Admin | Moderate review (approve/hide) |
| `DELETE` | `/api/admin/reviews/:id` | Admin | Delete any review |

#### Wishlist (`/api/wishlist`) – Auth Required
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List user's wishlist items (with product details) |
| `POST` | `/` | Add product to wishlist |
| `DELETE` | `/:productId` | Remove product from wishlist |

#### Webhook (`/api/webhooks`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/razorpay` | Razorpay webhook handler (receives raw body before JSON parser) |

### Middleware
- **`requireAuth`**: Extracts JWT from `Authorization: Bearer` header or cookie, attaches `req.user = { id, role }`
- **`optionalAuth`**: Same but doesn't reject unauthenticated requests (silently ignores invalid tokens)
- **`requireAdmin`**: Ensures `req.user.role === "ADMIN"`, returns 403 otherwise
- **`errorHandler`**: Global error handler (Zod validation errors → 400, ApiError → status code, others → 500)
- **`asyncHandler`**: Wraps async route handlers to forward errors to Express error handler
- **`upload`** (Multer): Accepts JPEG/PNG/WEBP/GIF images, max 5MB, stores in `UPLOADS_DIR`
- **`authLimiter` / `orderLimiter`**: Rate limiters for auth and order endpoints

### Auth Flow
1. User registers/logs in → server sets `accessToken` (15min) and `refreshToken` (30d) as httpOnly cookies (SameSite=Lax, Secure in production)
2. Frontend API client auto-refreshes on 401 by calling `/auth/refresh` (one retry only)
3. Refresh tokens are stored in DB, one-time-use (deleted on refresh)
4. Logout clears cookies and deletes refresh token from DB
5. Guest checkout creates account with random password (can claim via forgot-password)
6. Password reset clears all refresh tokens (invalidates all sessions)

### Email
- **Nodemailer** configured via env vars
- **Password reset**: Sends email with reset link containing token
- **Order status**: Sends email when status changes to PROCESSING, SHIPPED, DELIVERED, or CANCELLED

---

## Frontend (`frontend/`)

### Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Global CSS (`globals.css`) – no CSS modules, Tailwind, or CSS-in-JS
- **State Management**: React Context (auth, cart, wishlist)
- **Fonts**: Playfair Display (display/headings) + Inter (body) via next/font/google

### Environment Variables
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API base URL |

### Pages (Routes)

#### `/` – Homepage
- **Type**: Server Component (async)
- Fetches 8 featured products
- Hero section with product image, headline, CTA, trust badges (free shipping, secure payments, easy returns)
- Featured products grid with staggered fade-in animations
- "View All Products" link

#### `/login` – Login
- **Type**: Client Component (wrapped in Suspense for useSearchParams)
- Email/password form
- Redirects: ADMIN → `/admin`, others → `?next` param or `/`
- Displays API errors inline, forgot password link, register link

#### `/register` – Registration
- **Type**: Client Component
- Name/email/password form (min 8 char password validation)
- Auto-redirects to `/` on success

#### `/forgot-password` – Forgot Password
- **Type**: Client Component
- Email input → sends reset link (shows success message regardless of whether email exists)

#### `/reset-password` – Reset Password
- **Type**: Client Component (wrapped in Suspense)
- Reads `?token` from URL, validates presence
- New password + confirm password form (with match validation)
- Redirects to `/login` on success

#### `/cart` – Shopping Cart
- **Type**: Client Component
- Reads from localStorage cart context
- Per-item: name, size, quantity input, line total, remove button
- Subtotal + "Proceed to Checkout" link
- Empty state message

#### `/checkout` – Checkout (most complex page)
- **Type**: Client Component
- Handles 3 states:
  1. **Not authenticated**: Guest name/email form → creates guest account
  2. **Authenticated**: Address selection (or create new), coupon code, order summary
  3. **Empty cart**: Redirects to empty state
- Razorpay payment modal integration (Script loaded via next/script)
- Payment verification → clear cart → redirect to order detail
- Error handling at each step

#### `/orders` – My Orders
- **Type**: Client Component
- Auth guard (redirects to login)
- Table: order #, date, items count, total, status badge
- Links to order detail

#### `/orders/[id]` – Order Detail
- **Type**: Client Component
- Auth guard (redirects to login)
- Order #, status badge, placed date
- Items list with pricing, subtotal, discount, shipping fee, total
- Shipping address display

#### `/products` – Product Listing
- **Type**: Client Component (wrapped in Suspense)
- Search input (debounced 400ms), category filter dropdown
- Paginated grid (12 per page) with previous/next buttons
- Skeleton loading state (animated shimmer)
- Empty state for no matches

#### `/products/[id]` – Product Detail
- **Type**: Server Component (`params: Promise<{ id: string }>`)
- ProductGallery component (cover + thumbnail images, wishlist button)
- Category, name, description, price (INR formatted)
- Stock count (or size selector with per-size stock)
- AddToCartButton component
- ProductReviews section at bottom

#### `/wishlist` – Wishlist
- **Type**: Client Component
- Auth guard (redirects to login)
- Grid of wishlisted products using ProductCard
- Empty state message

#### `/admin` – Admin Dashboard
- **Type**: Client Component (inside AdminLayout)
- **Dashboard**: 5 stat cards (Revenue, Orders, Products, Users, Low Stock) + Recent Orders table
- **Products**: Table with name, category, price, stock, status, edit/delete buttons + "New Product" link
- **Categories**: Create form + table with delete
- **Coupons**: Create form (code, type %/fixed, value, min order) + table with enable/disable/delete
- **Orders**: Status filter dropdown + table with status change dropdown + CSV export link
- **Reviews**: Table with product, customer, star rating, comment, visibility toggle + delete

#### Admin Layout (`/admin/layout.tsx`)
- **Type**: Client Component
- Role-gated: redirects non-ADMIN to login
- Dark sidebar with brand mark, navigation links (Dashboard, Products, Categories, Coupons, Orders, Reviews)
- "View Store" link back to frontend
- User avatar (initial letter) with name and "Administrator" label

### Components

#### `Header.tsx`
- Client component
- Sticky header with scroll shadow effect
- Brand "NovaShop", nav links: Home, Products, Cart (with count badge), Wishlist (if auth'd), Orders (if auth'd), Admin (if ADMIN), Login/Logout (with user name)
- Animated underline hover effect on links

#### `Footer.tsx`
- Client component (hides on `/admin` routes)
- Brand, tagline, nav links, copyright

#### `ProductCard.tsx`
- Server component (but contains WishlistButton which is client)
- Image (next/image), category badge, product name, price (INR)
- WishlistButton overlay (position: absolute top-right)
- "View Product" CTA link
- Hover: scale image + translate card + shadow

#### `ProductGallery.tsx`
- Client component
- Large main image with WishlistButton overlay
- Thumbnail strip below for additional gallery images
- Click thumbnail to switch active image

#### `AddToCartButton.tsx`
- Client component
- Size selector (if product has sizes): buttons for each size with stock indicator
- Selected size stock display
- Add to cart button with "Added!" feedback (1.5s)
- Disabled states: out of stock, no size selected

#### `WishlistButton.tsx`
- Client component
- Heart icon (filled/outline) with pop animation on toggle
- Redirects to login if not authenticated
- Prevents event propagation for use inside cards

#### `StarRating.tsx`
- Client component
- 5 SVG stars (filled gold / outlined gray)
- Supports display mode (static) and interactive mode (onChange callback)
- Scales via CSS transform

#### `ProductReviews.tsx`
- Client component
- Average rating display with star count
- If authenticated: submit/update review form (star selector + comment textarea)
- If not authenticated: "Log in to write a review" link
- Review list: author name, stars, date, comment text
- Delete own review button
- All reviews shown (admin moderated via `isApproved` flag)

#### `Reveal.tsx`
- Client component
- IntersectionObserver-based scroll reveal animation
- Fade in + translate up on viewport entry
- Configurable delay via `delay` prop
- Respects `prefers-reduced-motion`

#### `admin/ProductForm.tsx`
- Client component
- Create/Edit mode (determined by optional `product` prop)
- Fields: name, description, price, stock (or sizes), category dropdown, cover image (required for create), gallery photos (up to 6), active toggle
- Size management: checkbox to enable "Sell by size", add/remove size rows with labels and stock
- Validates unique size labels, at least one size when enabled
- Existing gallery images shown with remove button
- Multipart form upload via FormData

#### `admin/icons.tsx`
- SVG icon components: DashboardIcon, ProductsIcon, CategoriesIcon, CouponsIcon, OrdersIcon, ReviewsIcon, RevenueIcon, BagIcon, UsersIcon, AlertIcon, StoreLinkIcon, HeartIcon (with filled prop)

### Context Providers

#### `AuthProvider` (`lib/auth-context.tsx`)
- On mount: calls `GET /auth/me` to restore session from cookies
- Provides: `user`, `loading`, `login()`, `register()`, `logout()`, `continueAsGuest()`
- User type: `{ id, name, email, role: "USER" | "ADMIN" }`

#### `CartProvider` (`lib/cart-context.tsx`)
- localStorage persistence with hydration guard (checks `typeof window`)
- Provides: `items`, `count`, `subtotal`, `addItem()`, `removeItem()`, `setQuantity()`, `clear()`
- CartItem: `{ productId, name, price, image, stock, quantity, size? }`
- `addItem()` increments quantity if item already exists in cart

#### `WishlistProvider` (`lib/wishlist-context.tsx`)
- Syncs with backend on mount if user is authenticated
- Provides: `items`, `loading`, `isWishlisted(productId)`, `toggle(productId)`
- Calls backend API for add/remove operations

### API Client (`lib/api.ts`)
- Base URL from `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:5000/api`)
- Uses `fetch` with `credentials: "include"` for cookie-based auth
- `cache: "no-store"` for fresh data on every request
- Automatic 401 → refresh retry logic (single retry via `/auth/refresh`)
- Supports both JSON and FormData body types
- `resolveImage(src)`: Converts relative image paths to absolute URLs
- `ApiRequestError` class with HTTP status code for consistent error handling
- Full TypeScript types for all API responses
- Functions organized by domain: products, categories, auth, addresses, coupons, orders, admin, reviews, wishlist

### Formatting (`lib/format.ts`)
- `formatINR()`: Converts number/string to `₹X,XXX` Indian locale format (e.g., `₹1,23,456.78`)

### Shipping (`lib/shipping.ts`)
- `FREE_SHIPPING_THRESHOLD = 1999`
- `computeShippingFee(subtotal)`: Returns 0 if subtotal >= threshold, otherwise `shippingFee` (₹49)

---

## Styling (`globals.css`)

### Design System
- **Single CSS file** — no CSS modules, Tailwind, or CSS-in-JS
- **CSS Custom Properties**:
  - `--bg`: `#faf8f4` (warm off-white background)
  - `--ink`: `#1c1a17` (near-black text)
  - `--ink-soft`: `#6b6459` (muted text)
  - `--accent`: `#9c7a4f` (gold/brown accent)
  - `--accent-dark`: `#7c6039` (darker accent)
  - `--border`: `#e6e0d6` (light border)
  - `--card-bg`: `#ffffff` (white card background)
- **Fonts**: Playfair Display (serif, for headings — via `--font-display`), Inter (sans-serif, for body — via `--font-body`)

### Key Classes
| Class | Purpose |
|---|---|
| `.container` | Max-width 1180px centered wrapper |
| `.section` | Vertical section padding (64px) |
| `.hero` / `.hero-inner` | Homepage hero (2-column grid with product image) |
| `.button` / `.button-secondary` / `.button-danger` / `.button-sm` | Button system |
| `.grid` | Auto-fit product grid (min 250px columns, 32px gap) |
| `.card` / `.card-body` | Product card with hover effects |
| `.product-page` | Product detail 2-column layout |
| `.cart-row` | Cart item row |
| `.form` / `.form-wide` / `.form-row` / `.field` | Form layout |
| `.table` | Data table with hover rows |
| `.badge` / `.badge-PAID` / `.badge-PENDING` / etc. | Status badges (color-coded) |
| `.auth-page` | Centered narrow auth form wrapper |
| `.summary-row` | Order summary line item |
| `.qty-input` | Cart quantity input (70px) |
| `.admin-shell` / `.admin-sidebar` / `.admin-main` | Admin panel layout |
| `.stat-grid` / `.stat-card` / `.stat-icon-*` | Dashboard stat cards |

### Animations
- **`fadeInUp`**: Elements fade in + translate up (used by grid items)
- **`pageFadeIn`**: Page transitions via `template.tsx` (`.page-fade` class)
- **`heartPop`**: Wishlist button heart animation (scale 1 → 1.4 → 0.88 → 1)
- **`shimmer`**: Skeleton loading shimmer effect
- **`.reveal` / `.reveal-visible`**: Scroll-triggered fade-in via IntersectionObserver
- **Button shine**: Pseudo-element that slides across on hover
- **Hero zoom**: Background image slow zoom animation
- **Grid stagger**: Children animate with cascading delays (8 levels)
- **Respects `prefers-reduced-motion`**: Disables all animations

### Responsive Breakpoints
- **860px**: Hero switches to single column, image first
- **700px**: Smaller font sizes, single column product page, tighter grid layout

---

## Running the Project

```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Run database migrations
cd backend && npx prisma migrate dev

# Seed development data
cd backend && npm run prisma:seed

# Start both servers concurrently (from root)
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (Express API) | http://localhost:5000 |

---

## Key Patterns & Conventions

1. **Server Components by default** — Data fetching happens server-side where possible (homepage, product detail)
2. `"use client"` directive used only for interactive components (cart, auth, admin, checkout, reviews, wishlist, animations)
3. **Async route params** — Uses `Promise<{id:string}>` pattern for `params` in dynamic routes
4. **ESM backend** — Backend uses ES modules (`"type": "module"` in package.json)
5. **Cacheless API calls** — `cache: "no-store"` for fresh data on every request
6. **localStorage cart** — Client-side cart persists in browser storage (no backend cart endpoint)
7. **INR formatting** — Prices displayed with Indian Rupee format using `toLocaleString("en-IN")`
8. **Cookie-based auth** — httpOnly cookies for JWT tokens (access + refresh), auto-refresh on 401
9. **Zod validation** — All request bodies/queries validated on backend with detailed error messages
10. **API error class** — `ApiRequestError` on frontend, `ApiError` on backend for consistent error handling
11. **Admin guard** — Admin layout checks role and redirects; backend enforces with `requireAdmin + requireAuth`
12. **Database transactions** — Prisma `$transaction` used for order fulfillment, stock updates, password reset
13. **Order status lifecycle** — PENDING → PAID → PROCESSING → SHIPPED → DELIVERED (or CANCELLED/FAILED)
14. **Stock management** — Automatic deduction on payment (order fulfillment), restoration on cancellation, tracked via StockMovement audit trail
15. **Dual stock mode** — Simple stock (Product.stock) or per-size stock (ProductSize with sum of sizes)
16. **Size management** — Products can optionally be sold by size; sizes are upserted on product update
17. **Guest checkout flow** — Creates account with random password, can be claimed later via forgot-password
18. **Wishlist sync** — Wishlist context syncs with backend API when user is authenticated
19. **Rate limiting** — Separate rate limiters for auth endpoints and order creation
20. **CSV export** — Admin can export filtered orders as CSV with proper field escaping
21. **Skeleton loading** — Animated shimmer placeholders shown during product list loading
22. **Scroll reveal** — IntersectionObserver-based fade-in animations for sections
23. **Razorpay integration** — Frontend loads Razorpay script dynamically, backend creates/verifies orders
24. **Webhook ready** — Webhook route mounted before JSON parser to receive raw body for signature verification

---

## Security Features

- **Password hashing**: bcrypt with 12 salt rounds
- **JWT token rotation**: Refresh tokens are one-time-use (deleted on refresh)
- **MySQL connection**: Parameterized queries via Prisma (prevents SQL injection)
- **CORS**: Restricted to configured FRONTEND_URL
- **Helmet**: Security headers (CSP disabled for API-only, cross-origin resource policy for images)
- **File upload validation**: MIME type whitelist (JPEG/PNG/WEBP/GIF) + 5MB size limit
- **Payment verification**: Server-side Razorpay signature validation (not client-trustable)
- **CSRF protection**: httpOnly cookies with SameSite=Lax
- **Email enumeration prevention**: Forgot password returns same message whether or not email exists
- **Product deletion protection**: Blocks deletion if product appears in existing orders (deactivate instead)
- **Admin-only endpoints**: All admin routes enforce requireAuth + requireAdmin
- **Order ownership**: Users can only view their own orders (admins can view all)
- **Rate limiting**: Protects auth and order endpoints from brute force / abuse