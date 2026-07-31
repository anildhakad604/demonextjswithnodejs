import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { authRouter } from "./routes/auth.routes.js";
import { productRouter } from "./routes/product.routes.js";
import { categoryRouter } from "./routes/category.routes.js";
import { subCategoryRouter } from "./routes/subCategory.routes.js";
import { bannerRouter } from "./routes/banner.routes.js";
import { announcementRouter } from "./routes/announcement.routes.js";
import { addressRouter } from "./routes/address.routes.js";
import { cartRouter } from "./routes/cart.routes.js";
import { walletRouter } from "./routes/wallet.routes.js";
import { loyaltyPointsRouter } from "./routes/loyaltyPoints.routes.js";
import { contactRouter } from "./routes/contact.routes.js";
import { couponRouter } from "./routes/coupon.routes.js";
import { orderRouter } from "./routes/order.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { webhookRouter } from "./routes/webhook.routes.js";
import { reviewRouter } from "./routes/review.routes.js";
import { wishlistRouter } from "./routes/wishlist.routes.js";
import { contentBlockRouter } from "./routes/contentBlock.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { UPLOADS_DIR } from "./middleware/upload.js";

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 5000);

app.use(
  helmet({
    // This is a JSON API + static image host, not an HTML-serving app —
    // a page-oriented CSP has nothing to protect here and would just add noise.
    contentSecurityPolicy: false,
    // Product images under /uploads are loaded cross-origin by the frontend.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));

// Mounted before express.json() — webhook signature verification needs the raw request body.
app.use("/api/webhooks", webhookRouter);

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/subcategories", subCategoryRouter);
app.use("/api/banners", bannerRouter);
app.use("/api/announcement", announcementRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/loyalty-points", loyaltyPointsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin", adminRouter);
app.use("/api", reviewRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api", contentBlockRouter);

app.use(errorHandler);

app.listen(port, () => console.log(`API running on http://localhost:${port}`));
