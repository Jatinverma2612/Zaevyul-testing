const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/admin")
  .trim()
  .replace(/\/+$/, "");

// Derive root URL (e.g., https://zaevyul-testing-backend.onrender.com)
const backendOrigin = rawApiUrl.replace(/\/api\/(admin|customer|public)$/, "");

const BASE_URL = rawApiUrl.endsWith("/api/admin")
  ? rawApiUrl
  : `${backendOrigin}/api/admin`;

const PUBLIC_BASE_URL = import.meta.env.VITE_PUBLIC_API_URL
  ? import.meta.env.VITE_PUBLIC_API_URL.trim().replace(/\/+$/, "")
  : `${backendOrigin}/api/public`;

// Clean up legacy mock database caches from localStorage if present
if (typeof window !== "undefined") {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("zae_db_")) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    /* ignore */
  }
}

// Helper for public (unauthenticated) storefront fetch calls
const publicRequest = async (url, options = {}) => {
  options.headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const res = await fetch(`${PUBLIC_BASE_URL}${url}`, options);
  const contentType = res.headers.get("content-type") || "";
  let data = {};
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}: ${res.statusText || "Not Found"}`);
    }
  }
  if (!res.ok) throw new Error(data.message || "Public API request failed");
  return data;
};

// Helper for authenticated admin fetch calls
const request = async (url, options = {}) => {
  options.headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  options.credentials = "include";

  const token = sessionStorage.getItem("zae_jwt");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, options);
  const contentType = res.headers.get("content-type") || "";
  let data = {};
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}: ${res.statusText || "API Error"}`);
    }
  }
  if (!res.ok) throw new Error(data.message || "API request failed");
  const method = (options.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("admin-data-updated"));
    }
  }
  return data;
};

export const getCategorySlug = (category) => {
  if (!category) return "shawls";
  if (typeof category === "object") {
    return (
      category.slug ||
      (category.name
        ? category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : "shawls")
    );
  }
  const staticMap = {
    "cat-001": "shawls",
    "cat-002": "stoles",
    "cat-003": "blankets",
    "cat-004": "scarves",
    "cat-005": "accessories",
  };
  if (staticMap[category]) return staticMap[category];
  if (typeof category === "string") {
    return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  return "shawls";
};

export const getHoverImage = (product) => {
  if (!product) return "/storefront/prod-2.png";
  if (product.images && product.images[1] && product.images[1].url) {
    return product.images[1].url;
  }
  const idStr = String(product._id || product.id || product.name || "");
  const charCodeSum = idStr
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbacks = [
    "/storefront/prod-2.png",
    "/storefront/cat-embroidered.png",
    "/storefront/pashmina-banner.png",
    "/storefront/artisan.png",
    "/storefront/prod-1.png",
    "/storefront/prod-3.png",
    "/storefront/prod-stack.png",
    "/storefront/cat-shawls.png",
  ];
  return fallbacks[charCodeSum % fallbacks.length];
};

export const api = {
  // Auth
  auth: {
    login: async (email, password) => {
      const res = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.token) sessionStorage.setItem("zae_jwt", res.token);
      return res.user;
    },
    logout: async () => {
      try {
        await request("/auth/logout", { method: "POST" });
      } catch {
        /* ignore */
      }
      sessionStorage.removeItem("zae_jwt");
    },
    me: async () => {
      try {
        const res = await request("/auth/me");
        return res.user;
      } catch {
        return null;
      }
    },
  },

  // Reviews
  reviews: {
    get: async (productId) => {
      const res = await publicRequest(`/products/${productId}/reviews`);
      return res;
    },
    create: async (productId, reviewData) => {
      const res = await publicRequest(`/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
      return res;
    },
  },

  // Products
  products: {
    listPublic: async (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      const res = await publicRequest(`/products?${query}`);
      return res.products || [];
    },
    list: async (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      const token = typeof window !== "undefined" ? sessionStorage.getItem("zae_jwt") : null;
      if (token) {
        try {
          const res = await request(`/products?${query}`);
          return res.products || [];
        } catch (e) {
          console.warn("Admin products request failed, falling back to public products:", e);
        }
      }
      const res = await publicRequest(`/products?${query}`);
      return res.products || [];
    },
    featured: async () => {
      const res = await publicRequest("/products?featured=true");
      return res.products || [];
    },
    get: async (id) => {
      const res = await request(`/products/${id}`);
      return res.product;
    },
    getBySlug: async (slug) => {
      const res = await publicRequest(`/products/${slug}`);
      return res.product;
    },
    create: async (data) => {
      const res = await request("/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.product;
    },
    update: async (id, data) => {
      const res = await request(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.product;
    },
    delete: async (id) => {
      await request(`/products/${id}`, { method: "DELETE" });
    },
    duplicate: async (id) => {
      const res = await request(`/products/${id}/duplicate`, {
        method: "POST",
      });
      return res.product;
    },
    toggleFeatured: async (id) => {
      const res = await request(`/products/${id}/featured`, {
        method: "PATCH",
      });
      return res.product;
    },
    bulkDelete: async (ids) => {
      await request("/products/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
    },
  },

  // Categories
  categories: {
    list: async () => {
      const res = await publicRequest("/categories");
      return res.categories || [];
    },
    get: async (id) => {
      const res = await request(`/categories/${id}`);
      return res.category;
    },
    create: async (data) => {
      const res = await request("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.category;
    },
    update: async (id, data) => {
      const res = await request(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.category;
    },
    delete: async (id) => {
      await request(`/categories/${id}`, { method: "DELETE" });
    },
    toggleFeatured: async (id) => {
      const res = await request(`/categories/${id}/featured`, {
        method: "PATCH",
      });
      return res.category;
    },
    featured: async () => {
      const res = await publicRequest("/categories/featured");
      return res.categories || [];
    },
  },

  // Orders
  orders: {
    list: async (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      const res = await request(`/orders?${query}`);
      return res.orders || [];
    },
    get: async (id) => {
      const res = await request(`/orders/${id}`);
      return res.order;
    },
    updateStatus: async (id, statusData) => {
      const res = await request(`/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(statusData),
      });
      return res.order;
    },
    addNote: async (id, notes) => {
      const res = await request(`/orders/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
      return res.order;
    },
    bulkDelete: async (ids) => {
      await request("/orders/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
    },
    downloadInvoice: async (orderId, filename = "invoice.pdf") => {
      const token = sessionStorage.getItem("zae_jwt");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/orders/${orderId}/invoice`, {
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to download invoice PDF.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    },
    viewInvoiceInNewTab: async (orderId) => {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(
          "<!DOCTYPE html><html><head><title>Loading Invoice...</title></head><body style='font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#FAF8F5;color:#1C1916;'><p style='font-size:14px;letter-spacing:0.05em;'>Loading Invoice, please wait...</p></body></html>"
        );
      }
      try {
        const token = sessionStorage.getItem("zae_jwt");
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}/orders/${orderId}/invoice`, {
          headers,
          credentials: "include",
        });

        if (!res.ok) {
          if (win && !win.closed) win.close();
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to load invoice PDF.");
        }

        const blob = await res.blob();
        const pdfUrl = window.URL.createObjectURL(blob);
        if (win && !win.closed) {
          win.location.href = pdfUrl;
        } else {
          window.open(pdfUrl, "_blank");
        }
      } catch (err) {
        if (win && !win.closed) win.close();
        throw err;
      }
    },
    regenerateInvoice: async (orderId) => {
      const res = await request(`/orders/${orderId}/invoice/regenerate`, {
        method: "POST",
      });
      return res;
    },
  },

  // Customers
  customers: {
    list: async (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      const res = await request(`/customers?${query}`);
      return res.customers || [];
    },
    get: async (id) => {
      const res = await request(`/customers/${id}`);
      return { customer: res.customer, orders: res.orders || [] };
    },
    bulkDelete: async (ids) => {
      await request("/customers/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
    },
  },

  // Blogs
  blogs: {
    publicList: async () => {
      const res = await publicRequest("/blogs");
      return res.blogs || [];
    },
    getBySlug: async (slug) => {
      const res = await publicRequest(`/blogs/${slug}`);
      return res.blog;
    },
    list: async (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      const res = await request(`/blogs?${query}`);
      return res.blogs || [];
    },
    get: async (id) => {
      const res = await request(`/blogs/${id}`);
      return res.blog;
    },
    create: async (data) => {
      const res = await request("/blogs", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.blog;
    },
    update: async (id, data) => {
      const res = await request(`/blogs/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.blog;
    },
    delete: async (id) => {
      await request(`/blogs/${id}`, { method: "DELETE" });
    },
  },

  // Blog Categories
  blogCategories: {
    list: async () => {
      const res = await request("/blog-categories");
      return res.categories || [];
    },
    get: async (id) => {
      const res = await request(`/blog-categories/${id}`);
      return res.category;
    },
    create: async (data) => {
      const res = await request("/blog-categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.category;
    },
    update: async (id, data) => {
      const res = await request(`/blog-categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.category;
    },
    delete: async (id) => {
      await request(`/blog-categories/${id}`, { method: "DELETE" });
    },
  },

  // Media Coverage
  mediaCoverage: {
    publicList: async () => {
      const res = await publicRequest("/media-coverage");
      return res.items || [];
    },
    list: async (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      const res = await request(`/media-coverage?${query}`);
      return res.items || [];
    },
    get: async (id) => {
      const res = await request(`/media-coverage/${id}`);
      return res.item;
    },
    create: async (data) => {
      const res = await request("/media-coverage", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.item;
    },
    update: async (id, data) => {
      const res = await request(`/media-coverage/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.item;
    },
    delete: async (id) => {
      await request(`/media-coverage/${id}`, { method: "DELETE" });
    },
  },


  // Coupons
  coupons: {
    list: async () => {
      const res = await request("/coupons");
      return res.coupons || [];
    },
    create: async (data) => {
      const res = await request("/coupons", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.coupon;
    },
    update: async (id, data) => {
      const res = await request(`/coupons/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.coupon;
    },
    toggle: async (id) => {
      const res = await request(`/coupons/${id}/toggle`, { method: "PUT" });
      return res.coupon;
    },
    delete: async (id) => {
      await request(`/coupons/${id}`, { method: "DELETE" });
    },
    bulkDelete: async (ids) => {
      await request("/coupons/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
    },
    // Public storefront — list all active coupons (no auth required)
    listPublic: async () => {
      const res = await publicRequest("/coupons");
      return res.coupons || [];
    },
    // Public storefront — validate a coupon code
    validate: async (code, cartSubtotal = 0) => {
      const res = await publicRequest("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, cartSubtotal }),
      });
      return res.coupon;
    },
  },

  // Newsletter
  newsletter: {
    subscribe: async (email) => {
      const res = await publicRequest("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return res;
    },
    list: async (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      const res = await request(`/newsletter?${query}`);
      return res.subscribers || [];
    },
    delete: async (id) => {
      await request(`/newsletter/${id}`, { method: "DELETE" });
    },
    bulkDelete: async (ids) => {
      await request("/newsletter/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
    },
  },

  // Reports
  reports: {
    get: async () => {
      const res = await request("/reports");
      return {
        stats: res.stats || {
          totalRevenue: 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalCustomers: 0,
          totalProducts: 0,
          inStockCount: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
        },
        categoryBreakdown: res.categoryBreakdown || [],
        channelBreakdown: res.channelBreakdown || [],
        monthlyReport: res.monthlyReport || [],
        topProducts: res.topProducts || [],
      };
    },
  },

  // Location
  location: {
    get: async () => {
      try {
        const res = await publicRequest("/location");
        return res.countryCode || "US";
      } catch (err) {
        console.warn("Failed to fetch location from backend, attempting fallback:", err);
        const geoRes = await fetch("https://ipapi.co/json/").catch(() => null);
        if (geoRes && geoRes.ok) {
          const data = await geoRes.json();
          if (data?.country_code) return data.country_code.toUpperCase();
        }
        return "US";
      }
    },
  },

  // Settings
  settings: {
    getPublicLive: async () => {
      const res = await publicRequest("/settings");
      return res.settings;
    },
    getPublic: async () => {
      const res = await publicRequest("/settings");
      return res.settings;
    },
    get: async () => {
      const res = await request("/settings");
      return res.settings;
    },
    update: async (data) => {
      const res = await request("/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.settings;
    },
  },

  // Branding API
  branding: {
    getPublic: async () => {
      const res = await publicRequest("/branding");
      return res;
    },
    getAdmin: async () => {
      const res = await request("/settings/branding");
      return res;
    },
    uploadLogo: async (fileOrBase64) => {
      let imagePayload = fileOrBase64;
      if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
        imagePayload = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrBase64);
        });
      }
      const res = await request("/settings/branding/logo", {
        method: "POST",
        body: JSON.stringify({ image: imagePayload }),
      });
      return res;
    },
    uploadFavicon: async (fileOrBase64) => {
      let imagePayload = fileOrBase64;
      if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
        imagePayload = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrBase64);
        });
      }
      const res = await request("/settings/branding/favicon", {
        method: "POST",
        body: JSON.stringify({ image: imagePayload }),
      });
      return res;
    },
    removeLogo: async () => {
      const res = await request("/settings/branding/logo", {
        method: "DELETE",
      });
      return res;
    },
    removeFavicon: async () => {
      const res = await request("/settings/branding/favicon", {
        method: "DELETE",
      });
      return res;
    },
  },

  // Tax Rules
  taxRules: {
    list: async () => {
      const res = await request("/tax-rules");
      return res.taxRules || [];
    },
    get: async (id) => {
      const res = await request(`/tax-rules/${id}`);
      return res.taxRule;
    },
    create: async (data) => {
      const res = await request("/tax-rules", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.taxRule;
    },
    update: async (id, data) => {
      const res = await request(`/tax-rules/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.taxRule;
    },
    delete: async (id) => {
      await request(`/tax-rules/${id}`, { method: "DELETE" });
    },
  },

  // Profile
  profile: {
    get: async () => {
      const res = await request("/profile");
      return res.user;
    },
    update: async (data) => {
      const res = await request("/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.user;
    },
    changePassword: async (currentPassword, newPassword) => {
      await request("/profile/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
  },

  // Cloudinary Upload API
  upload: {
    image: async (fileOrBase64, folder = "zaevyul/general") => {
      let imagePayload = fileOrBase64;
      if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
        imagePayload = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrBase64);
        });
      }

      const res = await request("/upload", {
        method: "POST",
        body: JSON.stringify({ image: imagePayload, folder }),
      });
      return res;
    },
  },
};
