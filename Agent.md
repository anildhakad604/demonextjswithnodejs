# Project Overview: Next.js + Node.js E-commerce (SweetyNX)

A full-stack e-commerce application built with **Next.js 15 (App Router)** and **Node.js/Express**, using **MySQL** as the database with **Prisma ORM**. The project runs as a monorepo with concurrent development servers. Originally named "NovaShop", the project has been rebranded to **SweetyNX** with significant feature additions.

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
│       ├── schema.prisma     # Database schema (MySQL) – 22 models
│       ├── seed.ts           # Seed script for development
│       └── migrations/       # Prisma migrations
│   └── src/
│       ├── server.ts         # Express app entry point
│       ├── lib/
│       │   ├── prisma.ts     # Prisma client singleton
│       │   ├── jwt.ts        # JWT signing and verification (access + refresh tokens)
│       │   ├── razorpay.ts   # Razorpay payment SDK + signature verification
│       │   ├── email.ts      # Nodemailer email sending utility
│       │   ├── emailTemplates.ts # HTML email templates (password reset, order status, contact message)
│       │   ├── orderFulfillment.ts # Order fulfillment logic (deduct stock, record movement)
│       │   ├── shipping.ts   # Shipping fee calculation (free threshold ₹1,999)
│       │   ├── params.ts     # Parameter validation helper
│       │   ├── sms.ts        # Pluggable SMS sender for mobile+OTP login flow
│       │   └── reservedSlugs.ts # Reserved category slugs that conflict with Next.js routes
│       ├── middleware/
│       │   ├── auth.ts       # requireAuth, optionalAuth, requireAdmin middleware
│       │   ├── errorHandler.ts # ApiError class + global error handler + asyncHandler wrapper
│       │   ├── rateLimit.ts  # Rate limiters (auth, order)
│       │   └── upload.ts     # Multer file upload config (images)
│       └── routes/
│           ├── auth.routes.ts      # Register, login, guest checkout, refresh, logout, /me, forgot/reset password, OTP request/verify
│           ├── product.routes.ts   # CRUD + stock adjustment (+ size-specific stock) + filters endpoint
│           ├── category.routes.ts  # CRUD
│           ├── subCategory.routes.ts # CRUD for subcategories (nested under categories)
│           ├── address.routes.ts   # CRUD (user-scoped)
│           ├── coupon.routes.ts    # CRUD + validate (with discount computation) + active coupon endpoint
│           ├── cart.routes.ts      # Server-persisted cart CRUD (replaces localStorage cart)
│           ├── order.routes.ts     # Create order, verify payment, list/get orders, cancel order
│           ├── admin.routes.ts     # Dashboard stats, admin order management, CSV export, users
│           ├── review.routes.ts    # Product reviews (submit, update, list, moderate)
│           ├── wishlist.routes.ts  # Wishlist CRUD (add/remove/list)
│           ├── banner.routes.ts    # Homepage banner CRUD (6 types: HERO, MID, BIG_CATEGORY, CATEGORY_CARD, CELEB, FASHION_VIDEO)
│           ├── announcement.routes.ts # Top announcement bar CRUD (single active announcement)
│           ├── contentBlock.routes.ts  # A+ product content blocks (HEADING_TEXT, IMAGE_TEXT, FEATURE_GRID, FULL_IMAGE)
│           ├── contact.routes.ts   # Contact form submission (sends email)
│           ├── wallet.routes.ts    # Wallet balance + transaction history
│           ├── loyaltyPoints.routes.ts # Loyalty points balance + transaction history
│           └── webhook.routes.ts   # Razorpay webhook handler (raw body)
│
├── frontend/                 # Next.js app (port 3000)
    ├── .env.local / .env.local.example
    ├── package.json
    ├── tsconfig.json
    ├── next-env.d.ts
    ├── next.config.ts
    ├── app/
    │   ├── globals.css                 # Global styles (base design system)
    │   ├── styles/                     # Modular CSS files by page/section
    │   │   ├── sweetynx-tokens.css     # Design tokens (CSS custom properties)
    │   │   ├── header-footer.css       # Header & footer styles
    │   │   ├── home.css                # Homepage styles
    │   │   ├── listing.css             # Product listing page styles
    │   │   ├── pdp.css                 # Product detail page styles
    │   │   ├── cart.css                # Cart page styles
    │   │   ├── checkout.css            # Checkout page styles
    │   │   ├── login.css               # Login/register/auth page styles
    │   │   ├── dashboard.css           # Customer dashboard styles
    │   │   ├── wishlist.css            # Wishlist page styles
    │   │   └── info.css                # Info pages (FAQ, contact, terms) styles
    │   ├── layout.tsx                  # Root layout: fonts, AuthProvider → CartProvider → WishlistProvider → CurrencyProvider → Header → children → Footer
    │   ├── template.tsx                # Page fade-in animation wrapper
    │   ├── page.tsx                    # Homepage (hero carousel + flash sale + mid banner + new arrivals + category grids + celeb section + recommendations)
    │   ├── [category]/[subcategory]/[sku]/page.tsx  # Product detail page (canonical URL: /{category}/{subcategory}/{sku})
    │   ├── listing/[[...slug]]/page.tsx # Product listing with filters (category/subcategory from URL, search, size, color, price, sort, pagination)
    │   ├── login/page.tsx              # Login form (redirects to admin or ?next)
    │   ├── register/page.tsx           # Registration form (min 8 char password)
    │   ├── admin-login/page.tsx        # Separate admin login page (role-gated)
    │   ├── forgot-password/page.tsx    # Email input → sends reset link
    │   ├── reset-password/page.tsx     # Token from URL + new password form
    │   ├── cart/page.tsx               # Cart (from server-side cart API)
    │   ├── checkout/page.tsx           # Full checkout: guest flow, address selection/creation, coupon, Razorpay
    │   ├── orders/page.tsx             # My Orders list (table with status badges)
    │   ├── orders/[id]/page.tsx        # Order detail (items, address, pricing breakdown)
    │   ├── products/page.tsx           # Product listing with search, category filter, pagination (legacy)
    │   ├── products/[id]/page.tsx      # Product detail (legacy, replaced by [category]/[subcategory]/[sku])
    │   ├── wishlist/page.tsx           # User's wishlisted products grid
    │   ├── dashboard/page.tsx          # Customer account dashboard (tab-based: orders, help, profile, address, wishlist, returns, wallet, points)
    │   ├── info/[slug]/page.tsx        # Static info pages (terms, returns, shipping, privacy, contact-us, faq)
    │   └── admin/
    │       ├── layout.tsx              # Admin layout (role-gated, sidebar nav, avatar)
    │       ├── page.tsx                # Dashboard stats (revenue, orders, products, users, low stock)
    │       ├── products/page.tsx       # Admin product list (edit/delete)
    │       ├── products/new/page.tsx   # New product form
    │       ├── products/[id]/page.tsx  # Edit product form
    │       ├── categories/page.tsx     # Admin category management (create/delete + subcategories)
    │       ├── coupons/page.tsx        # Admin coupon management (create/enable/disable/delete)
    │       ├── orders/page.tsx         # Admin order management (filter by status, update, CSV export)
    │       ├── reviews/page.tsx        # Admin review moderation (show/hide/delete)
    │       ├── banners/page.tsx        # Admin banner management (create/edit/delete for all 6 types)
    │       └── announcements/page.tsx  # Admin announcement management (create/edit/delete)
    ├── components/
    │   ├── Header.tsx                  # Sticky header (scroll-aware, auth-aware, cart count, currency switcher)
    │   ├── Footer.tsx                  # Footer (hidden on admin pages)
    │   ├── ProductCard.tsx             # Product grid card (image, category, name, price, wishlist button)
    │   ├── ProductGallery.tsx          # Image gallery with thumbnail selector
    │   ├── ProductReviews.tsx          # Review list + submit/update/delete (star rating)
    │   ├── ProductAccordion.tsx        # Accordion for product details + return policy
    │   ├── ProductContentBlocks.tsx    # A+ content block renderer (4 block types)
    │   ├── AddToCartButton.tsx         # Client: size selector + add to server cart
    │   ├── WishlistButton.tsx          # Heart toggle button (with login redirect)
    │   ├── StarRating.tsx              # Interactive/static star rating SVG component
    │   ├── ColorChips.tsx              # Color variant swatch links for PDP
    │   ├── PriceTag.tsx                # Currency-aware price display component
    │   ├── OfferCard.tsx               # Active coupon offer card on PDP
    │   ├── CurrencySwitcher.tsx        # Currency selector dropdown (INR/USD/GBP/SAR)
    │   ├── ContactForm.tsx             # Contact form component
    │   ├── FaqList.tsx                 # FAQ list with category tabs
    │   ├── RichTextEditor.tsx          # CKEditor5 rich text editor wrapper (dynamic import)
    │   ├── RichTextEditorInner.tsx     # CKEditor5 implementation (GPL license)
    │   ├── Reveal.tsx                  # Scroll-reveal animation (IntersectionObserver)
    │   ├── home/
    │   │   ├── HomeSections.tsx        # Homepage section layout (hero carousel, flash sale, new arrivals, categories, celeb, recommendations)
    │   │   └── Carousel.tsx            # Reusable carousel component (Swiper-based)
    │   ├── listing/
    │   │   └── ListingProductCard.tsx  # Product card for listing page (with color swatches)
    │   ├── dashboard/
    │   │   ├── OrdersTab.tsx           # Customer order history tab
    │   │   ├── ProfileTab.tsx          # Profile editing tab
    │   │   ├── AddressBookTab.tsx      # Address management tab
    │   │   ├── WishlistTab.tsx         # Wishlist tab
    │   │   ├── WalletTab.tsx           # Wallet balance + transactions tab
    │   │   └── PointsTab.tsx           # Loyalty points balance + transactions tab
    │   └── admin/
    │       ├── ProductForm.tsx         # Admin product create/edit form (images, sizes, stock, content blocks)
    │       └── icons.tsx               # SVG icon components for admin sidebar
    └── lib/
        ├── api.ts                     # Full API client (fetch with auto-refresh on 401, TypeScript types)
        ├── auth-context.tsx            # React context for auth state (login, register, logout, guest, OTP, updateProfile)
        ├── cart-context.tsx            # React context for server-side cart (add, remove, quantity, subtotal)
        ├── wishlist-context.tsx        # React context for wishlist (sync with backend, isWishlisted, toggle)
        ├── currency-context.tsx        # React context for currency switching (INR/USD/GBP/SAR)
        ├── currency.ts                # Currency conversion + formatting utilities
        ├── format.ts                  # formatINR() — Indian Rupee formatter
        └── shipping.ts                # FREE_SHIPPING_THRESHOLD, computeShippingFee()
```

---

## Backend (`backend/`)

### Stack
- **Runtime**: Node.js with TypeScript (ESM via `"type": "module"`)
- **Framework**: Express.js (with `tsx` hot-reload for development)
- **Database**: **MySQL** via Prisma ORM (NOT SQL Server)
- **Auth**: JWT (access + refresh tokens) with bcrypt password hashing (12 rounds) + OTP-based mobile login
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
| `nodemailer` | Email sending |

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
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | (optional) | Email server credentials |
| `CONTACT_EMAIL` | `admin@example.com` | Contact form recipient |
| `SMS_PROVIDER_API_KEY` | (optional) | SMS provider API key for OTP |

### Database Schema (Prisma – MySQL) — 22 Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **User** | id (uuid), name, email (unique), phone (unique?), passwordHash, role (USER/ADMIN) | Authentication & authorization |
| **OtpCode** | phone, code, expiresAt, consumedAt, attempts | One-time OTP for mobile login flow |
| **RefreshToken** | token (unique), userId, expiresAt | JWT refresh token rotation (one-time-use) |
| **PasswordResetToken** | token (unique), userId, expiresAt | Password reset flow (1hr expiry) |
| **Address** | userId, fullName, phone, line1, line2?, city, state, postalCode, country (default "India"), isDefault | Shipping addresses |
| **Category** | name (unique), slug (unique) | Product categorization |
| **SubCategory** | categoryId, name, slug (unique per category) | One level of category nesting |
| **Product** | name, slug (unique), skuCode (unique), description, price (Decimal(10,2)), actualPrice?, isFlashSale, isFastDelivery, colorGroupId?, colorName?, colorSwatchHex?, image, stock, lowStockThreshold (default 5), isActive, categoryId, subCategoryId? | Core product data |
| **ProductContentBlock** | productId, type, sortOrder, data (Json) | A+ enhanced content modules (4 types) |
| **ProductImage** | productId, url, sortOrder | Gallery photos (up to 6 additional images) |
| **ProductSize** | productId, size, stock | Size variants (S/M/L/XL etc.) — unique per product+size |
| **StockMovement** | productId, productSizeId?, change, reason, createdAt | Audit trail for all stock changes |
| **Review** | productId, userId, rating (1-5), comment, imageUrl?, isApproved (default true) | Product reviews — one per user per product |
| **WishlistItem** | userId, productId | User wishlist — unique per user+product |
| **Coupon** | code (unique), discountType (PERCENTAGE/FIXED), discountValue (Decimal), minOrderValue, maxUses?, usedCount, expiresAt?, isActive, offerText? | Discount coupons |
| **Banner** | type, imageUrl, linkUrl?, title?, sortOrder, isActive | Homepage/marketing image slots (6 types) |
| **Announcement** | text, isActive | Single scrolling top-bar announcement |
| **Cart** | userId (unique) | Server-persisted shopping cart |
| **CartItem** | cartId, productId, size?, quantity | Cart line items |
| **Wallet** | userId (unique), balance (Decimal) | Customer wallet |
| **WalletTransaction** | walletId, amount (signed Decimal), label, orderId? | Wallet transaction history |
| **LoyaltyPoints** | userId (unique), balance (Int) | Loyalty points |
| **LoyaltyPointsTransaction** | pointsId, points (signed Int), label, orderId? | Points transaction history |
| **Order** | userId, addressId, status (PENDING/PAID/PROCESSING/SHIPPED/DELIVERED/CANCELLED/FAILED), subtotal, discount, shippingFee, total, couponId?, razorpayOrderId?, razorpayPaymentId?, razorpaySignature?, paidAt? | Order management |
| **OrderItem** | orderId, productId, name (snapshot), size?, price (Decimal), quantity | Line items within orders |

Key relationships:
- User has many Addresses, Orders, RefreshTokens, PasswordResetTokens, Reviews, WishlistItems; has one Cart, Wallet, LoyaltyPoints
- Product belongs to Category and optionally SubCategory; has many OrderItems, StockMovements, ProductSizes, ProductImages, Reviews, WishlistItems, ContentBlocks, CartItems
- Product has colorGroupId for color variant linking (sibling products, not a dropdown)
- Order belongs to User and Address, optionally has Coupon, has many OrderItems
- StockMovement tracks inventory changes per product (optionally per size)
- Roles and statuses are validated at the application layer (MySQL has no enums)

### API Endpoints

#### Public
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/products` | List products (filter: category slug, subCategory, search, size, color, minPrice, maxPrice, isFlashSale, sort, page, limit, includeInactive) |
| `GET` | `/api/products/:idOrSlug` | Get single product (by ID, slug, or skuCode) |
| `GET` | `/api/products/filters` | Get available filters (sizes, colors, subCategories, priceRange) for a category |
| `GET` | `/api/categories` | List all categories (with subCategories) |
| `GET` | `/api/banners` | List active banners (optional type filter) |
| `GET` | `/api/announcement` | Get active announcement |
| `GET` | `/api/coupons/active` | Get active coupon with offer text (for PDP offer card) |
| `POST` | `/api/coupons/validate` | Validate coupon code and compute discount |
| `POST` | `/api/contact` | Submit contact form (rate-limited) |

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
| `POST` | `/otp/request` | No | Request OTP for mobile login (rate-limited) |
| `POST` | `/otp/verify` | No | Verify OTP and login |
| `GET` | `/me` | Required | Get current authenticated user |
| `PATCH` | `/me` | Required | Update profile (name) |

#### Addresses (`/api/addresses`) – Auth Required
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List user's saved addresses |
| `POST` | `/` | Create address (auto-set default if first) |
| `DELETE` | `/:id` | Delete address |

#### Cart (`/api/cart`) – Auth Required
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get server-side cart (with items, count, subtotal) |
| `POST` | `/items` | Add item to cart (validates stock, merges duplicates) |
| `PATCH` | `/items/:id` | Update cart item (quantity, size) |
| `DELETE` | `/items/:id` | Remove item from cart |
| `DELETE` | `/` | Clear entire cart |

#### Coupons (`/api/coupons`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Admin | List all coupons |
| `POST` | `/` | Admin | Create coupon (code, type, value, min order, max uses, expiry, offerText) |
| `PUT` | `/:id` | Admin | Update coupon (e.g., toggle isActive, offerText) |
| `DELETE` | `/:id` | Admin | Delete coupon |

#### Orders (`/api/orders`) – Auth Required
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Create order (validates stock, computes discount/shipping, creates Razorpay order) |
| `POST` | `/:id/verify-payment` | Verify Razorpay payment signature, fulfill order (deduct stock) |
| `POST` | `/:id/cancel` | Cancel own order (if PENDING/PAID) |
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

#### A+ Content Blocks – Admin Only
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/products/:productId/content-blocks` | Create content block (multipart: image for IMAGE_TEXT/FULL_IMAGE types) |
| `PUT` | `/api/products/:productId/content-blocks/reorder` | Reorder content blocks |
| `PUT` | `/api/products/:productId/content-blocks/:blockId` | Update content block |
| `DELETE` | `/api/products/:productId/content-blocks/:blockId` | Delete content block |

#### Banners – Admin Only
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/banners/admin` | List all banners (including inactive) |
| `POST` | `/api/banners` | Create banner (multipart: image, type, linkUrl, title, sortOrder) |
| `PUT` | `/api/banners/:id` | Update banner |
| `DELETE` | `/api/banners/:id` | Delete banner |

#### Announcements – Admin Only
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/announcement/admin` | List all announcements |
| `POST` | `/api/announcement` | Create announcement (deactivates others if isActive) |
| `PUT` | `/api/announcement/:id` | Update announcement |
| `DELETE` | `/api/announcement/:id` | Delete announcement |

#### SubCategories – Admin Only
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/subcategories` | Create subcategory (name, categoryId) |
| `PUT` | `/api/subcategories/:id` | Update subcategory name |
| `DELETE` | `/api/subcategories/:id` | Delete subcategory (blocks if has products) |

#### Wallet & Loyalty Points – Auth Required
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wallet` | Get wallet balance + transaction history |
| `GET` | `/api/loyalty-points` | Get loyalty points balance + transaction history |

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
7. **Mobile OTP login**: Request OTP via `/auth/otp/request` (rate-limited), verify via `/auth/otp/verify` — SMS provider is pluggable, OTP is logged to console in dev mode
8. **Admin login**: Separate `/admin-login` page, role-gated (redirects non-ADMIN users)

### Email
- **Nodemailer** configured via env vars
- **Password reset**: Sends email with reset link containing token
- **Order status**: Sends email when status changes to PROCESSING, SHIPPED, DELIVERED, or CANCELLED
- **Contact form**: Sends contact message to admin email

### SMS (OTP)
- Pluggable SMS sender for mobile+OTP login flow
- With no provider configured, OTP is logged to console (and returned in API response in non-production)
- Placeholder for real integration (Twilio, MSG91, 2Factor, etc.)

---

## Frontend (`frontend/`)

### Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Modular CSS files in `app/styles/` + base `globals.css` — no CSS modules, Tailwind, or CSS-in-JS
- **State Management**: React Context (auth, cart, wishlist, currency)
- **Fonts**: Playfair Display (display/headings) + Inter (body) via next/font/google
- **Rich Text**: CKEditor5 (GPL license) for admin product description editing
- **Carousel**: Swiper-based custom Carousel component

### Environment Variables
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API base URL |

### Pages (Routes)

#### `/` – Homepage
- **Type**: Server Component (async)
- Fetches hero banners, flash sale products, mid banner, new arrivals, big category banners, category card banners, celeb banners, recommendations, categories
- Hero carousel section with autoplay
- Flash Sale carousel with discount badges
- Mid-banner image section
- New Arrivals carousel
- Big Category grid (4 items)
- Shop By Category carousel
- Celebs in SweetyNX carousel
- Recommendation grid
- Uses `HomeSections` client component for interactive sections

#### `/{category}/{subcategory}/{sku}` – Product Detail (Canonical URL)
- **Type**: Server Component (`params: Promise<{ category: string; subcategory: string; sku: string }>`)
- Canonical URL structure matching Sweetynx's SKU-based URLs
- Fetches product by skuCode, validates category slug matches, redirects to canonical URL if needed
- Breadcrumb navigation (Home > Category > Subcategory > Product)
- ProductGallery component (cover + thumbnail images)
- ColorChips component for color variant navigation
- PriceTag with discount percentage display
- AddToCartButton component
- OfferCard component (active coupon display)
- ProductAccordion (details + return policy)
- ProductContentBlocks (A+ content modules)
- "You May Also Like" related products section
- ProductReviews section

#### `/listing/[[...slug]]` – Product Listing (Catch-all route)
- **Type**: Client Component (wrapped in Suspense)
- URL structure: `/listing`, `/listing/{category}`, `/listing/{category}/{subCategory}`
- Search input (from query params), category/subcategory from URL path
- Filter panel: subcategory radio, color swatches, size checkboxes, price brackets
- Sort dropdown: POPULAR, WHAT'S NEW, DISCOUNT, PRICE LOW TO HIGH, PRICE HIGH TO LOW
- Grid view switcher (2/3/4 columns, persisted in localStorage)
- Active filter chips with remove buttons
- Paginated grid (12 per page) with previous/next buttons
- Skeleton loading state (animated shimmer)
- Empty state for no matches
- Mobile-responsive filter overlay

#### `/login` – Login
- **Type**: Client Component (wrapped in Suspense for useSearchParams)
- Email/password form
- Redirects: ADMIN → `/admin`, others → `?next` param or `/`
- Displays API errors inline, forgot password link, register link

#### `/admin-login` – Admin Login
- **Type**: Client Component (wrapped in Suspense)
- Separate login page for admin users
- Role-gated: checks `user.role !== "ADMIN"` and shows error
- Redirects to `/admin` on success

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
- Reads from server-side cart API (not localStorage)
- Per-item: image, name, size, quantity input, line total, remove button
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

#### `/products` – Product Listing (Legacy)
- **Type**: Client Component (wrapped in Suspense)
- Search input (debounced 400ms), category filter dropdown
- Paginated grid (12 per page) with previous/next buttons
- Skeleton loading state (animated shimmer)
- Empty state for no matches

#### `/products/[id]` – Product Detail (Legacy)
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

#### `/dashboard` – Customer Account Dashboard
- **Type**: Client Component (wrapped in Suspense)
- Auth guard (redirects to login)
- Tab-based layout with sidebar navigation:
  - **My Orders**: Order history with status badges
  - **Help Center**: FAQ links for orders, returns, payments, coupons
  - **About You**: Profile editing (name, read-only email/phone)
  - **Address Book**: Address management (add/delete)
  - **My Wishlist**: Wishlisted products grid
  - **My Returns**: Return policy info
  - **My Wallet**: Wallet balance + transaction history
  - **Sweety Points**: Loyalty points balance + transaction history
- Help banner with phone number

#### `/info/[slug]` – Info Pages
- **Type**: Server Component (async)
- Static pages: terms-conditions, returns-policy, shipping-information, privacy-policy
- Dynamic pages: contact-us (ContactForm component), faq (FaqList component)

#### `/admin` – Admin Dashboard
- **Type**: Client Component (inside AdminLayout)
- **Dashboard**: 5 stat cards (Revenue, Orders, Products, Users, Low Stock) + Recent Orders table
- **Products**: Table with name, category, price, stock, status, edit/delete buttons + "New Product" link
- **Categories**: Create form + table with delete + subcategory management
- **Coupons**: Create form (code, type %/fixed, value, min order, offer text) + table with enable/disable/delete
- **Orders**: Status filter dropdown + table with status change dropdown + CSV export link
- **Reviews**: Table with product, customer, star rating, comment, visibility toggle + delete
- **Banners**: Create form (type, image, link, title, sort order) + table with edit/delete
- **Announcements**: Create form (text, active toggle) + table with edit/delete

#### Admin Layout (`/admin/layout.tsx`)
- **Type**: Client Component
- Role-gated: redirects non-ADMIN to login
- Dark sidebar with brand mark, navigation links (Dashboard, Products, Categories, Coupons, Orders, Reviews, Banners, Announcements)
- "View Store" link back to frontend
- User avatar (initial letter) with name and "Administrator" label

### Components

#### `Header.tsx`
- Client component
- Sticky header with scroll shadow effect
- Brand "SweetyNX", nav links: Home, Products, Cart (with count badge), Wishlist (if auth'd), Orders (if auth'd), Admin (if ADMIN), Login/Logout (with user name)
- CurrencySwitcher component
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
- Uses server-side cart API (not localStorage)

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

#### `ProductAccordion.tsx`
- Client component
- Accordion for PRODUCT DETAILS and RETURN POLICY sections
- Toggle open/close per section

#### `ProductContentBlocks.tsx`
- Server component
- Renders A+ content blocks (4 types):
  - HEADING_TEXT: title + body
  - IMAGE_TEXT: image + text (left/right layout)
  - FEATURE_GRID: title + grid of feature items
  - FULL_IMAGE: full-width image with optional caption

#### `ColorChips.tsx`
- Client component
- Color variant swatch links for PDP
- Links to sibling products sharing the same colorGroupId
- Active state indicator

#### `PriceTag.tsx`
- Client component
- Currency-aware price display using CurrencyContext
- Formats INR value to selected currency

#### `OfferCard.tsx`
- Client component
- Fetches active coupon from API
- Displays offer text, discount detail, and coupon code
- Shown on PDP

#### `CurrencySwitcher.tsx`
- Client component
- Dropdown selector for currency (INR/USD/GBP/SAR)
- Persists selection in localStorage

#### `ContactForm.tsx`
- Client component
- Name, email, phone (optional), message fields
- Submits to `/api/contact`
- Success/error states

#### `FaqList.tsx`
- Client component (wrapped in Suspense)
- Category tabs: All, Orders, Returns, Payments, Coupons
- Filtered FAQ list

#### `RichTextEditor.tsx` / `RichTextEditorInner.tsx`
- Client component (dynamic import, no SSR)
- CKEditor5 wrapper for rich text editing
- GPL license, minimal toolbar (bold, italic, link, lists)

#### `Reveal.tsx`
- Client component
- IntersectionObserver-based scroll reveal animation
- Fade in + translate up on viewport entry
- Configurable delay via `delay` prop
- Respects `prefers-reduced-motion`

#### `home/Carousel.tsx`
- Client component
- Swiper-based reusable carousel
- Configurable: slidesPerView, spaceBetween, breakpoints, loop, autoplay, pagination, navigation
- Used for hero, flash sale, new arrivals, category cards, celeb sections

#### `home/HomeSections.tsx`
- Client component
- Orchestrates all homepage sections
- Receives all data as props from parent server component
- Renders hero carousel, flash sale, mid banner, new arrivals, big category grid, category cards, celeb section, recommendations

#### `listing/ListingProductCard.tsx`
- Client component
- Product card for listing page
- Shows color swatches if product has colorGroupId
- Discount badge, price display, wishlist button

#### `dashboard/OrdersTab.tsx`
- Client component
- Customer order history with status badges
- Links to order detail

#### `dashboard/ProfileTab.tsx`
- Client component
- Profile editing form (name)
- Read-only email and phone display

#### `dashboard/AddressBookTab.tsx`
- Client component
- Address list with delete button
- Add new address form

#### `dashboard/WishlistTab.tsx`
- Client component
- Wishlisted products grid

#### `dashboard/WalletTab.tsx`
- Client component
- Wallet balance display
- Transaction history list (signed amounts, labels, dates)

#### `dashboard/PointsTab.tsx`
- Client component
- Loyalty points balance display
- Points transaction history list

#### `admin/ProductForm.tsx`
- Client component
- Create/Edit mode (determined by optional `product` prop)
- Fields: name, description (rich text), price, actualPrice, stock (or sizes), category dropdown, subcategory dropdown, cover image (required for create), gallery photos (up to 6), active toggle, flash sale toggle, fast delivery toggle, color group, color name, color swatch hex, sku code
- Size management: checkbox to enable "Sell by size", add/remove size rows with labels and stock
- Validates unique size labels, at least one size when enabled
- Existing gallery images shown with remove button
- Multipart form upload via FormData
- A+ content block management (add/edit/delete/reorder)

#### `admin/icons.tsx`
- SVG icon components: DashboardIcon, ProductsIcon, CategoriesIcon, CouponsIcon, OrdersIcon, ReviewsIcon, RevenueIcon, BagIcon, UsersIcon, AlertIcon, StoreLinkIcon, HeartIcon (with filled prop), BannerIcon, AnnouncementIcon

### Context Providers

#### `AuthProvider` (`lib/auth-context.tsx`)
- On mount: calls `GET /auth/me` to restore session from cookies
- Provides: `user`, `loading`, `login()`, `register()`, `logout()`, `continueAsGuest()`, `updateProfile()`
- User type: `{ id, name, email, phone?, role: "USER" | "ADMIN" }`

#### `CartProvider` (`lib/cart-context.tsx`)
- Server-side cart via API (not localStorage)
- Provides: `items`, `count`, `subtotal`, `addItem()`, `removeItem()`, `setQuantity()`, `clear()`, `loading`
- CartItem: `{ id, productId, name, slug, skuCode, price, actualPrice, image, stock, quantity, size?, availableSizes[] }`
- `addItem()` calls server API, returns updated cart

#### `WishlistProvider` (`lib/wishlist-context.tsx`)
- Syncs with backend on mount if user is authenticated
- Provides: `items`, `loading`, `isWishlisted(productId)`, `toggle(productId)`
- Calls backend API for add/remove operations

#### `CurrencyProvider` (`lib/currency-context.tsx`)
- localStorage persistence for selected currency
- Provides: `currency`, `setCurrency()`, `format(inrValue)`
- Supported currencies: INR, USD, GBP, SAR
- Static exchange rates for display purposes only

### API Client (`lib/api.ts`)
- Base URL from `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:5000/api`)
- Uses `fetch` with `credentials: "include"` for cookie-based auth
- `cache: "no-store"` for fresh data on every request
- Automatic 401 → refresh retry logic (single retry via `/auth/refresh`)
- Supports both JSON and FormData body types
- `resolveImage(src)`: Converts relative image paths to absolute URLs
- `ApiRequestError` class with HTTP status code for consistent error handling
- Full TypeScript types for all API responses
- Functions organized by domain: products, categories, auth, addresses, coupons, orders, admin, reviews, wishlist, cart, banners, announcements, content blocks, wallet, loyalty points, contact

### Formatting (`lib/format.ts`)
- `formatINR()`: Converts number/string to `₹X,XXX` Indian locale format (e.g., `₹1,23,456.78`)

### Currency (`lib/currency.ts`)
- `CurrencyCode`: "INR" | "USD" | "GBP" | "SAR"
- `CURRENCIES`: Array of currency metadata (code, country, symbol, locale, rateFromINR)
- `convertFromINR()`: Converts INR value to selected currency
- `formatCurrency()`: Formats value using Intl.NumberFormat with proper locale

### Shipping (`lib/shipping.ts`)
- `FREE_SHIPPING_THRESHOLD = 1999`
- `computeShippingFee(subtotal)`: Returns 0 if subtotal >= threshold, otherwise `shippingFee` (₹49)

---

## Styling

### Design System (`globals.css` + `styles/sweetynx-tokens.css`)
- **Modular CSS files** in `app/styles/` — organized by page/section
- **CSS Custom Properties** in `sweetynx-tokens.css`:
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
| `.main-container` | Max-width 1200px centered wrapper (used in listing/PDP) |
| `.section` | Vertical section padding (64px) |
| `.py-section` | Vertical padding for sections |
| `.button` / `.button-secondary` / `.button-danger` / `.button-sm` | Button system |
| `.purchase-btn` | Primary purchase/checkout button |
| `.grid` | Auto-fit product grid (min 250px columns, 32px gap) |
| `.products-grid` / `.grid-2` / `.grid-3` / `.grid-4` | Listing grid with column count |
| `.card` / `.card-body` | Product card with hover effects |
| `.product-page` / `.product-main` | Product detail layout |
| `.product-single-left` / `.product-single-right` | PDP 2-column layout |
| `.cart-row` | Cart item row |
| `.form` / `.form-wide` / `.form-row` / `.field` | Form layout |
| `.table` | Data table with hover rows |
| `.badge` / `.badge-PAID` / `.badge-PENDING` / etc. | Status badges (color-coded) |
| `.auth-page` | Centered narrow auth form wrapper |
| `.summary-row` | Order summary line item |
| `.qty-input` | Cart quantity input (70px) |
| `.admin-shell` / `.admin-sidebar` / `.admin-main` | Admin panel layout |
| `.stat-grid` / `.stat-card` / `.stat-icon-*` | Dashboard stat cards |
| `.listing-page` / `.listing-shell` | Listing page layout |
| `.filter-panel` / `.filter-section` | Listing filter panel |
| `.products-area` / `.product-toolbar` | Listing products area |
| `.sort-dropdown` / `.sort-menu` | Sort dropdown |
| `.active-filter-chips` / `.filter-chip` | Active filter chips |
| `.listing-pagination` | Pagination controls |
| `.skeleton-card` / `.skeleton` | Skeleton loading placeholders |
| `.dashboard-page` / `.dashboard-container` / `.dashboard-sidebar` / `.dashboard-content` | Dashboard layout |
| `.reward-balance-card` / `.reward-tx-list` / `.reward-tx-row` | Wallet/points display |
| `.help-banner` / `.help-query-list` | Help section |
| `.about-you-form` / `.profile-message` | Profile form |
| `.hero-carousel` / `.hero-slide` | Hero carousel |
| `.mid-banner` | Mid-page banner |
| `.big-category-grid` / `.big-category-item` | Big category grid |
| `.category-card-item` | Category card |
| `.celeb-card` | Celebrity card |
| `.flash-sale-card` / `.flash-sale-discount-badge` | Flash sale card |
| `.section-header-row` / `.section-link` | Section header with link |
| `.product-section-heading` | Section heading |
| `.breadcrumb-section` / `.breadcrumbs` | Breadcrumb navigation |
| `.grid-switcher` | Grid view switcher |
| `.price-row` / `.current-price` / `.old-price` / `.discount` / `.tax-note` | Price display |
| `.product-options-color` / `.color-chip-row` / `.color-chip` | Color variant chips |
| `.product-accordion` / `.accordion-item` / `.accordion-header` / `.accordion-body` | Product accordion |
| `.offer-card` / `.offer-left-bar` / `.offer-text` / `.offer-heading` / `.offer-detail` / `.offer-code` | Offer card |
| `.content-blocks` / `.content-block-*` | A+ content blocks |
| `.feature-grid` / `.feature-item` | Feature grid |
| `.faq-tabs` / `.faq-list` / `.faq-item` | FAQ section |
| `.contact-form` | Contact form |
| `.currency-switcher` | Currency selector |
| `.color-swatches` / `.color-swatch` | Color filter swatches |
| `.filter-grid` / `.size-item` | Size filter grid |
| `.filter-list` / `.filter-item` / `.custom-checkbox` | Filter list items |
| `.filter-btn` / `.filter-overlay` | Mobile filter button/overlay |
| `.mobile-bottom-tab` | Mobile bottom tab |

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

1. **Server Components by default** — Data fetching happens server-side where possible (homepage, product detail, info pages)
2. `"use client"` directive used only for interactive components (cart, auth, admin, checkout, reviews, wishlist, animations, dashboard, listing)
3. **Async route params** — Uses `Promise<{id:string}>` pattern for `params` in dynamic routes
4. **ESM backend** — Backend uses ES modules (`"type": "module"` in package.json)
5. **Cacheless API calls** — `cache: "no-store"` for fresh data on every request
6. **Server-side cart** — Cart persisted in database via API (replaced localStorage cart)
7. **INR formatting** — Prices displayed with Indian Rupee format using `toLocaleString("en-IN")`
8. **Multi-currency display** — CurrencyContext with static exchange rates for display (INR/USD/GBP/SAR)
9. **Cookie-based auth** — httpOnly cookies for JWT tokens (access + refresh), auto-refresh on 401
10. **Mobile OTP login** — Phone number + OTP flow for customer login (admin stays email+password)
11. **Zod validation** — All request bodies/queries validated on backend with detailed error messages
12. **API error class** — `ApiRequestError` on frontend, `ApiError` on backend for consistent error handling
13. **Admin guard** — Admin layout checks role and redirects; backend enforces with `requireAdmin + requireAuth`
14. **Database transactions** — Prisma `$transaction` used for order fulfillment, stock updates, password reset
15. **Order status lifecycle** — PENDING → PAID → PROCESSING → SHIPPED → DELIVERED (or CANCELLED/FAILED)
16. **Stock management** — Automatic deduction on payment (order fulfillment), restoration on cancellation, tracked via StockMovement audit trail
17. **Dual stock mode** — Simple stock (Product.stock) or per-size stock (ProductSize with sum of sizes)
18. **Size management** — Products can optionally be sold by size; sizes are upserted on product update
19. **Color variants** — Products sharing a colorGroupId are shown as color-swatch links to sibling products (not a dropdown)
20. **SKU-based URLs** — Canonical product URL is `/{category}/{subcategory}/{skuCode}` matching Sweetynx structure
21. **Catch-all listing route** — `/listing/[[...slug]]` handles `/listing`, `/listing/{category}`, `/listing/{category}/{subCategory}`
22. **Reserved slugs** — Category slugs that conflict with Next.js routes are rejected at creation time
23. **Guest checkout flow** — Creates account with random password, can be claimed later via forgot-password
24. **Wishlist sync** — Wishlist context syncs with backend API when user is authenticated
25. **Rate limiting** — Separate rate limiters for auth endpoints and order creation
26. **CSV export** — Admin can export filtered orders as CSV with proper field escaping
27. **Skeleton loading** — Animated shimmer placeholders shown during product list loading
28. **Scroll reveal** — IntersectionObserver-based fade-in animations for sections
29. **Razorpay integration** — Frontend loads Razorpay script dynamically, backend creates/verifies orders
30. **Webhook ready** — Webhook route mounted before JSON parser to receive raw body for signature verification
31. **A+ content blocks** — Amazon-style enhanced content modules on PDP (4 types: heading+text, image+text, feature grid, full image)
32. **Banner system** — 6 banner types for homepage sections (HERO, MID, BIG_CATEGORY, CATEGORY_CARD, CELEB, FASHION_VIDEO)
33. **Announcement bar** — Single scrolling top-bar announcement (only most recent active shown)
34. **Wallet & loyalty points** — Customer wallet balance + Sweety Points with transaction history
35. **Customer dashboard** — Tab-based account management (orders, profile, address, wishlist, wallet, points, returns, help)
36. **Info pages** — Static content pages (terms, returns, shipping, privacy) + dynamic pages (contact, FAQ)
37. **CKEditor5** — Rich text editor for product descriptions (GPL license, dynamic import, no SSR)
38. **Swiper carousel** — Reusable Carousel component for homepage sections
39. **Modular CSS** — Styles organized by page/section in `app/styles/` directory
40. **Order cancellation** — Customers can cancel own orders if PENDING or PAID status
41. **Subcategories** — One level of category nesting with unique slug per category
42. **Flash sale & fast delivery** — Product flags for marketing display
43. **Offer card on PDP** — Active coupon with offer text shown on product detail page
44. **Product filters** — Comprehensive filter system (size, color, price brackets, subcategory, sort)
45. **Grid view switcher** — 2/3/4 column grid toggle persisted in localStorage

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
- **OTP rate limiting**: OTP request endpoint is rate-limited
- **Reserved slug validation**: Category slugs matching Next.js routes are rejected
- **Subcategory deletion protection**: Blocks deletion if subcategory has products