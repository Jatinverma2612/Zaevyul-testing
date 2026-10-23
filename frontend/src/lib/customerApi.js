/**
 * customerApi.js — API client for customer storefront endpoints.
 * Base URL: /api/customer  (completely separate from /api/admin)
 * Does NOT import from or touch the admin api.js.
 */

const CUSTOMER_BASE_URL =
  import.meta.env.VITE_CUSTOMER_API_URL || "http://localhost:5000/api/customer";

/**
 * Low-level fetch wrapper for customer endpoints.
 * Sends credentials (cookies) automatically.
 * Reads the customer JWT from sessionStorage as a fallback header.
 */
const request = async (path, options = {}) => {
  options.headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  options.credentials = "include";

  // Attach token from sessionStorage as Authorization header fallback
  const token = sessionStorage.getItem("zae_customer_jwt");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${CUSTOMER_BASE_URL}${path}`, options);
  const contentType = res.headers.get("content-type") || "";
  let data = {};
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}: ${res.statusText || "Request Error"}`);
    }
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const customerApi = {
  // ─── Auth ────────────────────────────────────────────────────────────────────

  auth: {
    /** Send OTP to email */
    sendEmailOtp: (email) =>
      request("/auth/email/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    /** Verify email OTP → returns { success, token, user } */
    verifyEmailOtp: async (email, otp) => {
      const res = await request("/auth/email/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      if (res.token) sessionStorage.setItem("zae_customer_jwt", res.token);
      return res;
    },

    /** Send OTP to phone */
    sendPhoneOtp: (phone, countryCode) =>
      request("/auth/phone/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone, countryCode }),
      }),

    /** Verify phone OTP → returns { success, token, user } */
    verifyPhoneOtp: async (phone, otp, countryCode) => {
      const res = await request("/auth/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp, countryCode }),
      });
      if (res.token) sessionStorage.setItem("zae_customer_jwt", res.token);
      return res;
    },

    /** Google login with ID token from Google Identity Services */
    googleLogin: async (credential) => {
      const res = await request("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });
      if (res.token) sessionStorage.setItem("zae_customer_jwt", res.token);
      return res;
    },

    /** Get the currently authenticated customer */
    me: async () => {
      try {
        const res = await request("/auth/me");
        return res.user;
      } catch {
        return null;
      }
    },

    /** Logout */
    logout: async () => {
      try {
        await request("/auth/logout", { method: "POST" });
      } catch {
        /* ignore */
      }
      sessionStorage.removeItem("zae_customer_jwt");
    },

    /** Update customer name, email, or profileImage */
    updateProfile: (profileData) =>
      request("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      }),

    /** Update customer marketing preference */
    updateMarketing: (emailUpdates) =>
      request("/auth/marketing", {
        method: "PUT",
        body: JSON.stringify({ emailUpdates }),
      }),

    /** Legacy address aliases retained for existing callers */
    addAddress: (addressData) => customerApi.addresses.create(addressData),
    deleteAddress: (addressId) => customerApi.addresses.remove(addressId),
    setDefaultAddress: (addressId) =>
      customerApi.addresses.setDefault(addressId),
  },

  addresses: {
    getAll: () => request("/addresses"),
    getById: (addressId) => request(`/addresses/${addressId}`),
    create: (addressData) =>
      request("/addresses", {
        method: "POST",
        body: JSON.stringify(addressData),
      }),
    update: (addressId, addressData) =>
      request(`/addresses/${addressId}`, {
        method: "PUT",
        body: JSON.stringify(addressData),
      }),
    remove: (addressId) =>
      request(`/addresses/${addressId}`, {
        method: "DELETE",
      }),
    setDefault: (addressId) =>
      request(`/addresses/${addressId}/default`, {
        method: "PUT",
      }),
  },

  // ─── Favorites ───────────────────────────────────────────────────────────────

  postalLookup: {
    lookup: ({ countryCode, postalCode }) =>
      request(
        `/addresses/postal-lookup?countryCode=${encodeURIComponent(countryCode)}&postalCode=${encodeURIComponent(postalCode)}`,
      ),
  },

  favorites: {
    /** Get all favorites for the logged-in customer */
    getAll: () => request("/favorites"),

    /** Add a product to favorites */
    add: (productId) => request(`/favorites/${productId}`, { method: "POST" }),

    /** Remove a product from favorites */
    remove: (productId) =>
      request(`/favorites/${productId}`, { method: "DELETE" }),
  },

  // ─── Orders ──────────────────────────────────────────────────────────────────

  orders: {
    /** Get order history for the logged-in customer */
    getAll: () => request("/orders"),

    /** Place a new order */
    place: (orderData) =>
      request("/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      }),

    /** Calculate dynamic tax for checkout/cart preview */
    calculateTax: (data) =>
      request("/orders/calculate-tax", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getById: async (id) => {
      try {
        return await request(`/orders/${id}`);
      } catch (err) {
        try {
          const PUBLIC_URL =
            import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:5000/api/public";
          const res = await fetch(`${PUBLIC_URL}/orders/${id}`);
          if (res.ok) return await res.json();
        } catch {
          /* ignore */
        }
        throw err;
      }
    },

    /** Cancel pending order */
    cancel: (orderId) =>
      request(`/orders/${orderId}/cancel`, {
        method: "POST",
      }),

    /** Create Razorpay order ID */
    createRazorpayOrder: (orderData) =>
      request("/orders/create-razorpay-order", {
        method: "POST",
        body: JSON.stringify(orderData),
      }),

    /** Verify Razorpay payment signature & create paid order */
    verifyRazorpayPayment: (verificationData) =>
      request("/orders/verify-razorpay-payment", {
        method: "POST",
        body: JSON.stringify(verificationData),
      }),

    /** Download invoice PDF for order */
    downloadInvoice: async (orderId, filename = "invoice.pdf") => {
      const token = sessionStorage.getItem("zae_customer_jwt");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${CUSTOMER_BASE_URL}/orders/${orderId}/invoice`, {
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
  },
};
