# Project Overview: Next.js + Node.js E-commerce

A full-stack e-commerce starter application built with Next.js (App Router) and Node.js (Express), running as a monorepo with concurrent development servers.

---

## Architecture

### Monorepo Structure
```
next-node-ecommerce/
├── package.json          # Root: orchestrates dev servers via concurrently
├── README.md
├── backend/              # Express API server (port 5000)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts     # Express app entry point
│       └── products.ts   # Product type + mock data
└── frontend/             # Next.js app (port 3000)
    ├── .env.local.example
    ├── package.json
    ├── tsconfig.json
    ├── app/
    │   ├── globals.css              # Global styles
    │   ├── layout.tsx               # Root layout + nav header
    │   ├── page.tsx                 # Homepage (hero + product grid)
    │   ├── cart/page.tsx            # Cart page
    │   └── products/[id]/page.tsx   # Product detail page
    ├── components/
    │   ├── AddToCartButton.tsx      # Client: add-to-cart via localStorage
    │   └── ProductCard.tsx          # Product card in grid
    └── lib/
        └── api.ts                   # API client functions
```

---

## Backend (`backend/`)

### Stack
- **Runtime**: Node.js with TypeScript (ESM via `"type": "module"`)
- **Framework**: Express.js
- **Dev Tool**: `tsx` (TypeScript execution with hot-reload)

### Dependencies
- `express` - HTTP framework
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment variable loading
- Dev: `@types/express`, `@types/cors`, `@types/node`, `tsx`, `typescript`

### Environment Variables (`.env.example`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check (returns `{ status: "ok" }`) |
| `GET` | `/api/products` | Returns all products |
| `GET` | `/api/products/:id` | Returns single product by numeric ID |

### Data Model: `Product`
```typescript
type Product = {
  id: number;        // Unique identifier
  name: string;      // Product display name
  slug: string;      // URL-friendly name
  description: string;
  price: number;     // Price in INR (₹)
  image: string;     // Unsplash image URL
  category: string;  // "Bags", "Shoes", "Accessories"
  stock: number;     // Available quantity
};
```

### Sample Products (4 items)
1. Classic Leather Bag (₹3,499) - Bags
2. Minimal Sneakers (₹2,799) - Shoes
3. Modern Wrist Watch (₹4,999) - Accessories
4. Premium Sunglasses (₹1,999) - Accessories

### API Client (`frontend/lib/api.ts`)
- `getProducts(): Promise<Product[]>` - Fetches all products
- `getProduct(id: string): Promise<Product>` - Fetches single product
- API URL configured via `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:5000/api`)

---

## Frontend (`frontend/`)

### Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Global CSS (single `globals.css` file)

### Dependencies
- `next`, `react`, `react-dom` - Core framework
- Dev: `@types/node`, `@types/react`, `@types/react-dom`, `typescript`

### Environment Variables
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API base URL |

### Pages (Routes)

#### `/` - Homepage
- **File**: `frontend/app/page.tsx`
- **Type**: Server Component (async)
- **Content**:
  - Hero section with heading, description, and "Shop Now" CTA
  - Featured Products grid rendering `ProductCard` for each product
  - Fetches products server-side via `getProducts()`

#### `/products/[id]` - Product Detail
- **File**: `frontend/app/products/[id]/page.tsx`
- **Type**: Server Component with dynamic route params (using `Promise<{id:string}>` pattern for Next.js)
- **Content**:
  - Large product image
  - Category badge, product name, description, price (₹ formatted), stock count
  - `AddToCartButton` component

#### `/cart` - Cart Page
- **File**: `frontend/app/cart/page.tsx`
- **Type**: Client Component (`"use client"`)
- **Content**: Displays cart items from localStorage

### Components

#### `ProductCard` (`components/ProductCard.tsx`)
- Server component
- Renders product image, category, name, price (INR locale formatting), and "View Product" link
- Uses Next.js `Image` component (600×600)

#### `AddToCartButton` (`components/AddToCartButton.tsx`)
- Client component (`"use client"`)
- Adds product to localStorage cart array
- Handles quantity increment for existing items
- Shows `alert()` confirmation

---

## Styling (`globals.css`)
- **Single CSS file** with no CSS-in-JS or CSS modules
- **Key classes**: `.container`, `.header`, `.nav`, `.brand`, `.links`, `.hero`, `.button`, `.section`, `.grid`, `.card`, `.card-body`, `.price`, `.product-page`, `.cart-row`
- **Responsive**: Single breakpoint at 700px for hero heading, product page layout, and nav links
- **Design**: Minimal, clean aesthetic with dark header/hero, white cards, border-radius elements

---

## Running the Project

```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Start both servers concurrently
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (Express API) | http://localhost:5000 |

---

## Future Roadmap (from README)
- **Database**: PostgreSQL or MongoDB integration
- **Authentication**: User login/signup
- **Admin Panel**: Product management
- **Image Uploads**: Custom product images
- **Payment Gateway**: Order processing
- **Orders**: Order management system
- **Coupons**: Discount code system
- **Inventory**: Stock management
- **Deployment**: Production configuration

---

## Key Patterns & Conventions

1. **Server Components by default** - Data fetching happens server-side
2. `"use client"` directive used only for interactive components (cart, add-to-cart button)
3. **Async route params** - Uses `Promise<{id:string}>` pattern for `params` in dynamic routes
4. **ESM backend** - Backend uses ES modules (`"type": "module"`)
5. **Cashless API calls** - `cache: "no-store"` for fresh data on every request
6. **localStorage cart** - Client-side cart persists in browser storage (no backend cart)
7. **INR formatting** - Prices displayed with `toLocaleString("en-IN")` for Indian Rupee format