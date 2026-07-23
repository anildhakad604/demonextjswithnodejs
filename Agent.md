# Project Overview: Next.js + Node.js E-commerce (NovaShop)

A full-stack e-commerce application built with Next.js 14+ (App Router) and Node.js/Express, using SQL Server as the database with Prisma ORM. The project runs as a monorepo with concurrent development servers.

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
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── prisma/
│       ├── schema.prisma     # Database schema (SQL Server)
│       ├── seed.ts           # Seed script for development
│       └── migrations/       # Prisma migrations
│   └── src/
│       ├── server.ts         # Express app entry point
│       ├── types.ts          # Shared TypeScript types (Role, OrderStatus, DiscountType)
│       ├── lib/
│       │   ├── prisma.ts     # Prisma client singleton
│       │   ├── jwt.ts        # JWT signing and verification (access + refresh tokens)
│       │   ├── razorpay.ts   # Razorpay payment SDK + signature verification
│       │   └── params.ts     # Parameter validation helper
│       ├── middleware/
│       │   ├── auth.ts       # requireAuth, optionalAuth, requireAdmin middleware
│       │   ├── errorHandler.ts # ApiError class + global error handler + asyncHandler wrapper
│       │   └── upload.ts     # Multer file upload config (images)
│       └── routes/
│           ├── auth.routes.ts    # Register, login, refresh, logout, /me
│           ├── product.routes.ts # CRUD + stock adjustment
│           ├── category.routes.ts # CRUD
│           ├── address.routes.ts # CRUD (user-scoped)
│           ├── coupon.routes.ts  # CRUD + validate (with discount computation)
│           ├── order.routes.ts   # Create order, verify payment, list/get orders
│           └── admin.routes.ts   # Dashboard stats, admin order management, user listing
│
└── frontend/                 # Next.js app (port 3000)
    ├── .env.local.example
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── app/
    │   ├── globals.css                 # Global styles (single CSS file)
    │   ├── layout.tsx                  # Root layout: AuthProvider → CartProvider → Header → children
    │   ├── page.tsx                    # Homepage (hero + featured products grid)
    │   ├── login/page.tsx              # Login form
    │   ├── register/page.tsx           # Registration form
    │   ├── cart/page.tsx               # Cart (from localStorage)
    │   ├── checkout/page.tsx           # Checkout with address mgmt, coupon, Razorpay
    │   ├── orders/page.tsx             # My Orders list
    │   ├── orders/[id]/page.tsx        # Order detail
    │   ├── products/[id]/page.tsx      # Product detail page
    │   └── admin/
    │       ├── layout.tsx              # Admin layout (role-gated, nav links)
    │       ├── page.tsx                # Dashboard stats
    │       ├── products/page.tsx       # Admin product list
    │       ├── categories/page.tsx     # Admin category management
    │       ├── coupons/page.tsx        # Admin coupon management
    │       └── orders/page.tsx         # Admin order management
    ├── components/
    │   ├── Header.tsx                  # Navigation header (auth-aware, cart count)
    │   ├── ProductCard.tsx             # Product grid card
    │   ├── AddToCartButton.tsx         # Client: add to localStorage cart
    │   └── admin/
    │       └── ProductForm.tsx         # Admin product create/edit form
    └── lib/
        ├── api.ts                     # Full API client (axios-like with auto-refresh)
        ├── auth-context.tsx            # React context for auth state
        ├── cart-context.tsx            # React context for localStorage cart
        └── format.ts                  # INR currency formatter
```

---

## Backend (`backend/`)

### Stack
- **Runtime**: Node.js with TypeScript (ESM via `"type": "module"`)
- **Framework**: Express.js (with `tsx` hot-reload for development)
- **Database**: SQL Server via Prisma ORM
- **Auth**: JWT (access + refresh tokens) with bcrypt password hashing
- **Payment**: Razorpay payment gateway
- **File Uploads**: Multer (images)

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
| `dotenv` | Environment variables |

### Environment Variables (`.env.example`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `DATABASE_URL` | (required) | SQL Server connection string |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |
| `JWT_ACCESS_SECRET` | (required) | Secret for access tokens (15m expiry) |
| `JWT_REFRESH_SECRET` | (required) | Secret for refresh tokens (30d expiry) |
| `RAZORPAY_KEY_ID` | (required) | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | (required) | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | (optional) | Webhook signature verification |
| `UPLOADS_DIR` | `uploads` | Image storage directory |
| `NODE_ENV` | `development` | Environment mode |

### Database Schema (Prisma – SQL Server)

**Models:** `User`, `RefreshToken`, `Address`, `Category`, `Product`, `StockMovement`, `Coupon`, `Order`, `OrderItem`

Key relationships:
- User has many Addresses, Orders, RefreshTokens
- Product belongs to Category, has many OrderItems and StockMovements
- Order belongs to User and Address, optionally has Coupon, has many OrderItems
- StockMovement tracks inventory changes per product
- DiscountType and OrderStatus are validated at the application layer (SQL Server has no enums)

### API Endpoints

#### Public
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/products` | List products (filter: category, search, pagination) |
| `GET` | `/api/products/:idOrSlug` | Get single product |
| `GET` | `/api/categories` | List all categories |

#### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | No | Register new user |
| `POST` | `/login` | No | Login |
| `POST` | `/refresh` | Cookie | Refresh access token |
| `POST` | `/logout` | Cookie | Logout (clear tokens) |
| `GET` | `/me` | Required | Get current user |

#### Addresses (`/api/addresses`) – Auth Required
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List user's addresses |
| `POST` | `/` | Create address (sets default if specified) |
| `DELETE` | `/:id` | Delete address |

#### Coupons (`/api/coupons`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Admin | List all coupons |
| `POST` | `/` | Admin | Create coupon |
| `PUT` | `/:id` | Admin | Update coupon |
| `DELETE` | `/:id` | Admin | Delete coupon |
| `POST` | `/validate` | Required | Validate coupon code and compute discount |

#### Orders (`/api/orders`) – Auth Required
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Create order (with Razorpay payment order) |
| `POST` | `/:id/verify-payment` | Verify Razorpay payment signature |
| `GET` | `/` | List user's orders |
| `GET` | `/:id` | Get order detail (own or admin) |

#### Admin (`/api/admin`) – Auth + Admin Required
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stats` | Dashboard statistics (revenue, counts, low stock, recent orders) |
| `GET` | `/orders` | List all orders with pagination + status filter |
| `PATCH` | `/orders/:id/status` | Update order status (handles stock restoration on cancel) |
| `GET` | `/users` | List all users |

#### Product Management – Admin Only
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/products` | Create product (with image upload) |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product (blocks if in orders) |
| `POST` | `/api/products/:id/stock` | Adjust stock level (with reason tracking) |

### Middleware
- **`requireAuth`**: Extracts JWT from `Authorization: Bearer` header or cookie, attaches `req.user`
- **`optionalAuth`**: Same but doesn't reject unauthenticated requests
- **`requireAdmin`**: Ensures `req.user.role === "ADMIN"`
- **`errorHandler`**: Global error handler (Zod validation errors → 400, ApiError → status, others → 500)
- **`asyncHandler`**: Wraps async route handlers to pass errors to Express error handler
- **`upload`**: Multer middleware for image (JPEG/PNG/WEBP/GIF, max 5MB)

### Auth Flow
1. User registers/logs in → server sets `accessToken` (15min) and `refreshToken` (30d) as httpOnly cookies
2. Frontend API client auto-refreshes on 401 by calling `/auth/refresh`
3. Refresh tokens are stored in DB and can be revoked
4. Logout clears cookies and deletes refresh token from DB

---

## Frontend (`frontend/`)

### Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Global CSS (`globals.css`) – no CSS-in-JS or modules
- **State Management**: React Context (auth + cart)

### Environment Variables
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API base URL |

### Pages (Routes)

#### `/` – Homepage
- **Type**: Server Component
- Async data fetch: products list
- Hero section + featured products grid (ProductCard)

#### `/login` – Login
- **Type**: Client Component
- Email/password form → redirects to `/admin` for ADMIN, or `?next` param, or `/`
- Displays API errors inline

#### `/register` – Registration
- **Type**: Client Component
- Name/email/password form (min 8 char password)
- Auto-redirects to `/` on success

#### `/cart` – Shopping Cart
- **Type**: Client Component
- Reads from localStorage cart context
- Quantity adjustment per item, remove, subtotal display
- "Proceed to Checkout" link

#### `/checkout` – Checkout
- **Type**: Client Component
- Auth guard: redirects to `/login?next=/checkout`
- Address selection or new address form
- Coupon code input with validation
- Order summary
- Razorpay payment modal integration
- On success: clears cart, redirects to order detail

#### `/orders` – My Orders
- **Type**: Client Component
- Auth guard
- Table of user's orders (order ID, date, items count, total, status badge)

#### `/orders/[id]` – Order Detail
- **Type**: Client Component
- Full order details with items, address, payment info, status

#### `/products/[id]` – Product Detail
- **Type**: Server Component with dynamic route params
- Product image, category, name, description, price (INR), stock count
- AddToCartButton component

#### `/admin` – Admin Dashboard
- **Type**: Client Component
- Admin layout wrapper with navigation: Dashboard, Products, Categories, Coupons, Orders
- **Dashboard**: Stats cards (Revenue, Orders, Products, Users, Low Stock), Recent Orders table
- **Products**: Table with create/edit/delete, stock adjustment
- **Categories**: Create/delete categories
- **Coupons**: CRUD + activation toggle
- **Orders**: List with status management (supports status transitions with stock restoration on cancel)

### Components

#### `Header.tsx`
- Client component
- NovaShop brand, nav links: Home, Products, Cart (count), Orders (if authenticated), Admin (if ADMIN), Login/Logout

#### `ProductCard.tsx`
- Server component
- Image, category badge, name, price (INR formatted), "View Product" link

#### `AddToCartButton.tsx`
- Client component
- Adds product to localStorage cart via CartContext
- Respects stock limits

#### `admin/ProductForm.tsx`
- Client component
- Create/Edit product form with image upload, category selection, stock, price, etc.

### Context Providers

#### `AuthProvider` (`lib/auth-context.tsx`)
- On mount: calls `GET /auth/me` to restore session
- Provides: `user`, `loading`, `login()`, `register()`, `logout()`
- User type: `{ id, name, email, role: "USER" | "ADMIN" }`

#### `CartProvider` (`lib/cart-context.tsx`)
- localStorage persistence with hydration guard
- Provides: `items`, `count`, `subtotal`, `addItem()`, `removeItem()`, `setQuantity()`, `clear()`
- CartItem: `{ productId, name, price, image, stock, quantity }`

### API Client (`lib/api.ts`)
- Base: `fetch` with `credentials: "include"` for cookie-based auth
- Automatic 401 → refresh retry logic
- Full TypeScript types for all API responses
- Functions for all endpoints (products, categories, auth, addresses, coupons, orders, admin)

### Formatting (`lib/format.ts`)
- `formatINR()`: Converts number/string to `₹X,XXX` Indian locale format

---

## Styling (`globals.css`)
- **Single CSS file** – no CSS modules, Tailwind, or CSS-in-JS
- **Key classes**: `.container`, `.header`, `.nav`, `.brand`, `.links`, `.hero`, `.button`, `.section`, `.grid`, `.card`, `.card-body`, `.price`, `.product-page`, `.cart-row`, `.form`, `.field`, `.table`, `.badge`, `.admin-shell`, `.admin-nav`, `.stat-grid`, `.stat-card`, `.summary-row`, `.auth-page`
- **Badge classes**: `.badge-PENDING`, `.badge-PAID`, `.badge-PROCESSING`, `.badge-SHIPPED`, `.badge-DELIVERED`, `.badge-CANCELLED`, `.badge-FAILED` – color-coded status indicators
- **Responsive**: Breakpoint at 700px for hero, product page, nav
- **Design**: Minimal, clean aesthetic; dark header/hero, white cards, border-radius elements

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

1. **Server Components by default** – Data fetching happens server-side where possible
2. `"use client"` directive used only for interactive components (cart, auth, admin, checkout)
3. **Async route params** – Uses `Promise<{id:string}>` pattern for `params` in dynamic routes
4. **ESM backend** – Backend uses ES modules (`"type": "module"`)
5. **Cacheless API calls** – `cache: "no-store"` for fresh data on every request
6. **localStorage cart** – Client-side cart persists in browser storage (no backend cart)
7. **INR formatting** – Prices displayed with `toLocaleString("en-IN")` for Indian Rupee format
8. **Cookie-based auth** – httpOnly cookies for JWT tokens, auto-refresh on 401
9. **Zod validation** – All request bodies/queries validated on backend
10. **API error class** – `ApiRequestError` on frontend, `ApiError` on backend for consistent error handling
11. **Admin guard** – Admin layout checks role and redirects; backend enforces with `requireAdmin`
12. **Database transactions** – Prisma `$transaction` used for order creation, payment verification, and stock updates
13. **Order status tracking** – Full lifecycle: PENDING → PAID → PROCESSING → SHIPPED → DELIVERED (or CANCELLED/FAILED)
14. **Stock management** – Automatic deduction on payment, restoration on cancellation, tracked via StockMovement

---

## Security Features

- **Password hashing**: bcrypt with 12 salt rounds
- **JWT token rotation**: Refresh tokens are one-time-use (deleted on refresh)
- **SQL Server connection**: Parameterized queries via Prisma (prevents SQL injection)
- **CORS**: Restricted to configured frontend URL
- **File upload validation**: MIME type whitelist + 5MB size limit
- **Payment verification**: Server-side signature validation (not client-trustable)
- **CSRF protection**: httpOnly cookies with SameSite=Lax