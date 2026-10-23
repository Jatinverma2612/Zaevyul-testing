# Zaevyul Luxury Pashmina E-Commerce — Feature Documentation

This document provides a comprehensive, module-by-module breakdown of all features, capabilities, and system workflows implemented across the **Zaevyul Luxury Pashmina E-Commerce Platform**.

---

## Table of Contents
1. [Product & Variant Management Module](#1-product--variant-management-module)
2. [Category Management Module](#2-category-management-module)
3. [Discovery, Search & Filter Module](#3-discovery-search--filter-module)
4. [Cart & Save For Later Module](#4-cart--save-for-later-module)
5. [Checkout & Payment Recovery Module](#5-checkout--payment-recovery-module)
6. [Orders & Post-Purchase Management Module](#6-orders--post-purchase-management-module)
7. [Coupons & Promotions Module](#7-coupons--promotions-module)
8. [Customer Reviews & Social Proof Module](#8-customer-reviews--social-proof-module)
9. [SEO Engine & Metadata Module](#9-seo-engine--metadata-module)
10. [Pashmina Care & Heritage Guide Module](#10-pashmina-care--heritage-guide-module)
11. [Admin Dashboard & Analytics Module](#11-admin-dashboard--analytics-module)
12. [Customer Accounts & Authentication Module](#12-customer-accounts--authentication-module)

---

## 1. Product & Variant Management Module

### Color Variants with Color-Specific Sizes & Stock
- **Single Product Architecture**: Products maintain a single master record without creating duplicate parent/child products or complex linking systems.
- **Embedded Color Variants (`colors[]`)**:
  - Color Name (e.g. *Ivory*, *Midnight Black*, *Camel*).
  - Dedicated Color Main Image.
  - Dedicated Color Gallery Images (up to 8 detail photos per color).
- **Color-Specific Sizes & Stock (`colors[].sizes[]`)**:
  - Each color variant has its own table of size variants.
  - Configurable `size` label (e.g. *70 x 200 cm*, *100 x 200 cm*, *Standard*).
  - Specific `price` (₹), optional `discountPrice` (Sale Price ₹), and `quantity` (Stock Count) for each size under that specific color.

### Dynamic Storefront Product Detail Page (PDP)
- **Interactive Color Swatches**: Renders visual color swatches displaying color thumbnails and names.
- **Instant Photo Gallery Switcher**: Selecting a color swatch immediately switches the primary main image and replaces gallery photos with that color's specific image set.
- **Dynamic Size & Stock Adaptation**:
  - Selecting a color automatically updates the available size buttons, active price, and stock status to match that color.
  - Auto-selects the first in-stock size when switching colors.
- **Mobile Horizontal Snap Scroll**: Gallery transforms into a touch-friendly horizontal snap-scroll carousel on mobile screens while operating as a vertical gallery on desktop screens.
- **Right-Side Size & Dimensions Guide Drawer**: Sliding right-side drawer providing detailed dimensions, size comparison matrix, and measuring advice.
- **Craftsmanship & Origin Metadata**: Displays weave type (e.g. *Kani*, *Sozni*, *Diamond*), craft time (e.g. *120 Hrs*), material (e.g. *100% Cashmere Pashmina*), and Kashmir origin details.

---

## 2. Category Management Module

- **Category Organization**:
  - Category creation and editing with Name, Slug, Description, Feature Image, and Display Status (`active`/`inactive`).
  - Hierarchical linking to products.
- **Storefront Category Navigation**:
  - Dedicated URL routes (`/collection/:categorySlug`).
  - Automatic breadcrumbs across collection listings and product detail pages.
  - Dynamic category banners with category-specific descriptions.

---

## 3. Discovery, Search & Filter Module

### Predictive Live Search
- **Instant Navbar Suggestions**: As the user types into the search bar, a live dropdown presents matching products with high-resolution thumbnails, category names, prices, and direct links.
- **Direct Collection Matching**: Suggests relevant collection categories alongside product results.

### Multi-Criteria Catalog Filtering (`CollectionsPage.jsx`)
- **Combined Filtering Options**:
  - Category filter.
  - Gender Target filter (*Neutral/Unisex*, *Men*, *Women*).
  - Color filter.
  - Price Range slider.
  - Availability filter (*In Stock Only*).
- **Active Filter Chips**: Displays applied filters as dismissible chips with an instant **Clear All Filters** button.
- **Zero-Result Recovery**: When no products match a filter set, presents interactive 1-click recovery tags (*View Shawls*, *View Stoles*, *In-Stock Pashminas*, *Reset Filters*).
- **Dual Display Modes**: Toggle between Grid View (2-column/4-column) and List View.

---

## 4. Cart & Save For Later Module

### Cart Drawer (`CartDrawer.jsx`)
- **Variant Key Tracking**: Stores cart items with unique variant keys (`productId-color-size`).
- **Stock Limit Protection**: Prevents adding quantities exceeding current size/color stock with friendly warning notifications.
- **Low Stock Indicators**: Displays *Only X left* badges on low-inventory items in cart.
- **Live Subtotal & Free Shipping Progress**: Shows exact subtotal, estimated shipping, applied discounts, and free delivery thresholds.

### Save For Later
- **1-Click Item Moving**: Move items between active Cart and **Save for Later** list without deleting them.
- **Persistent Storage**: Saved items persist across sessions in `localStorage`.

### Gift Messaging & Custom Notes
- **Gift Note Input**: Option to write a custom gift message saved directly with the cart and order.

---

## 5. Checkout & Payment Recovery Module

### Visual Checkout Workflow (`CheckoutPage.jsx`)
- **Step 1 — Shipping & Address**:
  - Address selection from saved customer address cards or new address form with pincode auto-fill and validation.
- **Step 2 — Payment Method Selection**:
  - Credit/Debit Cards, UPI / Net Banking, and Cash on Delivery (COD).
- **Step 3 — Order Review**:
  - Itemized breakdown showing selected color, size, unit price, quantity, tax, shipping, and discounts.

### Automated Tax & Shipping Engine
- **Authoritative Backend Tax Service (`taxService.js`)**: Calculates GST/Tax based on shipping destination state/country rules.
- **Shipping Rules**: Free shipping over threshold or dynamic flat rate shipping.

### Payment Failure Recoverability
- **Immediate Recovery Modal**: If a payment fails or gets cancelled, a recovery overlay opens offering:
  - 1-click Retry with current method.
  - Instant switch to alternative payment method (e.g. UPI or COD).
  - Preserves cart items and checkout form inputs completely so customer doesn't re-enter data.

---

## 6. Orders & Post-Purchase Management Module

### Order Confirmation (`OrderConfirmationPage.jsx`)
- **Receipt Overview**: Order number (`ZAE-YYYYMMDD-HEX`), order date, items list with color/size, total summary, shipping address, and payment status.
- **Visual Delivery Timeline**: Progress stepper showing order state (*Placed* → *Processing* → *Packed* → *Shipped* → *Delivered*).

### Guest & Customer Order Tracking (`TrackOrderPage.jsx`)
- **Universal Order Tracking**: Search orders using Order Number + Email or Phone Number without requiring login.
- **Live Status & Tracking Numbers**: Displays carrier tracking numbers and shipment updates.

### Self-Service Returns & Cancellations
- **Return Request Drawer**: Customers can initiate returns for delivered items by selecting return reason (*Sizing Issue*, *Defective Item*, *Changed Mind*, *Not as Pictured*) and adding details.
- **Return Status Tracking**: Live tracking of return requests (*Pending*, *Approved*, *Rejected*, *Completed*).
- **Order Cancellation**: 1-click cancellation for orders still in *Pending* or *Processing* status.

---

## 7. Coupons & Promotions Module

### Admin Coupon Management (`Coupons.jsx`)
- **Coupon Types**: Percentage discount (e.g. `15% OFF`) or Fixed amount discount (e.g. `₹2,000 OFF`).
- **Validation Rules**:
  - Minimum order subtotal requirement.
  - Expiry date & time.
  - Maximum total usage limit & usage counter.
  - Active/Inactive status toggle.

### Storefront Application
- **Instant Validation**: Real-time coupon code entry in Cart Drawer and Checkout Page with immediate discount line item calculation.

---

## 8. Customer Reviews & Social Proof Module

### Strictly Verified Delivered Buyer Reviews (`createProductReview`)
- **Delivered Order Restriction**: **Only users who have actually purchased the product AND had it successfully delivered (`status: "delivered"`) can post a review.**
- **Backend Verification**: Automatically checks matching customer email against delivered order line items (`items.product`). Unverified or non-delivered attempts are blocked with HTTP 403 response (`"Only verified customers with a delivered order for this product can leave a review."`).

### PDP Review Breakdown (`ProductDetailPage.jsx`)
- **Rating Summary**: Average star rating (e.g. `4.9 / 5.0`), total review count, and 5-star to 1-star distribution graph.
- **Fit Feedback Matrix**: Customer fit feedback breakdown (*True to Size*, *Runs Small*, *Runs Large*).
- **Verified Buyer Badging**: Published reviews display green **Verified Buyer** badges.

---

## 9. SEO Engine & Metadata Module

### Page & Product Metadata Management
- **SEO Title & Meta Description**: Customizable meta title (50–60 chars) and meta description (150–160 chars) per product and page.
- **URL Handle / Slug**: Customizable search-engine friendly URL handles.
- **Google Search Preview**: Real-time snippet preview card in Admin Product Form (`zaevyul.com/products/slug`).
- **Social Tags**: OpenGraph (`og:title`, `og:image`, `og:description`) and Twitter Card tags automatically generated on route changes.
- **Semantic HTML**: Strict `<h1>` hierarchy, ARIA accessibility attributes, and schema.org structured data compatibility.

---

## 10. Pashmina Care & Heritage Guide Module

- **Interactive Care Drawer / Section**:
  - Embedded care instructions on PDP and order confirmation.
  - Washing & Dry Cleaning guidelines (*Gentle hand wash in cold water with mild cashmere shampoo*).
  - Drying & Ironing advice (*Flat dry in shade, low steam iron*).
  - Storage & Preservation tips (*Cedar wood blocks, breathable cotton bags, avoiding plastic*).
  - De-pilling guidance.

---

## 11. Admin Dashboard & Analytics Module

### Dashboard Overview (`Dashboard.jsx`)
- **Key Metrics Cards**: Total Revenue, Total Orders, Average Order Value (AOV), Active Customers, Low Stock Alerts.
- **Interactive Revenue Charts**: Weekly/Monthly sales trend graphs.
- **Recent Orders Table**: Quick order processing, status updates, and customer details.

### Sales & Inventory Reports (`Reports.jsx`)
- **Category Sales Distribution**: Sales breakdown by product category.
- **Top Performing Products**: Best-selling items list.
- **Low Stock Report**: Automatic stock alerts highlighting items below threshold.

### Newsletter Management (`Newsletter.jsx`)
- **Subscriber List**: Email newsletter sign-up management and CSV export.

---

## 12. Customer Accounts & Authentication Module

- **Customer Login & Signup (`CustomerLoginPage.jsx`)**: Email & password authentication with JWT token session handling.
- **Saved Address Book (`customerAddresses.js`)**: Manage multiple shipping addresses with default address selection.
- **Wishlist Sync (`customerFavorites.js`)**: Synchronize customer favorites across devices.
- **My Account Portal (`MyAccountPage.jsx`)**: View order history, active return requests, personal profile details, and address book.

---

## Summary of Core Technologies

- **Frontend**: React 18, React Router v6, TailwindCSS, Lucide Icons, Vite.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose ODM).
- **Security & Reliability**: JWT Authentication, Crypto order number generation, Tax calculation service, Input validation.
