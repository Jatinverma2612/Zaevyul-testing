import mongoose from "mongoose";
import Product from "../model/Product.js";
import Category from "../model/Category.js";
import Blog from "../model/Blog.js";
import BlogCategory from "../model/BlogCategory.js";
import Coupon from "../model/Coupon.js";
import Newsletter from "../model/Newsletter.js";
import Settings from "../model/Settings.js";
import Order from "../model/Order.js";
import Customer from "../model/Customer.js";
import CustomerUser from "../model/CustomerUser.js";
import Review from "../model/Review.js";
import MediaCoverage from "../model/MediaCoverage.js";

// Helper to escape regex inputs safely (AUD-021)
export const escapeRegex = (str) => {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const visibleProductFilter = {
  $or: [
    { status: "published" },
    { status: null },
    { status: { $exists: false } },
  ],
};

/**
 * GET /api/public/products
 * Fetch active/published products with optional filtering.
 */
export const getPublicProducts = async (req, res) => {
  const { search, category, gender, featured, limit, page = 1 } = req.query;
  try {
    const filter = { ...visibleProductFilter };

    if (gender && ['men', 'women', 'neutral'].includes(gender.toLowerCase())) {
      const g = gender.toLowerCase();
      filter.gender = g;
    }

    if (category && category !== "ALL" && category !== "all") {
      // Find category by slug or id
      const catObj = await Category.findOne({
        $or: [{ slug: category }, { name: { $regex: escapeRegex(category), $options: "i" } }],
      });
      if (catObj) {
        filter.category = catObj._id;
      }
    }

    if (featured === "true") {
      filter.featured = true;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { tags: { $regex: safeSearch, $options: "i" } },
        { material: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = parseInt(limit, 10) || 0; // 0 means no limit (all)

    let query = Product.find(filter)
      .populate("category", "name slug sizeChartImage")
      .sort({ featuredOrder: 1, createdAt: -1 });

    if (limitNum > 0) {
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const [products, totalCount] = await Promise.all([
      query,
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      products,
      totalCount,
      page: pageNum,
      totalPages: limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1,
    });
  } catch (error) {
    console.error("[public] getPublicProducts error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch products." });
  }
};

/**
 * GET /api/public/products/:identifier (id or slug)
 */
export const getPublicProductBySlug = async (req, res) => {
  const { identifier } = req.params;
  try {
    let product;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findOne({ _id: identifier, ...visibleProductFilter }).populate("category", "name slug sizeChartImage");
    }
    if (!product) {
      product = await Product.findOne({
        $or: [{ slug: identifier }, { id: identifier }, { sku: identifier }],
        ...visibleProductFilter,
      }).populate("category", "name slug sizeChartImage");
    }

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("[public] getPublicProductBySlug error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch product." });
  }
};

/**
 * GET /api/public/categories
 * Fixed AUD-018: N+1 query resolved via single MongoDB $lookup/$group aggregation pipeline.
 */
export const getPublicCategories = async (req, res) => {
  try {
    const categoriesWithCount = await Category.aggregate([
      { $sort: { sortOrder: 1, name: 1 } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          pipeline: [{ $match: visibleProductFilter }],
          as: "matchedProducts",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          description: 1,
          mainImage: 1,
          featured: 1,
          featuredOrder: 1,
          sortOrder: 1,
          productCount: { $size: "$matchedProducts" },
        },
      },
    ]);

    return res.status(200).json({ success: true, categories: categoriesWithCount });
  } catch (error) {
    console.error("[public] getPublicCategories error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch categories." });
  }
};

/**
 * GET /api/public/blogs
 */
export const getPublicBlogsList = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 });
    return res.status(200).json({ success: true, blogs });
  } catch (error) {
    console.error("[public] getPublicBlogsList error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch journal articles." });
  }
};

/**
 * GET /api/public/blogs/:slug (AUD-019)
 */
export const getPublicBlogBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    let blog = await Blog.findOne({ slug, status: "published" });
    if (!blog && slug.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(slug);
    }

    if (!blog) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    return res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("[public] getPublicBlogBySlug error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch article." });
  }
};

/**
 * GET /api/public/blog-categories
 */
export const getPublicBlogCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort({ name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error("[public] getPublicBlogCategories error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch blog categories." });
  }
};

/**
 * GET /api/public/media-coverage
 * Fetch all published media coverage entries for storefront.
 */
export const getPublicMediaCoverages = async (req, res) => {
  try {
    const items = await MediaCoverage.find({ status: "published" }).sort({
      sortOrder: 1,
      publishedAt: -1,
      createdAt: -1,
    });
    return res.status(200).json({ success: true, items });
  } catch (error) {
    console.error("[public] getPublicMediaCoverages error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch media coverage entries." });
  }
};


/**
 * GET /api/public/coupons
 * Returns all active, non-expired coupons for display in the storefront coupon picker.
 * Only exposes code, type, value, description, minOrderValue — no usage counts.
 */
export const getPublicCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      active: true,
      $or: [{ expiry: null }, { expiry: { $gt: now } }],
    }).select("code type value description minOrderValue").sort({ minOrderValue: 1, createdAt: -1 });

    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error("[public] getPublicCoupons error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch coupons." });
  }
};

/**
 * POST /api/public/coupons/validate (AUD-012)
 */
export const validatePublicCoupon = async (req, res) => {
  const { code, cartSubtotal } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: "Coupon code is required." });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid or inactive coupon code." });
    }

    const expiresAt = coupon.expiresAt || coupon.expiry;
    const usageCount = coupon.usageCount ?? coupon.usedCount ?? 0;
    const minOrderAmount = coupon.minOrderAmount ?? coupon.minOrderValue ?? 0;
    const discountType = coupon.discountType || coupon.type;
    const discountValue = coupon.discountValue ?? coupon.value ?? 0;
    const maxDiscountAmount = coupon.maxDiscountAmount ?? null;

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon code has expired." });
    }

    if (coupon.usageLimit && usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Coupon code limit reached." });
    }

    const subtotal = Number(cartSubtotal) || 0;
    if (minOrderAmount && subtotal < minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${minOrderAmount} required for this coupon.`,
      });
    }

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = Math.round((subtotal * discountValue) / 100);
      if (maxDiscountAmount && discountAmount > maxDiscountAmount) {
        discountAmount = maxDiscountAmount;
      }
    } else {
      discountAmount = discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);

    return res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType,
        discountValue,
        discountAmount,
      },
    });
  } catch (error) {
    console.error("[public] validatePublicCoupon error:", error);
    return res.status(500).json({ success: false, message: "Failed to validate coupon." });
  }
};

/**
 * POST /api/public/newsletter/subscribe (AUD-013)
 */
export const subscribeNewsletter = async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    let sub = await Newsletter.findOne({ email: normalizedEmail });
    if (!sub) {
      sub = await Newsletter.create({ email: normalizedEmail, status: "active" });
    } else if (sub.status !== "active") {
      sub.status = "active";
      await sub.save();
    }

    // Sync CustomerUser marketing preference if matching user exists
    const customer = await CustomerUser.findOne({ email: normalizedEmail });
    if (customer && !customer.marketingPreferences?.emailUpdates) {
      customer.marketingPreferences = customer.marketingPreferences || {};
      customer.marketingPreferences.emailUpdates = true;
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Thank you for subscribing to Zaevyul Journal updates!",
    });
  } catch (error) {
    console.error("[public] subscribeNewsletter error:", error);
    return res.status(500).json({ success: false, message: "Failed to subscribe." });
  }
};

/**
 * GET /api/public/settings (AUD-008)
 * Returns public shop configuration (currencies, public gateway keys, shipping thresholds).
 */
export const getPublicSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }

    const publicSettings = {
      storeName: settings.storeName || "Zaevyul",
      tagline: settings.tagline || "Timeless · Authentic · Handcrafted",
      logo: settings.logo || "",
      favicon: settings.favicon || "",
      email: settings.email || "hello@zaevyul.com",
      storeEmail: settings.email || "hello@zaevyul.com",
      phone: settings.phone || "+91 98765 43210",
      address: settings.address || "ZAEVYUL Pashmina, B-12, Hauz Khas, New Delhi 110016, India",
      socialLinks: {
        facebook: settings.socialLinks?.facebook || "",
        instagram: settings.socialLinks?.instagram || "https://instagram.com/zaevyul",
        twitter: settings.socialLinks?.twitter || "",
        linkedin: settings.socialLinks?.linkedin || "",
        youtube: settings.socialLinks?.youtube || "",
        pinterest: settings.socialLinks?.pinterest || "",
      },
      freeShippingThreshold: settings.freeShippingThreshold || 5000,
      standardShippingFee: settings.standardShippingFee || 250,
      lowStockThreshold: settings.lowStockThreshold || 5,
      paymentGateways: {
        codEnabled: settings.paymentGateways?.codEnabled ?? true,
        stripeEnabled: settings.paymentGateways?.stripeEnabled ?? true,
        stripePublishableKey: settings.paymentGateways?.stripePublishableKey || "pk_test_sample",
        razorpayEnabled: settings.paymentGateways?.razorpayEnabled ?? true,
        razorpayKeyId: settings.paymentGateways?.razorpayKeyId || "rzp_test_sample",
      },
    };

    return res.status(200).json({ success: true, settings: publicSettings });
  } catch (error) {
    console.error("[public] getPublicSettings error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch settings." });
  }
};

/**
 * GET /api/public/branding
 * Returns public active branding assets (logo & favicon).
 */
export const getPublicBranding = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      logo: settings.logo || "",
      favicon: settings.favicon || "",
      storeName: settings.storeName || "Zaevyul",
      tagline: settings.tagline || "Timeless · Authentic · Handcrafted",
    });
  } catch (error) {
    console.error("[public] getPublicBranding error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch branding." });
  }
};

/**
 * GET /api/public/location
 * Detects client ISO 3166-1 alpha-2 country code using IP/Cloudflare headers.
 */
export const getPublicLocation = async (req, res) => {
  try {
    const cfCountry = req.headers["cf-ipcountry"];
    if (cfCountry && cfCountry !== "XX" && cfCountry.length === 2) {
      return res.status(200).json({ success: true, countryCode: cfCountry.toUpperCase() });
    }

    let ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket?.remoteAddress || req.ip || "";
    if (ip.startsWith("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }

    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      const externalRes = await fetch("https://ipapi.co/json/").catch(() => null);
      if (externalRes && externalRes.ok) {
        const geoData = await externalRes.json();
        if (geoData?.country_code) {
          return res.status(200).json({ success: true, countryCode: geoData.country_code.toUpperCase() });
        }
      }
      return res.status(200).json({ success: true, countryCode: "IN" });
    }

    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`).catch(() => null);
    if (geoRes && geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData?.country_code) {
        return res.status(200).json({ success: true, countryCode: geoData.country_code.toUpperCase() });
      }
    }

    return res.status(200).json({ success: true, countryCode: "US" });
  } catch (error) {
    console.error("[public] getPublicLocation error:", error);
    return res.status(200).json({ success: true, countryCode: "US" });
  }
};

/**
 * GET /api/public/orders/:identifier (orderNumber or Mongo _id)
 */
export const getPublicOrderById = async (req, res) => {
  const { identifier } = req.params;
  try {
    let order;
    if (identifier && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(identifier)
        .populate("items.product", "_id name slug images mainImage basePrice discountPrice");
    }
    if (!order && identifier) {
      order = await Order.findOne({ orderNumber: identifier })
        .populate("items.product", "_id name slug images mainImage basePrice discountPrice");
    }
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Fetch public order error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/public/products/:id/reviews
 */
export const getProductReviews = async (req, res) => {
  const { id } = req.params;
  try {
    const filter = { status: "approved" };
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      filter.product = id;
    } else {
      const prod = await Product.findOne({ slug: id });
      if (prod) filter.product = prod._id;
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 });

    const totalCount = reviews.length;
    let avgRating = 5.0;
    let ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let fitCounts = { "True to Size": 0, "Runs Small": 0, "Runs Large": 0 };

    if (totalCount > 0) {
      const sum = reviews.reduce((acc, r) => {
        const rating = Math.min(5, Math.max(1, r.rating || 5));
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
        if (r.fit && fitCounts[r.fit] !== undefined) {
          fitCounts[r.fit] += 1;
        }
        return acc + rating;
      }, 0);
      avgRating = Number((sum / totalCount).toFixed(1));
    }

    return res.status(200).json({
      success: true,
      reviews,
      totalCount,
      avgRating,
      ratingCounts,
      fitCounts
    });
  } catch (error) {
    console.error("Fetch product reviews error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/public/products/:id/reviews
 */
export const createProductReview = async (req, res) => {
  const { id } = req.params;
  const { name, email, rating, title, comment, fit, photos } = req.body;

  if (!name || !email || !rating || !comment) {
    return res.status(400).json({ success: false, message: "Name, email, rating, and comment are required." });
  }

  try {
    let productId = id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const prod = await Product.findOne({ slug: id });
      if (prod) productId = prod._id;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find all matching Customer and CustomerUser IDs for this email
    const matchingCustomers = await Customer.find({ email: normalizedEmail }).select("_id");
    const customerIds = matchingCustomers.map((c) => c._id);

    const matchingUser = await CustomerUser.findOne({ email: normalizedEmail }).select("_id");
    if (matchingUser) {
      customerIds.push(matchingUser._id);
    }

    const prodStr = String(productId);
    const prodObjId = mongoose.Types.ObjectId.isValid(prodStr) ? new mongoose.Types.ObjectId(prodStr) : null;

    const productMatchConditions = prodObjId
      ? [{ "items.product": prodObjId }, { "items.product": prodStr }]
      : [{ "items.product": prodStr }];

    // Enforce requirement: ONLY users with a delivered order for this product can leave a review
    const deliveredOrder = await Order.findOne({
      status: "delivered",
      $or: [
        { customer: { $in: customerIds } },
        { "shippingAddress.email": normalizedEmail }
      ],
      $or: productMatchConditions
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: "Only verified customers with a delivered order for this product can leave a review."
      });
    }

    const newReview = new Review({
      product: productId,
      name,
      email: normalizedEmail,
      rating: Number(rating),
      title: title || "",
      comment,
      fit: fit || "True to Size",
      photos: Array.isArray(photos) ? photos : [],
      verified: true,
      status: "approved"
    });

    await newReview.save();

    return res.status(201).json({
      success: true,
      message: "Thank you! Your verified review has been published.",
      review: newReview
    });
  } catch (error) {
    console.error("Create product review error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
