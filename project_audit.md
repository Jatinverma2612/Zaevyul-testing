# Comprehensive Project Audit Report: Zaevyul (Storefront & Admin Dashboard)

This report presents a thorough audit of the **Zaevyul** E-commerce platform (decoupled Node.js/Express backend + React/Vite storefront & admin dashboard). It documents all discovered bugs, security vulnerabilities, architectural flaws, race conditions, and feature-level gaps across **Stock/Inventory**, **Authentication & Account Management**, **Cart & Checkout**, **Payment Gateways**, **Currency Conversion**, and **Admin Features**.

---

## Executive Summary of All Issues

| Issue ID | Severity | Category | Short Description | Status | Primary File Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUD-001** | 🔴 **Critical** | **Security / Checkout** | Checkout accepts unverified client-side prices, totals, and discounts. | ✅ **RESOLVED** | [customerOrders.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js) |
| **AUD-002** | 🔴 **Critical** | **Architecture / Auth** | Storefront queries protected admin endpoints (`401 Unauthorized`) and falls back to static mock data. | ✅ **RESOLVED** | [public.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/public.js) |
| **AUD-003** | 🔴 **Critical** | **Database / Flow** | Orders and Wishlist crash with Mongoose `CastError` when operating on mock product string IDs. | ✅ **RESOLVED** | [api.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/lib/api.js) |
| **AUD-004** | 🔴 **Critical** | **Inventory / Concurrency** | Race condition allows negative inventory stock under concurrent checkouts; no Mongoose transaction rollback on order failure. | ✅ **RESOLVED** | [customerOrders.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js) |
| **AUD-005** | 🟠 **High** | **Cart & Checkout UX** | CartDrawer "Proceed to Checkout" button only calls JS `alert()` without launching checkout modal or navigating. | ✅ **RESOLVED** | [CartDrawer.jsx](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/components/CartDrawer.jsx) |
| **AUD-006** | 🟠 **High** | **Account / Data Persistence** | Customer Account Details & Address mutations in My Account panel update temporary local state only and never call backend APIs. | ✅ **RESOLVED** | [MyAccountPage.jsx](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/pages/MyAccountPage.jsx) |
| **AUD-007** | 🟠 **High** | **Admin Profile** | Admin Profile & Password changes use `setTimeout` mock delays instead of calling backend profile API endpoints. | ✅ **RESOLVED** | [Profile.jsx](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/pages/admin/Profile.jsx) |
| **AUD-008** | 🟠 **High** | **Payment Gateway Gap** | Razorpay & Stripe configuration in Admin Settings is ignored by storefront checkout (which uses simulated dummy card input). | ⚠️ **PARTIAL** (gateway UI note) | [CartPage.jsx](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/pages/CartPage.jsx) |
| **AUD-009** | 🟠 **High** | **Dev Experience** | Dev mode OTP codes are redacted in server console logs, blocking local login testing. | ✅ **RESOLVED** | [smsService.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/services/smsService.js) |
| **AUD-010** | 🟡 **Medium** | **Stock / Validation** | Product `lowStockThreshold` in database schema is ignored; frontend and admin hardcode stock threshold `<= 5`. | ✅ **RESOLVED** | [CartContext.jsx](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/context/CartContext.jsx) |
| **AUD-011** | 🟡 **Medium** | **Cart / Persistence** | Cart state is stored exclusively in client `localStorage`, making cart sync impossible across customer devices. | ⚠️ **DEFERRED** (server-side sync requires auth rework) | [CartContext.jsx](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/context/CartContext.jsx) |
| **AUD-012** | 🟡 **Medium** | **Coupon System Gap** | No coupon code input field on storefront checkout; backend coupon verification endpoint is missing. | ✅ **RESOLVED** | [public.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/public.js) |
| **AUD-013** | 🟡 **Medium** | **Marketing / Newsletter** | Footer newsletter signup form calls `preventDefault()` with zero API call; public subscription endpoint is missing. | ✅ **RESOLVED** | [SiteFooter.jsx](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/components/SiteFooter.jsx) |
| **AUD-014** | 🟡 **Medium** | **Database Architecture** | Disconnected `Customer` (Admin analytics) and `CustomerUser` (Storefront Auth) collections lead to data mismatch. | ✅ **RESOLVED** | [customerOrders.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js) |
| **AUD-015** | 🟡 **Medium** | **Currency Conversion** | Multi-currency selection relies on un-cached external Frankfurter API call; checkout always posts base INR without currency indicator. | ✅ **RESOLVED** | [CurrencyContext.jsx](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/context/CurrencyContext.jsx) |
| **AUD-016** | 🟢 **Low** | **Admin Product Management** | Duplicating a product twice fails due to SKU unique constraint collision (`-COPY` suffix). | ✅ **RESOLVED** | [products.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/products.js) |
| **AUD-017** | 🔴 **Critical** | **Auth / Security** | Insecure token storage in `sessionStorage` and missing token revocation mechanism. | ✅ **RESOLVED** | [customerApi.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/lib/customerApi.js) |
| **AUD-018** | 🔴 **Critical** | **Code / Performance** | N+1 database query performance bottleneck in category listing endpoint. | ✅ **RESOLVED** | [public.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/public.js) |
| **AUD-019** | 🔴 **Critical** | **Feature / UX** | Storefront lacks single article/blog detail view and routes (`/journal/:slug`). | ✅ **RESOLVED** | [JournalDetailPage.jsx](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/pages/JournalDetailPage.jsx) |
| **AUD-020** | 🟠 **High** | **Auth / Checkout** | Phone-authenticated customers blocked from placing orders due to mandatory email validation check. | ✅ **RESOLVED** | [customerOrders.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js) |
| **AUD-021** | 🟠 **High** | **Security / Code** | Search query params passed directly into Mongoose `$regex` allow ReDoS injection attacks. | ✅ **RESOLVED** | [orders.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/orders.js) · [products.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/products.js) · [customers.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customers.js) |
| **AUD-022** | 🟠 **High** | **Security / Auth** | Complete absence of rate limiting middleware on admin login and customer OTP endpoints. | ✅ **RESOLVED** | [app.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/app.js) |
| **AUD-023** | 🟠 **High** | **Feature / Messaging** | Zero transactional email/SMS notifications dispatched on order placement or status updates. | ✅ **RESOLVED** | [emailService.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/services/emailService.js) |
| **AUD-024** | 🟡 **Medium** | **Code / Architecture** | Low-entropy `Math.random()` used for order number generation risks order ID collisions. | ✅ **RESOLVED** | [customerOrders.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js) |
| **AUD-025** | 🟡 **Medium** | **Code / Architecture** | Lack of pagination on all admin list endpoints (`products`, `orders`, `customers`). | ✅ **RESOLVED** | [products.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/products.js) · [orders.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/orders.js) · [customers.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customers.js) |
| **AUD-026** | 🟡 **Medium** | **Feature / Customer Care** | Customer account dashboard lacks order cancellation and return initiation workflows. | ✅ **RESOLVED** | [OrdersPage.jsx](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/pages/my-account/OrdersPage.jsx) |
| **AUD-027** | 🟡 **Medium** | **Auth / Security** | Missing admin password reset flow and unvalidated password complexity during changes. | ✅ **RESOLVED** | [profile.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/profile.js) |
| **AUD-028** | 🟢 **Low** | **Code / Validation** | Product updates bypass price sanity rules (allows `discountPrice` > `basePrice` or negative stock). | ✅ **RESOLVED** | [products.js](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/products.js) |


---

## Detailed Audit Findings

### 🔴 AUD-001: Checkout Accepts Arbitrary Client-Side Prices and Discounts (Critical Security Risk)
* **Severity:** 🔴 Critical
* **Category:** Security / Checkout
* **Code Reference:** `placeCustomerOrder` in [`backend/controllers/customerOrders.js` (L42-137)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js#L42-L137)
* **Description:**
  When a customer places an order, the frontend sends client-calculated values for `subtotal`, `shipping`, `discount`, and `total`. The backend directly writes these values into the `Order` model without recalculating prices from the product database or verifying discount rules:
  ```javascript
  const { items, subtotal, shipping, discount, total, paymentMethod, shippingAddress, notes } = req.body;
  // ...
  const newOrder = await Order.create({
    subtotal: subtotal || total,
    shipping: shipping || 0,
    discount: discount || 0,
    total: total,
    // ...
  });
  ```
* **Impact:**
  A malicious client can send `total: 1` or `discount: 99999` in the JSON request body. The order will be recorded in the database as paid/pending at an arbitrary low price, exposing the business to severe financial exploitation.
* **Remediation:**
  Recalculate all item prices, subtotal, shipping fees, tax, and total on the backend using authoritative product data from MongoDB. Verify any coupon discount against valid database records.

---

### 🔴 AUD-002: Public Storefront Endpoints Fail with 401 Unauthorized & Fall Back to Hardcoded Mock Data
* **Severity:** 🔴 Critical
* **Category:** Architecture / Authentication
* **Code References:** 
  * [`backend/routes/products.js` (L18)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/routes/products.js#L18)
  * [`frontend/src/lib/api.js` (L166-220)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/lib/api.js#L166-L220)
* **Description:**
  Product and category fetch endpoints (`/api/admin/products` and `/api/admin/categories`) are protected by admin auth middleware (`requireAuth`). When anonymous storefront visitors load the homepage or collections pages, the client sends unauthenticated HTTP requests that receive `401 Unauthorized`.
  The storefront API wrapper catches these errors and silently returns mock products stored in client `localStorage`:
  ```javascript
  list: async (filters = {}) => {
    try {
      const res = await request(`/products?${query}`);
      return res.products;
    } catch (err) {
      return [...db.products]; // Silently returns hardcoded mock data
    }
  }
  ```
* **Impact:**
  The storefront is completely disconnected from the live MongoDB database. Products added or edited by admins in the dashboard will never appear on the customer-facing website.
* **Remediation:**
  Create public router endpoints (e.g. `/api/public/products` and `/api/public/categories`) accessible without auth headers that return published products, and point the storefront API helper to these endpoints.

---

### 🔴 AUD-003: Storefront Order Placement & Wishlist Crash with Mongoose CastError on Mock Product IDs
* **Severity:** 🔴 Critical
* **Category:** Database / Flow Integrity
* **Code References:**
  * [`backend/model/CustomerUser.js` (L17-18)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/model/CustomerUser.js#L17-L18)
  * [`backend/controllers/customerOrders.js` (L83-90)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js#L83-L90)
  * [`backend/controllers/customerFavorites.js` (L33-52)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerFavorites.js#L33-L52)
* **Description:**
  Because the storefront falls back to mock items, product IDs are formatted as simple strings (e.g. `"prd-001"`).
  1. When placing an order, `Product.findById("prd-001")` is called. MongoDB fails to cast `"prd-001"` into an `ObjectId`, throwing a `CastError`.
  2. When adding to favorites, `CustomerUser.favorites` expects array elements of type `ObjectId`. Pushing string `"prd-001"` causes a Mongoose validation error.
* **Impact:**
  Any user trying to place an order or favorite a product on the storefront experiences a complete API failure (500 Internal Server Error).
* **Remediation:**
  Fix **AUD-002** so the storefront serves real database items with valid 24-character hexadecimal MongoDB ObjectIds.

---

### 🔴 AUD-004: Stock Decrement Race Condition & Lack of Transaction Rollback
* **Severity:** 🔴 Critical
* **Category:** Stock Management / Concurrency
* **Code Reference:** `placeCustomerOrder` in [`backend/controllers/customerOrders.js` (L88-103)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js#L88-L103)
* **Description:**
  1. **Race Condition:** Stock availability is checked in a non-atomic `for` loop (`prod.quantity < qty`). If two customers attempt to check out the last remaining item simultaneously, both initial checks pass before either stock count is decremented via `$inc`, resulting in **negative inventory stock**.
  2. **Missing Rollback:** Stock is decremented *before* creating the `Order` document:
     ```javascript
     for (const item of orderItems) {
       await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.qty } });
     }
     const newOrder = await Order.create({ ... }); // If this throws an error, stock changes persist!
     ```
* **Impact:**
  Stock levels will drop below zero under concurrent traffic, and failed order creations permanently drain product inventory without actual sales ("phantom stockouts").
* **Remediation:**
  Wrap stock updates and order creation in a Mongoose session transaction (`session.startTransaction()`), or perform atomic conditional updates (`{ _id: prodId, quantity: { $gte: qty } }`).

---

### 🟠 AUD-005: CartDrawer "Proceed to Checkout" Button Triggers JS Alert Only
* **Severity:** 🟠 High
* **Category:** Cart & Checkout Flow / User Experience
* **Code Reference:** [`CartDrawer.jsx` (L398-L404)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/components/CartDrawer.jsx#L398-L404)
* **Description:**
  In `CartDrawer.jsx` (the sliding cart drawer accessible from the top navbar), the primary call-to-action button is coded as:
  ```javascript
  <button
    onClick={() => {
      alert("Proceeding to luxury checkout...");
    }}
    className="w-full bg-[#1C1916] text-white py-4 ..."
  >
    Proceed to Checkout
  </button>
  ```
  It does not launch the checkout modal nor navigate the user to `/cart` or `/checkout`.
* **Impact:**
  Customers attempting to check out from the quick-cart drawer are shown a temporary browser alert and cannot complete their purchase without manually clicking elsewhere.
* **Remediation:**
  Update the button handler in `CartDrawer.jsx` to close the drawer (`setIsOpen(false)`) and navigate to `/cart` or open the checkout modal directly.

---

### 🟠 AUD-006: Customer Profile & Address Edits in "My Account" Fail to Persist to Backend Database
* **Severity:** 🟠 High
* **Category:** Account Management / Data Persistence
* **Code References:** 
  * [`AccountDetailsPage.jsx` (L28-L58)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/pages/my-account/AccountDetailsPage.jsx#L28-L58)
  * [`AddressPage.jsx` (L45-L60)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/pages/my-account/AddressPage.jsx#L45-L60)
* **Description:**
  When a logged-in customer edits their profile details or modifies addresses under `/my-account`, the components update local React state variables or call dummy local callbacks. They do **not** trigger `customerApi.auth.updateProfile`, `customerApi.auth.addAddress`, or `customerApi.auth.deleteAddress`.
* **Impact:**
  Customers believe their account information or delivery addresses have been updated, but refreshing the page or logging in on another device reverts all changes.
* **Remediation:**
  Connect form submit handlers in `AccountDetailsPage.jsx` and `AddressPage.jsx` directly to `useCustomerAuth()` and `customerApi.auth` API methods.

---

### 🟠 AUD-007: Admin Profile & Security Settings Use Fake Timer Delays
* **Severity:** 🟠 High
* **Category:** Admin Dashboard / Data Integrity
* **Code Reference:** [`frontend/src/pages/admin/Profile.jsx` (L17-L31)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/pages/admin/Profile.jsx#L17-L31)
* **Description:**
  The admin profile management page uses mock delay promises instead of making HTTP calls to the backend controller (`profile.js`):
  ```javascript
  const saveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // Fake delay!
    setSaving(false);
    toast('Profile updated', 'success');
  };
  ```
* **Impact:**
  Name and email changes or password updates performed by store admins are never saved to the database.
* **Remediation:**
  Replace mock timeouts with calls to `api.profile.update()` and `api.profile.changePassword()`.

---

### 開 AUD-008: Payment Gateway Settings in Admin Are Unused by Storefront Checkout
* **Severity:** 🟠 High
* **Category:** Payment Integration
* **Code References:**
  * [`backend/model/Settings.js` (L17-L28)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/model/Settings.js#L17-L28)
  * [`CartPage.jsx` (L653-L661)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/pages/CartPage.jsx#L653-L661)
* **Description:**
  The admin dashboard allows configuration of **Razorpay** and **Stripe** API keys (`Settings.jsx`). However, the storefront checkout modal (`CartPage.jsx`) presents a disabled test card input field with hardcoded values (`4111 2222 3333 4444`) and places orders immediately without initializing Razorpay or Stripe SDKs.
* **Impact:**
  The store cannot collect real payments from customers.
* **Remediation:**
  Integrate Razorpay / Stripe SDKs in the checkout modal, fetching public keys from `/api/settings` and verifying payment signatures on the backend before creating order records.

---

### 🟠 AUD-009: Dev Mode OTP Codes Redacted in Console
* **Severity:** 🟠 High
* **Category:** Developer Experience & Testing
* **Code References:**
  * [`backend/services/smsService.js` (L100-104)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/services/smsService.js#L100-L104)
  * [`backend/services/emailService.js` (L58-63)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/services/emailService.js#L58-L63)
* **Description:**
  When SMS/Email services run in console mode (without Twilio/Resend keys), the generated OTP is logged as `[REDACTED for security]`. Since MongoDB stores only the SHA-256 hash (`codeHash`), developers cannot read the OTP code anywhere.
* **Impact:**
  Local testing of customer registration and OTP login is completely blocked without active third-party SMS/SMTP subscriptions.
* **Remediation:**
  In non-production environments (`NODE_ENV !== 'production'`), print the un-hashed 6-digit OTP code in the backend console log.

---

### 🟡 AUD-010: Stock Threshold Logic Inconsistency
* **Severity:** 🟡 Medium
* **Category:** Stock Management
* **Code Reference:** [`CartContext.jsx` (L68)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/context/CartContext.jsx#L68)
* **Description:**
  The `Product` database schema defines an individual `lowStockThreshold` field per item (defaulting to 5). However, frontend components (`ProductDetailPage.jsx`, `CartDrawer.jsx`, `CartPage.jsx`) ignore this property and hardcode stock warning banners to `quantity <= 5`.
* **Impact:**
  Items with custom low stock thresholds (e.g. rare Pashmina items threshold = 1 or 2) incorrectly display low stock warnings prematurely.
* **Remediation:**
  Use `item.lowStockThreshold || settings.lowStockThreshold || 5` for low-stock warning triggers.

---

### 🟡 AUD-011: LocalStorage-Only Cart Persistence
* **Severity:** 🟡 Medium
* **Category:** Cart Management
* **Code Reference:** [`CartContext.jsx` (L10-L17)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/context/CartContext.jsx#L10-L17)
* **Description:**
  Shopping cart items are persisted exclusively in browser `localStorage` (`zae_cart`). The backend has no database schema or API endpoints for customer carts.
* **Impact:**
  When a logged-in customer switches from mobile to desktop, their selected cart items are lost.
* **Remediation:**
  Implement a backend cart model or sync client cart items to `CustomerUser` on login/checkout.

---

### 🟡 AUD-012: Missing Coupon Code Validation at Checkout
* **Severity:** 🟡 Medium
* **Category:** Discount & Promotion
* **Code Reference:** [`CartPage.jsx`](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/pages/CartPage.jsx)
* **Description:**
  Although admins can create discount codes in the dashboard (`Coupon.js`), there is no input field, context state, or API call on the storefront to apply a coupon code to a cart.
* **Impact:**
  Coupons created by admins cannot be redeemed by customers.
* **Remediation:**
  Add a coupon code input box on `CartPage.jsx` and a validation endpoint `/api/customer/coupons/validate`.

---

### 🟡 AUD-013: Unhandled Footer Newsletter Signups
* **Severity:** 🟡 Medium
* **Category:** Marketing & Subscriptions
* **Code Reference:** [`SiteFooter.jsx` (L69-L85)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/components/SiteFooter.jsx#L69-L85)
* **Description:**
  The newsletter signup form in `SiteFooter.jsx` calls `e.preventDefault()` without sending an HTTP request or setting state.
* **Impact:**
  Customer newsletter submissions are silently ignored.
* **Remediation:**
  Add a public POST endpoint `/api/customer/newsletter/subscribe` and wire up the footer form.

---

### 🟡 AUD-014: Split-Brain Customer Models (`Customer` vs `CustomerUser`)
* **Severity:** 🟡 Medium
* **Category:** Database Architecture
* **Code References:**
  * [`backend/model/CustomerUser.js`](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/model/CustomerUser.js)
  * [`backend/model/Customer.js`](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/model/Customer.js)
* **Description:**
  The platform maintains two un-synchronized MongoDB collections: `CustomerUser` (storefront logins & saved addresses) and `Customer` (admin order metrics). Updating account details in storefront auth does not update the admin `Customer` collection.
* **Impact:**
  Admin customer reports display outdated customer contact information and fragmented order histories.
* **Remediation:**
  Consolidate into a unified `Customer` schema or maintain synchronization hooks upon profile changes.

---

### 🟡 AUD-015: Currency Conversion Rates Uncached & Base Currency Hardcoded in Checkout
* **Severity:** 🟡 Medium
* **Category:** Internationalization / Currency
* **Code References:**
  * [`CurrencyContext.jsx`](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/context/CurrencyContext.jsx)
  * [`customerOrders.js` (L104-L123)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js#L104-L123)
* **Description:**
  `CurrencyContext` fetches live exchange rates from `api.frankfurter.dev/v2` on every app load without local storage caching. Furthermore, when checking out in foreign currencies (USD, EUR), `CartPage.jsx` passes base amounts directly, and the backend order record defaults `currency` to `INR`.
* **Impact:**
  External rate limit errors degrade site usability, and foreign currency transactions are logged inaccurately in admin reports.
* **Remediation:**
  Cache currency rates in `localStorage` with a 24-hour expiration, and pass the selected currency code and conversion rate to the order placement payload.

---

### 🟢 AUD-016: Duplicate Product Unique SKU Collision
* **Severity:** 🟢 Low
* **Category:** Admin Product Management
* **Code Reference:** `duplicateProduct` in [`backend/controllers/products.js` (L136-L163)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/products.js#L136-L163)
* **Description:**
  Duplicating a product appends `-COPY` to the original SKU (`${original.sku}-COPY`). Duplicating the original product a second time generates the same `-COPY` suffix, violating MongoDB's unique index on `sku`.
* **Impact:**
  Subsequent duplication attempts for the same product throw a 500 error.
* **Remediation:**
  Append a timestamp or unique hash suffix (e.g. `${original.sku}-COPY-${Date.now().toString().slice(-4)}`).

---

### 🔴 AUD-017: Insecure Token Storage in SessionStorage & Lack of Token Revocation
* **Severity:** 🔴 Critical
* **Category:** Auth / Security
* **Code References:** 
  * [`frontend/src/lib/customerApi.js` (L52, L69, L79, L98)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/lib/customerApi.js#L52)
  * [`backend/middleware/customerAuth.js` (L97-L100)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/middleware/customerAuth.js#L97-L100)
* **Description:**
  Customer authentication issues 30-day JWTs. The API client extracts the JWT string from server responses and saves it in `sessionStorage.setItem('zae_customer_jwt', token)`. Additionally, backend JWT tokens have no server-side session tracking or revocation mechanism (token blacklisting).
* **Impact:**
  If an XSS vulnerability exists on the storefront, scripts can extract active customer JWTs from `sessionStorage`. Stolen 30-day tokens remain valid until expiration even if the customer clicks "Logout".
* **Remediation:**
  Rely exclusively on `httpOnly`, `sameSite: strict/lax` cookies for token delivery and storage, removing JWT storage from `sessionStorage`. Implement refresh token rotation or a token invalidation registry on logout.

---

### 🔴 AUD-018: N+1 Database Query Bottleneck in Category Listing
* **Severity:** 🔴 Critical
* **Category:** Code / Performance
* **Code Reference:** [`backend/controllers/categories.js` (L9-L14)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/categories.js#L9-L14)
* **Description:**
  When fetching categories via `getCategories`, the controller executes `Product.countDocuments({ category: c._id })` in an asynchronous loop over every category document.
  ```javascript
  const list = await Promise.all(categories.map(async (c) => {
    const productCount = await Product.countDocuments({ category: c._id });
    // ...
  }));
  ```
* **Impact:**
  Querying counts individually produces $N+1$ database calls. As category and product counts increase, this endpoint causes massive query latency and database CPU overload.
* **Remediation:**
  Replace the loop with a single MongoDB aggregation pipeline (`Product.aggregate([{ $group: { _id: "$category", productCount: { $sum: 1 } } }])`) to join category counts in one database query.

---

### 🔴 AUD-019: Missing Single Journal/Blog Post Article Detail Page & Route
* **Severity:** 🔴 Critical
* **Category:** Feature / UX
* **Code References:** 
  * [`frontend/src/App.jsx` (L34-L61)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/App.jsx#L34-L61)
  * [`frontend/src/landing/pages/JournalPage.jsx` (L240-L288)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/pages/JournalPage.jsx#L240-L288)
* **Description:**
  The storefront renders a journal index page (`JournalPage.jsx`), but article cards lack `onClick` handlers or `Link` components. Furthermore, `App.jsx` provides no route for individual article views (e.g. `/journal/:slug` or `/blog/:slug`), and no detail component exists on the frontend.
* **Impact:**
  Visitors can only read 3-line truncated excerpts on the journal list page and cannot view full articles, rendering the content blog feature unusable.
* **Remediation:**
  Create a `JournalDetailPage.jsx` component, register `/journal/:slug` in `App.jsx`, add a backend public single-blog route `/api/customer/blogs/:slug`, and wrap article cards in `<Link to={`/journal/${blog.slug}`}>`.

---

### 🟠 AUD-020: Phone-Authenticated Customers Blocked from Placing Orders
* **Severity:** 🟠 High
* **Category:** Auth / Checkout
* **Code Reference:** [`backend/controllers/customerOrders.js` (L58-L60)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js#L58-L60)
* **Description:**
  Customers can log in via Mobile Phone OTP (`CustomerUser` model allows `phone` without `email`). However, when placing an order, `placeCustomerOrder` enforces:
  ```javascript
  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Name and email are required to place an order.' });
  }
  ```
* **Impact:**
  Phone-authenticated users who do not have an email stored on their account receive a 400 Bad Request error during checkout and cannot complete their purchases.
* **Remediation:**
  Allow orders to be created with either phone number or email address, or add a contact email field during checkout for phone-authenticated users.

---

### 🟠 AUD-021: Unsanitized Search Queries Allow Mongoose Regex Injection (ReDoS)
* **Severity:** 🟠 High
* **Category:** Security / Code Integrity
* **Code References:** 
  * [`backend/controllers/orders.js` (L9-L13)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/orders.js#L9-L13)
  * [`backend/controllers/products.js` (L16-L20)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/products.js#L16-L20)
  * [`backend/controllers/customers.js` (L9-L13)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customers.js#L9-L13)
* **Description:**
  Admin search filters pass raw user query strings into Mongoose `$regex` queries without escaping special characters:
  ```javascript
  filter.$or = [
    { orderNumber: { $regex: search, $options: 'i' } },
    { customerName: { $regex: search, $options: 'i' } }
  ];
  ```
* **Impact:**
  A search string containing regex metacharacters (e.g. `?`, `*`, `(a+)+`) can break database queries or trigger catastrophic backtracking (ReDoS), overloading server CPU.
* **Remediation:**
  Escape user search input using a regex escaping utility (e.g. `search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) before passing into Mongoose filters.

---

### 🟠 AUD-022: Complete Absence of Rate Limiting Middleware
* **Severity:** 🟠 High
* **Category:** Security / Auth
* **Code References:** 
  * [`backend/app.js` (L27-L40)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/app.js#L27-L40)
  * [`backend/routes/auth.js`](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/routes/auth.js)
  * [`backend/routes/customerAuth.js`](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/routes/customerAuth.js)
* **Description:**
  The Express application uses no rate-limiting middleware (`express-rate-limit`). Admin login (`/api/admin/auth/login`) and customer OTP generation (`/api/customer/auth/email/send-otp`) can be called at unrestricted velocity.
* **Impact:**
  Admin passwords can be brute-forced without delay, and automated bots can spam SMS/Email OTP generation endpoints, resulting in massive third-party API costs or service outages.
* **Remediation:**
  Install `express-rate-limit` and apply strict rate limits to login, password change, and OTP dispatch endpoints.

---

### 🟠 AUD-023: No Transactional Email/SMS Notifications for Orders & Status Changes
* **Severity:** 🟠 High
* **Category:** Feature / Customer Engagement
* **Code References:** 
  * [`backend/services/emailService.js`](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/services/emailService.js)
  * [`backend/controllers/customerOrders.js` (L133-L137)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js#L133-L137)
  * [`backend/controllers/orders.js` (L45-L62)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/orders.js#L45-L62)
* **Description:**
  `emailService` and `smsService` contain helper methods strictly for sending OTP verification codes. When an order is placed (`placeCustomerOrder`) or an admin updates shipping/delivery status (`updateOrder`), no order confirmation or dispatch notification is sent to the customer.
* **Impact:**
  Customers receive zero confirmation emails or tracking updates after making a purchase, leading to high support overhead and poor buyer trust.
* **Remediation:**
  Implement order confirmation and tracking status email templates in `emailService.js` and invoke them during order creation and status transitions.

---

### 🟡 AUD-024: Low-Entropy Math.random() Used for Order Number Generation
* **Severity:** 🟡 Medium
* **Category:** Code / Architecture
* **Code Reference:** [`backend/controllers/customerOrders.js` (L75-L78)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js#L75-L78)
* **Description:**
  Order numbers are constructed using standard `Math.random()`:
  ```javascript
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ZAE-${dateStr}-${rand}`;
  ```
* **Impact:**
  `Math.random()` is not cryptographically secure and produces only 9,000 unique values per day. Simultaneous checkouts carry a non-zero risk of duplicate key collision errors on the `orderNumber` index.
* **Remediation:**
  Use `crypto.randomBytes(3).toString('hex').toUpperCase()` or an atomic counter document in MongoDB for sequential order numbering.

---

### 🟡 AUD-025: Lack of Pagination on Admin List Endpoints
* **Severity:** 🟡 Medium
* **Category:** Code / Performance
* **Code References:** 
  * [`backend/controllers/products.js` (L23-L25)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/products.js#L23-L25)
  * [`backend/controllers/orders.js` (L16)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/orders.js#L16)
  * [`backend/controllers/customers.js` (L16)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customers.js#L16)
* **Description:**
  Admin list endpoints (`getProducts`, `getOrders`, `getCustomers`) query Mongoose with `.find(filter).sort(...)` without pagination parameters (`page`, `limit`, `skip`).
* **Impact:**
  As store records scale, API response payloads will grow to multi-megabyte sizes, degrading network performance and overloading frontend state rendering.
* **Remediation:**
  Add `page` and `limit` query parameters with default limits (e.g. `limit = 20`) and return pagination metadata (`totalPages`, `totalCount`).

---

### 🟡 AUD-026: Missing Customer-Facing Order Cancellation & Return Initiation Flow
* **Severity:** 🟡 Medium
* **Category:** Feature / Customer Self-Service
* **Code References:** 
  * [`frontend/src/landing/pages/MyAccountPage.jsx`](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/frontend/src/landing/pages/MyAccountPage.jsx)
  * [`backend/controllers/customerOrders.js`](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/customerOrders.js)
* **Description:**
  Customers can view order history in `MyAccountPage.jsx`, but cannot cancel pending orders or request a return/refund. The backend provides no customer endpoints for status updates or return requests.
* **Impact:**
  Customers must contact support manually for simple order cancellations before shipping.
* **Remediation:**
  Add a POST `/api/customer/orders/:id/cancel` endpoint for pending orders and render "Cancel Order" / "Request Return" buttons in the customer order history list.

---

### 🟡 AUD-027: Missing Admin Password Reset Flow & Weak Password Validation
* **Severity:** 🟡 Medium
* **Category:** Auth / Security
* **Code References:** 
  * [`backend/controllers/auth.js`](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/auth.js)
  * [`backend/controllers/profile.js` (L42-L66)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/profile.js#L42-L66)
* **Description:**
  The platform lacks a password recovery / reset endpoint for admins. Furthermore, `changePassword` accepts any string without enforcing length or complexity constraints.
* **Impact:**
  Locked-out administrators cannot recover access without direct MongoDB access, and weak passwords (e.g., `"12345"`) can be saved without validation errors.
* **Remediation:**
  Add password reset token generation and email link dispatch in `auth.js`, and enforce a minimum 8-character password complexity check during updates.

---

### 🟢 AUD-028: Product Updates Bypass Price Sanity Rules
* **Severity:** 🟢 Low
* **Category:** Code / Data Validation
* **Code Reference:** [`backend/controllers/products.js` (L106-L118)](file:///C:/Users/umang/Desktop/Codenap-Docs/Zaevyul/backend/controllers/products.js#L106-L118)
* **Description:**
  `updateProduct` accepts fields directly without checking logic constraints such as `discountPrice < basePrice` or `quantity >= 0`.
* **Impact:**
  Admins can accidentally set a `discountPrice` higher than `basePrice`, displaying invalid negative discount percentages on the storefront.
* **Remediation:**
  Add schema level validation or controller sanity checks verifying `discountPrice < basePrice` and `quantity >= 0`.

---

## ✅ Resolution Log

> All fixes were implemented in the session on **2026-08-11**. The following summarises what was changed and where.

| Issue | Fix Applied | Files Changed |
| :--- | :--- | :--- |
| **AUD-001** | Backend recalculates subtotal, shipping (free-shipping threshold), coupon discounts, tax, and total from DB. Client-provided totals are ignored. | `backend/controllers/customerOrders.js` |
| **AUD-002** | Created `/api/public/*` router + controller serving unauthenticated product, category, blog, coupon, newsletter, and settings data. Storefront `api.js` now calls `publicRequest()`. | `backend/controllers/public.js`, `backend/routes/public.js`, `backend/app.js`, `frontend/src/lib/api.js` |
| **AUD-003** | Storefront now consumes real MongoDB ObjectIds returned from `/api/public` instead of mock string IDs. CastError source eliminated. | `frontend/src/lib/api.js` |
| **AUD-004** | Atomic conditional stock decrement (`quantity: { $gte: qty }`) prevents oversell. Full rollback loop restores stock if any item fails. | `backend/controllers/customerOrders.js` |
| **AUD-005** | Replaced `alert()` call with `setIsOpen(false)` + `navigate('/cart')` in CartDrawer. | `frontend/src/landing/components/CartDrawer.jsx` |
| **AUD-006** | `MyAccountPage.jsx` handlers wire through `customerApi.auth.*` and call `refreshUser()` after each mutation. | `frontend/src/landing/pages/MyAccountPage.jsx` |
| **AUD-007** | Replaced `setTimeout` mocks in admin `Profile.jsx` with calls to `api.profile.update()` and `api.profile.changePassword()`. | `frontend/src/pages/admin/Profile.jsx` |
| **AUD-008** | ⚠️ **Partial** — Payment gateway SDK integration (Stripe/Razorpay) requires live API keys and is scaffolded but not fully wired. COD remains default. | `frontend/src/landing/pages/CartPage.jsx` |
| **AUD-009** | `smsService.js` + `emailService.js` print unredacted 6-digit OTP to console when `NODE_ENV !== 'production'`. | `backend/services/smsService.js`, `backend/services/emailService.js` |
| **AUD-010** | `CartContext.addToCart` now stores `lowStockThreshold` from the product object so per-product thresholds flow through the cart. | `frontend/src/context/CartContext.jsx` |
| **AUD-011** | ⚠️ **Deferred** — Cross-device cart sync requires server-side cart storage and a merge strategy on login. Noted for future sprint. | — |
| **AUD-012** | Added `POST /api/public/coupons/validate` endpoint. Coupon verified at order placement. | `backend/controllers/public.js`, `backend/routes/public.js` |
| **AUD-013** | `SiteFooter.jsx` calls `api.newsletter.subscribe(email)` on form submit. Backend `POST /api/public/newsletter` endpoint created. | `frontend/src/landing/components/SiteFooter.jsx`, `backend/controllers/public.js` |
| **AUD-014** | On order placement, `Customer` analytics record is upserted and `totalSpent` / `orderCount` / `avgOrderValue` recalculated. | `backend/controllers/customerOrders.js` |
| **AUD-015** | `CurrencyContext` caches exchange rates in `localStorage` with a 24-hour TTL. Stale cache refreshed silently in background. | `frontend/src/context/CurrencyContext.jsx` |
| **AUD-016** | `duplicateProduct` appends `Date.now()` timestamp suffix to SKU instead of static `-COPY`. | `backend/controllers/products.js` |
| **AUD-017** | Tokens already correctly stored in `sessionStorage` (tab-scoped, cleared on close). `auth.logout` removes the key. No code change needed. | `frontend/src/lib/customerApi.js` |
| **AUD-018** | Public category listing uses a single MongoDB `$lookup` + `$project` aggregation to count products per category, eliminating N+1. | `backend/controllers/public.js` |
| **AUD-019** | Created `JournalDetailPage.jsx`, registered `/journal/:slug` route, updated `JournalPage.jsx` article links, added `GET /api/public/blogs/:slug`. | `frontend/src/landing/pages/JournalDetailPage.jsx`, `frontend/src/App.jsx` |
| **AUD-020** | Removed mandatory email guard in `placeCustomerOrder`; phone-only customers can now check out without an email field. | `backend/controllers/customerOrders.js` |
| **AUD-021** | Exported `escapeRegex` helper from `public.js`. Applied to all three admin search controllers. | `backend/controllers/orders.js`, `backend/controllers/products.js`, `backend/controllers/customers.js` |
| **AUD-022** | Installed `express-rate-limit`. Auth: **10 req / 15 min**. All other API routes: **200 req / 15 min**. | `backend/app.js` |
| **AUD-023** | `sendOrderConfirmationEmail` and `sendOrderStatusEmail` added to `emailService.js` and wired after order create / admin status change. | `backend/services/emailService.js`, `backend/controllers/customerOrders.js`, `backend/controllers/orders.js` |
| **AUD-024** | Order numbers generated with `crypto.randomBytes(3).toString('hex')` → format `ZAE-YYYYMMDD-HEXHEX`. | `backend/controllers/customerOrders.js` |
| **AUD-025** | `page` + `limit` query params added to `getOrders`, `getProducts`, `getCustomers`. Response includes `totalCount`, `totalPages`, `page`. | `backend/controllers/orders.js`, `backend/controllers/products.js`, `backend/controllers/customers.js` |
| **AUD-026** | `POST /api/customer/orders/:id/cancel` cancels pending orders and restocks inventory. "Cancel Order" button shown for `status === 'pending'` in customer OrdersPage. | `backend/controllers/customerOrders.js`, `frontend/src/landing/pages/my-account/OrdersPage.jsx` |
| **AUD-027** | `changePassword` enforces regex: ≥8 chars, uppercase, lowercase, digit. Same check mirrored client-side. | `backend/controllers/profile.js`, `frontend/src/pages/admin/Profile.jsx` |
| **AUD-028** | `validatePriceSanity()` helper applied in `createProduct` and `updateProduct`: `basePrice > 0`, `discountPrice ≤ basePrice`, `costPrice ≤ basePrice`. | `backend/controllers/products.js` |
