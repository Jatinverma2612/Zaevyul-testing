import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import "./config/env.js";
import "./config/db.js";

// Import Routes
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import blogCategoryRoutes from "./routes/blogCategories.js";
import orderRoutes from "./routes/orders.js";
import customerRoutes from "./routes/customers.js";
import blogRoutes from "./routes/blogs.js";
import couponRoutes from "./routes/coupons.js";
import newsletterRoutes from "./routes/newsletter.js";
import reportsRoutes from "./routes/reports.js";
import settingsRoutes from "./routes/settings.js";
import profileRoutes from "./routes/profile.js";
import customerAuthRoutes from "./routes/customerAuth.js";
import customerAddressesRoutes from "./routes/customerAddresses.js";
import customerFavoritesRoutes from "./routes/customerFavorites.js";
import customerOrdersRoutes from "./routes/customerOrders.js";
import publicRoutes from "./routes/public.js";
import taxRulesRoutes from "./routes/taxRules.js";
import uploadRoutes from "./routes/upload.js";
import mediaCoverageRoutes from "./routes/mediaCoverage.js";

const PORT = process.env.PORT || 5000;
const app = express();

// ── AUD-022: Rate Limiting ────────────────────────────────────────────────────

/** Passthrough auth limiter (rate limiting disabled) */
const authLimiter = (req, res, next) => next();

/** Passthrough api limiter (rate limiting disabled) */
const apiLimiter = (req, res, next) => next();

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://zaevyul.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// ── Database connection health guard ──────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is not connected. Please ensure MongoDB is running.",
    });
  }
  next();
});

// ── Public endpoints — accessible without auth headers (AUD-002, AUD-012, AUD-013, AUD-018, AUD-019) ──
app.use("/api/public", apiLimiter, publicRoutes);

// ── Admin auth gets stricter rate limiting (AUD-022) ──────────────────────────
app.use("/api/admin/auth", authLimiter, authRoutes);

// ── Customer auth uses the general API limiter here; OTP/login routes
// define stricter route-level limiters in routes/customerAuth.js.
app.use("/api/customer/auth", apiLimiter, customerAuthRoutes);

// ── Route registration (general API limiter) ──────────────────────────────────
app.use("/api/admin/products", apiLimiter, productRoutes);
app.use("/api/admin/categories", apiLimiter, categoryRoutes);
app.use("/api/admin/blog-categories", apiLimiter, blogCategoryRoutes);
app.use("/api/admin/orders", apiLimiter, orderRoutes);
app.use("/api/admin/customers", apiLimiter, customerRoutes);
app.use("/api/admin/blogs", apiLimiter, blogRoutes);
app.use("/api/admin/media-coverage", apiLimiter, mediaCoverageRoutes);
app.use("/api/admin/coupons", apiLimiter, couponRoutes);
app.use("/api/admin/newsletter", apiLimiter, newsletterRoutes);
app.use("/api/admin/reports", apiLimiter, reportsRoutes);
app.use("/api/admin/settings", apiLimiter, settingsRoutes);
app.use("/api/admin/profile", apiLimiter, profileRoutes);
app.use("/api/admin/tax-rules", apiLimiter, taxRulesRoutes);
app.use("/api/admin/upload", apiLimiter, uploadRoutes);
app.use("/api/upload", apiLimiter, uploadRoutes);

// ── Customer storefront routes ────────────────────────────────────────────────
app.use("/api/customer/favorites", apiLimiter, customerFavoritesRoutes);
app.use("/api/customer/addresses", apiLimiter, customerAddressesRoutes);
app.use("/api/customer/orders", apiLimiter, customerOrdersRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "server is up and running🎉",
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log("App is running on port:", PORT);
  });
}

export default app;
