import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import {
  Check,
  Search,
  User,
  Heart,
  ShoppingBag,
  MapPin,
  Truck,
  CreditCard,
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  Download,
} from "lucide-react";
import { useCurrency } from "../../context/CurrencyContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import Logo from "../../components/Logo";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { customerApi } from "../../lib/customerApi";
import { api } from "../../lib/api";
import SiteFooter from "../components/SiteFooter";

export default function OrderConfirmationPage({ order: propOrder }) {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { formatPrice, currencyCode } = useCurrency();
  const { user, isAuthenticated } = useCustomerAuth();
  const { settings: contextSettings } = useCart();

  const [companySettings, setCompanySettings] = useState(contextSettings || null);

  useEffect(() => {
    if (contextSettings) {
      setCompanySettings(contextSettings);
    } else {
      let active = true;
      api.settings
        .getPublicLive()
        .then((data) => {
          if (active && data) setCompanySettings(data);
        })
        .catch((err) => {
          console.warn("Could not fetch company settings for confirmation header:", err);
        });
      return () => {
        active = false;
      };
    }
  }, [contextSettings]);

  const companyName = (
    companySettings?.storeName ||
    contextSettings?.storeName ||
    "Zaevyul"
  )
    .trim()
    .toUpperCase();

  const toast = useToast();
  const [order, setOrder] = useState(propOrder || location.state?.order || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchOrderInput, setSearchOrderInput] = useState("");
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    const targetOrder = order || location.state?.order || propOrder;
    if (!targetOrder?._id && !targetOrder?.id) return;
    setDownloadingInvoice(true);
    try {
      const orderId = targetOrder._id || targetOrder.id;
      const invName = targetOrder.invoice?.invoiceNumber || `invoice-${targetOrder.orderNumber || 'order'}`;
      await customerApi.orders.downloadInvoice(orderId, `${invName}.pdf`);
    } catch (err) {
      console.error("Invoice download error:", err);
      if (toast) toast(err.message || "Could not download invoice. Please try again.", "error");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Determine if this is explicit demo mode (e.g., ?demo=true in URL)
  const isDemo = new URLSearchParams(location.search).get("demo") === "true";

  useEffect(() => {
    // If order was passed via props or router state, use it directly
    if (propOrder) {
      setOrder(propOrder);
      return;
    }
    if (location.state?.order) {
      setOrder(location.state.order);
      return;
    }

    const orderIdToFetch = params.orderId;

    if (orderIdToFetch) {
      const fetchOrder = async () => {
        setLoading(true);
        setError("");
        try {
          const res = await customerApi.orders.getById(orderIdToFetch);
          if (res && (res.order || res)) {
            setOrder(res.order || res);
          } else {
            setError("Order details could not be found.");
          }
        } catch (err) {
          console.warn("Could not fetch order by ID:", err);
          setError("Order not found or invalid order number.");
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    } else if (isAuthenticated && !isDemo) {
      // If no ID in URL but user is logged in, attempt to fetch their most recent order
      const fetchLatestCustomerOrder = async () => {
        setLoading(true);
        try {
          const res = await customerApi.orders.getAll();
          const list = res.orders || res || [];
          if (list.length > 0) {
            setOrder(list[0]);
          }
        } catch (err) {
          console.warn("Could not fetch customer latest order:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchLatestCustomerOrder();
    }
  }, [params.orderId, propOrder, location.state, isAuthenticated, isDemo]);

  // Handle manual order search input
  const handleSearchOrder = async (e) => {
    e.preventDefault();
    if (!searchOrderInput.trim()) return;
    setLoading(true);
    setError("");
    try {
      const query = searchOrderInput.trim();
      const res = await customerApi.orders.getById(query);
      if (res && (res.order || res)) {
        setOrder(res.order || res);
        navigate(`/order-confirmation/${res.order?.orderNumber || res.order?._id || query}`, {
          replace: true,
        });
      } else {
        setError(`No order found matching "${query}". Please check your order number.`);
      }
    } catch (err) {
      setError(err.message || `No order found matching "${searchOrderInput.trim()}".`);
    } finally {
      setLoading(false);
    }
  };

  // Demo fallback values strictly when explicitly requested via ?demo=true
  const demoOrder = {
    orderNumber: "ZP-2505147",
    customerEmail: "ananya.sharma@example.com",
    shippingAddress: {
      fullName: "Ananya Sharma",
      addressLine1: "12 Maple Drive, Green Park",
      city: "New Delhi",
      zipCode: "110016",
      country: "India",
      phone: "+91 98765 43210",
    },
    items: [
      {
        _id: "item-1",
        name: "Heritage Weave Pashmina",
        color: "Sand Beige",
        qty: 1,
        price: 199.0,
        image:
          "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=300&auto=format&fit=crop",
      },
      {
        _id: "item-2",
        name: "Sozni Embroidery Stole",
        color: "Ivory",
        qty: 1,
        price: 129.0,
        image:
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=300&auto=format&fit=crop",
      },
    ],
    subtotal: 328.0,
    shipping: 0,
    tax: 28.42,
    total: 356.42,
    shippingMethod: "standard",
    paymentMethod: "card",
  };

  const activeOrder = order || (isDemo ? demoOrder : null);

  // Helper to format payment method label
  const renderPaymentMethodLabel = (pm) => {
    if (!pm) return "Online Payment";
    const low = pm.toLowerCase();
    if (low.includes("cod") || low.includes("cash")) return "Cash on Delivery (COD)";
    if (low.includes("razorpay")) return "Razorpay Secure Payment";
    if (low.includes("stripe")) return "Stripe Online Payment";
    if (low.includes("paypal")) return "PayPal Express";
    if (low.includes("card") || low.includes("visa") || low.includes("mastercard")) {
      return (
        <span className="flex items-center gap-2">
          <span className="bg-[#1B357B] text-white text-[9px] font-bold italic px-1.5 py-0.5 rounded-[2px] tracking-widest">
            VISA
          </span>
          <span>Ending with 4242</span>
        </span>
      );
    }
    return pm.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1916] font-sans flex flex-col justify-between selection:bg-[#C5A880]/20">
      {/* ── Top Announcement Banner ────────────────────────────────────────────── */}
      <div className="bg-[#F7F4EF] border-b border-[#ECE7E1] py-2 px-4 text-center">
        <p className="text-[10.5px] font-medium tracking-[0.22em] text-[#6B6560] uppercase flex items-center justify-center gap-2">
          <span className="text-[#C5A880] text-[12px]">✦</span>
          COMPLIMENTARY WORLDWIDE SHIPPING ON ORDERS ABOVE $250
        </p>
      </div>

      {/* ── Header Navigation ─────────────────────────────────────────────────── */}
      <header className="bg-[#FAF8F5] border-b border-[#ECE7E1]/80 px-4 sm:px-12 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Continue Shopping Link */}
        <Link
          to="/collections"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11px] font-semibold tracking-[0.14em] sm:tracking-[0.16em] text-[#1C1916] hover:text-[#B58A5B] uppercase transition-colors"
        >
          <ArrowLeft size={14} className="stroke-[2.2] shrink-0" />
          <span className="hidden sm:inline">CONTINUE SHOPPING</span>
          <span className="sm:hidden">SHOPPING</span>
        </Link>

        {/* Center: Brand Logo */}
        <Link to="/" className="text-center group py-1 flex items-center justify-center cursor-pointer">
          <Logo variant="header" />
        </Link>

        {/* Right: Header Icons */}
        <div className="flex items-center gap-2.5 sm:gap-6 text-[#1C1916]">
          <button
            onClick={() => navigate("/collections")}
            aria-label="Search"
            className="hover:text-[#B58A5B] transition-colors cursor-pointer"
          >
            <Search size={17} strokeWidth={1.5} />
          </button>
          <Link
            to="/my-account"
            aria-label="My Account"
            className="hover:text-[#B58A5B] transition-colors"
          >
            <User size={17} strokeWidth={1.5} />
          </Link>
          <Link
            to="/my-account/favorites"
            aria-label="Wishlist"
            className="hover:text-[#B58A5B] transition-colors hidden sm:block"
          >
            <Heart size={17} strokeWidth={1.5} />
          </Link>
          <Link
            to="/cart"
            aria-label="Cart"
            className="flex items-center gap-1 hover:text-[#B58A5B] transition-colors"
          >
            <ShoppingBag size={17} strokeWidth={1.5} />
            <span className="text-[10.5px] font-sans font-light text-[#6B6560]">
              (0)
            </span>
          </Link>
        </div>
      </header>

      {/* ── Main Confirmation Body ────────────────────────────────────────────── */}
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center w-full flex-1">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 size={36} className="text-[#C5A880] animate-spin mb-4" />
            <p className="font-serif text-[18px] text-[#1C1916]">
              Fetching your order details...
            </p>
          </div>
        ) : activeOrder ? (
          <>
            {/* 1. Circle Checkmark Icon */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border border-[#C5A880]/70 bg-white flex items-center justify-center mx-auto mb-6 shadow-xs">
              <Check size={28} className="text-[#C5A880] stroke-[1.75]" />
            </div>

            {/* 2. Main Title */}
            <h1 className="font-serif text-[36px] sm:text-[46px] font-normal text-[#1C1916] tracking-tight leading-tight mb-2">
              Thank You
            </h1>

            {/* 3. Subtitle */}
            <p className="font-sans text-[14px] sm:text-[15px] font-light text-[#5A524C] mb-6">
              Your order has been placed successfully.
            </p>

            {/* 4. Decorative Diamond Divider */}
            <div className="flex items-center justify-center gap-3 w-36 mx-auto mb-8 text-[#C5A880]/80">
              <div className="h-[1px] bg-[#E6DED4] flex-1"></div>
              <span className="text-[10px] tracking-widest text-[#C5A880]">❖</span>
              <div className="h-[1px] bg-[#E6DED4] flex-1"></div>
            </div>

            {/* 5. ORDER NUMBER */}
            <div className="mb-4">
              <span className="block font-sans text-[10px] font-semibold tracking-[0.24em] text-[#8A857E] uppercase mb-1">
                ORDER NUMBER
              </span>
              <span className="font-serif text-[24px] sm:text-[28px] font-normal text-[#1C1916] tracking-wide">
                #{activeOrder.orderNumber || (activeOrder._id ? activeOrder._id.slice(-8).toUpperCase() : "ZP-2505147")}
              </span>
            </div>

            {/* 6. Email Confirmation Note */}
            <p className="font-sans text-[13.5px] font-light text-[#5A524C] mb-12">
              A confirmation email has been sent to{" "}
              <strong className="font-semibold text-[#1C1916]">
                {activeOrder.customerEmail || activeOrder.email || activeOrder.customer?.email || user?.email || "ananya.sharma@example.com"}
              </strong>
            </p>

            {/* 7. ORDER SUMMARY Container */}
            <div className="max-w-[620px] mx-auto text-center mb-8">
              <h2 className="font-sans text-[10.5px] font-semibold tracking-[0.24em] text-[#6B6560] uppercase mb-1">
                ORDER SUMMARY
              </h2>
              <div className="w-6 h-[1.5px] bg-[#C5A880] mx-auto mb-6"></div>

              {/* White Order Card */}
              <div className="bg-white border border-[#E6DED4] rounded-[4px] p-4 sm:p-8 shadow-xs text-left">
                {/* Items List */}
                <div className="divide-y divide-[#F2ECE4]">
                  {activeOrder.items && activeOrder.items.length > 0 ? (
                    activeOrder.items.map((item, idx) => {
                      const itemName = item.name || item.product?.name || "Pashmina Item";
                      const itemVariant =
                        item.color && item.size
                          ? `${item.color} / ${item.size}`
                          : item.color || item.size || "Standard";
                      const itemQty = item.qty || item.quantity || 1;
                      const itemPrice = item.price || item.product?.discountPrice || item.product?.basePrice || 0;
                      const itemImg =
                        item.image ||
                        item.product?.mainImage ||
                        (item.product?.images && item.product.images[0]) ||
                        "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=300&auto=format&fit=crop";

                      return (
                        <div key={item._id || idx} className="py-4 first:pt-0 flex items-center gap-4">
                          <img
                            src={itemImg}
                            alt={itemName}
                            className="w-16 h-16 sm:w-18 sm:h-18 object-cover rounded-[3px] border border-[#ECE7E1] bg-[#FAF8F5] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-[15px] font-medium text-[#1C1916] truncate">
                              {itemName}
                            </h4>
                            <p className="font-sans text-[12px] font-light text-[#8A857E] mt-0.5">
                              {itemVariant} &nbsp;·&nbsp; Qty: {itemQty}
                            </p>
                          </div>
                          <div className="font-sans text-[13.5px] font-medium text-[#1C1916] text-right shrink-0">
                            {formatPrice(itemPrice * itemQty)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="py-4 text-[13px] text-[#8A857E] italic">No items listed.</p>
                  )}
                </div>

                {/* Calculations Breakdown */}
                <div className="pt-5 mt-2 border-t border-[#F2ECE4] space-y-2.5 font-sans text-[13px] text-[#6B6560] font-light">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[#1C1916] font-medium">
                      {formatPrice(activeOrder.subtotal ?? activeOrder.total ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shipping</span>
                    <span className="text-[#2E7D32] font-semibold text-[10.5px] tracking-wider uppercase">
                      {!activeOrder.shipping || activeOrder.shipping === 0
                        ? "FREE"
                        : formatPrice(activeOrder.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span className="text-[#1C1916]">
                      {formatPrice(activeOrder.tax ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Total Row */}
                <div className="pt-5 mt-4 border-t border-[#E6DED4] flex items-baseline justify-between">
                  <span className="font-serif text-[20px] font-normal text-[#1C1916]">
                    Total
                  </span>
                  <div className="text-right flex items-baseline">
                    <span className="font-sans text-[10px] font-medium text-[#8A857E] uppercase mr-2">
                      {currencyCode}
                    </span>
                    <span className="font-serif text-[24px] font-normal text-[#1C1916]">
                      {formatPrice(activeOrder.total ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Three Details Cards Grid */}
            <div className="max-w-[620px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-8 text-left">
              {/* Card 1: Shipping Address */}
              <div className="bg-white border border-[#E6DED4] p-5 rounded-[4px] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-[#6B6560]">
                    <MapPin size={16} strokeWidth={1.5} className="shrink-0" />
                    <span className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase">
                      SHIPPING ADDRESS
                    </span>
                  </div>
                  <p className="font-medium text-[12px] text-[#1C1916] mb-1">
                    {activeOrder.shippingAddress?.fullName || activeOrder.customerName || user?.name || "Customer"}
                  </p>
                  <p className="text-[11.5px] text-[#6B6560] font-light leading-snug">
                    {activeOrder.shippingAddress?.addressLine1 || activeOrder.shippingAddress?.address || "Address"}
                    {activeOrder.shippingAddress?.addressLine2 ? `, ${activeOrder.shippingAddress.addressLine2}` : ""}
                  </p>
                  <p className="text-[11.5px] text-[#6B6560] font-light leading-snug">
                    {activeOrder.shippingAddress?.city || ""}
                    {activeOrder.shippingAddress?.zipCode || activeOrder.shippingAddress?.postalCode ? `, ${activeOrder.shippingAddress.zipCode || activeOrder.shippingAddress.postalCode}` : ""}
                    {activeOrder.shippingAddress?.country ? `, ${activeOrder.shippingAddress.country}` : ""}
                  </p>
                </div>
                {(activeOrder.shippingAddress?.phone || activeOrder.phone || user?.phone) && (
                  <p className="text-[11.5px] text-[#8A857E] font-light mt-2 pt-2 border-t border-[#F2ECE4]">
                    {activeOrder.shippingAddress?.phone || activeOrder.phone || user?.phone}
                  </p>
                )}
              </div>

              {/* Card 2: Shipping Method */}
              <div className="bg-white border border-[#E6DED4] p-5 rounded-[4px] shadow-xs">
                <div className="flex items-center gap-2 mb-3 text-[#6B6560]">
                  <Truck size={16} strokeWidth={1.5} className="shrink-0" />
                  <span className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase">
                    SHIPPING METHOD
                  </span>
                </div>
                <p className="font-medium text-[12px] text-[#1C1916] mb-1">
                  {activeOrder.shippingMethod === "express" ? "Express Delivery" : "Standard Shipping"}
                </p>
                <p className="text-[11.5px] text-[#6B6560] font-light leading-relaxed">
                  {activeOrder.shippingMethod === "express"
                    ? "Estimated delivery: 2–3 business days"
                    : "Estimated delivery: 5–7 business days"}
                </p>
              </div>

              {/* Card 3: Payment Method */}
              <div className="bg-white border border-[#E6DED4] p-5 rounded-[4px] shadow-xs">
                <div className="flex items-center gap-2 mb-3 text-[#6B6560]">
                  <CreditCard size={16} strokeWidth={1.5} className="shrink-0" />
                  <span className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase">
                    PAYMENT METHOD
                  </span>
                </div>
                <div className="mt-2 text-[11.5px] text-[#6B6560] font-light">
                  {renderPaymentMethodLabel(activeOrder.paymentMethod)}
                </div>
              </div>
            </div>

            {/* 9. Shipping Updates Banner */}
            <div className="max-w-[620px] mx-auto bg-[#FBF9F5] border border-[#F0ECE6] rounded-[4px] p-4 sm:p-5 flex items-center gap-4 text-left mb-8 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-white border border-[#E6DED4] flex items-center justify-center shrink-0 text-[#1C1916]">
                <Mail size={18} strokeWidth={1.5} />
              </div>
              <p className="font-sans text-[12px] font-light text-[#5A524C] leading-relaxed">
                We will send you shipping updates and tracking details once your order is on the way.
              </p>
            </div>

            {/* Post-Purchase Pashmina Care & Authenticity Section */}
            <div className="max-w-[620px] mx-auto bg-[#F5EFE7]/80 border border-[#E6DED4] p-6 text-left rounded-[4px] mb-10 shadow-xs space-y-4">
              <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B58A5B] block">
                Artisan Heritage & Preservation
              </span>
              <h3 className="font-serif text-[20px] font-light text-[#1C1916]">
                Pashmina Care & Certificate of Authenticity
              </h3>
              <p className="font-sans text-[12.5px] text-[#6B6560] font-light leading-relaxed">
                Your order is handwoven in Kashmir and includes an official Certificate of Authenticity. To preserve its softness across generations:
              </p>
              <ul className="list-disc pl-5 font-sans text-[12px] text-[#6B6560] font-light space-y-1">
                <li>Professional dry cleaning recommended.</li>
                <li>Store loosely folded in cotton or muslin wrapping with cedar protection.</li>
                <li>Avoid direct plastic wrap and high-heat iron contact.</li>
              </ul>
            </div>

            {/* 10. Action Buttons */}
            <div className="max-w-[620px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
              <button
                type="button"
                disabled={downloadingInvoice}
                onClick={handleDownloadInvoice}
                className="w-full sm:w-auto bg-[#B58A5B] hover:bg-[#9E7347] text-white py-4 px-8 text-[11px] font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-all cursor-pointer text-center shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {downloadingInvoice ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> DOWNLOADING...
                  </>
                ) : (
                  <>
                    <Download size={14} /> DOWNLOAD INVOICE
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  if (activeOrder._id) {
                    navigate(`/my-account/orders/${activeOrder._id}`);
                  } else {
                    navigate("/my-account/orders");
                  }
                }}
                className="w-full sm:w-auto bg-[#1C1916] hover:bg-[#2C2825] text-white py-4 px-8 text-[11px] font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-all cursor-pointer text-center shadow-xs"
              >
                VIEW ORDER
              </button>
            </div>
            <div className="text-center mb-12">
              <Link
                to="/collections"
                className="text-[11px] font-semibold tracking-[0.18em] text-[#1C1916] hover:text-[#B58A5B] uppercase border-b border-[#1C1916] hover:border-[#B58A5B] pb-0.5 transition-colors cursor-pointer"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </>
        ) : (
          /* ── Order Lookup / Track Form when no order parameter is specified ───── */
          <div className="max-w-[540px] mx-auto py-12 px-6 bg-white border border-[#E6DED4] rounded-[4px] shadow-xs text-center">
            <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#E6DED4] flex items-center justify-center mx-auto mb-4 text-[#C5A880]">
              <Package size={24} strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-[28px] font-normal text-[#1C1916] mb-2">
              Track Your Order
            </h2>
            <p className="font-sans text-[13px] font-light text-[#6B6560] mb-6 leading-relaxed">
              Enter your Order Number (e.g. <span className="font-medium text-[#1C1916]">ZAE-20260817-A9F3</span>) to view order status, tracking, and details.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#F8D7DA] text-[#C94C4C] text-[12px] font-sans rounded-[2px] flex items-center gap-2 text-left">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSearchOrder} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={searchOrderInput}
                onChange={(e) => setSearchOrderInput(e.target.value)}
                placeholder="Order Number or Order ID..."
                className="flex-1 bg-[#FAF8F5] border border-[#E6DED4] px-4 py-3 text-[13px] text-[#1C1916] outline-none placeholder:text-[#8A857E] rounded-[2px]"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1C1916] hover:bg-[#2C2825] text-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] rounded-[2px] transition-colors cursor-pointer shrink-0"
              >
                {loading ? "SEARCHING..." : "LOOKUP"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#F2ECE4] flex justify-center gap-6 text-[12px]">
              <Link
                to="/collections"
                className="text-[#1C1916] font-medium underline hover:text-[#B58A5B] transition-colors uppercase text-[11px] tracking-wider"
              >
                BROWSE COLLECTIONS
              </Link>
              <Link
                to="/order-confirmation?demo=true"
                className="text-[#8A857E] hover:text-[#1C1916] transition-colors uppercase text-[11px] tracking-wider"
              >
                VIEW DEMO DESIGN
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
}
