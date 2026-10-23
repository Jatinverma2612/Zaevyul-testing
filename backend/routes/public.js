import express from "express";
import {
  getPublicProducts,
  getPublicProductBySlug,
  getPublicCategories,
  getPublicBlogsList,
  getPublicBlogBySlug,
  getPublicBlogCategories,
  getPublicMediaCoverages,
  getPublicCoupons,
  validatePublicCoupon,
  subscribeNewsletter,
  getPublicSettings,
  getPublicBranding,
  getPublicLocation,
  getPublicOrderById,
  getProductReviews,
  createProductReview,
} from "../controllers/public.js";
import { uploadImage } from "../controllers/upload.js";

const router = express.Router();

// Upload
router.post("/upload", uploadImage);

// Orders
router.get("/orders/:identifier", getPublicOrderById);

// Reviews
router.get("/products/:id/reviews", getProductReviews);
router.post("/products/:id/reviews", createProductReview);

// Products & Categories
router.get("/products", getPublicProducts);
router.get("/products/:identifier", getPublicProductBySlug);
router.get("/categories", getPublicCategories);

// Journal / Blogs
router.get("/blogs", getPublicBlogsList);
router.get("/blogs/:slug", getPublicBlogBySlug);
router.get("/blog-categories", getPublicBlogCategories);

// Media Coverage
router.get("/media-coverage", getPublicMediaCoverages);


// Coupons, Newsletter, Settings, Location, Branding
router.get("/coupons", getPublicCoupons);
router.post("/coupons/validate", validatePublicCoupon);
router.post("/newsletter/subscribe", subscribeNewsletter);
router.get("/settings", getPublicSettings);
router.get("/branding", getPublicBranding);
router.get("/location", getPublicLocation);

export default router;
