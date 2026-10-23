import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  HelpCircle,
  Lock,
  MoreVertical,
  Plus,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Tag,
  ChevronRight,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useToast } from "../../context/ToastContext";
import { customerApi } from "../../lib/customerApi";
import { api } from "../../lib/api";
import CouponPickerModal from "../../components/CouponPickerModal";
import SiteFooter from "../components/SiteFooter";
import OrderConfirmationPage from "./OrderConfirmationPage";
import Logo from "../../components/Logo";

const COUNTRIES = [
  "United States",
  "India",
  "Australia",
  "United Arab Emirates",
  "United Kingdom",
  "Germany",
  "France",
  "Canada",
  "Italy",
  "Spain",
  "Netherlands",
  "Switzerland",
  "Japan",
  "Singapore",
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    cart,
    totals,
    clearCart,
    giftNote,
    settings: contextSettings,
    appliedCoupon,
    setAppliedCoupon,
  } = useCart();
  const { formatPrice, currencyCode } = useCurrency();
  const { user, isAuthenticated } = useCustomerAuth();

  const [companySettings, setCompanySettings] = useState(
    contextSettings || null,
  );

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
          console.warn(
            "Could not fetch company settings for checkout header:",
            err,
          );
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

  // Step and Accordion states
  const [activeStep, setActiveStep] = useState(1); // 1 = Shipping, 2 = Payment, 3 = Review
  const [expandedAccordion, setExpandedAccordion] = useState({
    shipping: true,
    payment: false,
    review: false,
  });

  // Saved addresses vs new address form
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressMenuOpen, setAddressMenuOpen] = useState(null);

  // New Address / Contact Form state
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    saveAddressNextTime: true,
  });

  // Shipping Method state
  const [shippingMethod, setShippingMethod] = useState("standard"); // 'standard' | 'express'

  // Payment Method state
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // 'razorpay' | 'card' | 'cod' | 'paypal'
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvc: "",
  });

  // Promo Code state
  const [promoCode, setPromoCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Coupon picker modal state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsLoaded, setCouponsLoaded] = useState(false);

  const openCouponModal = async () => {
    setShowCouponModal(true);
    if (couponsLoaded) return;
    setCouponsLoading(true);
    try {
      const data = await api.coupons.listPublic();
      setAvailableCoupons(data || []);
      setCouponsLoaded(true);
    } catch (err) {
      toast("Could not load coupons. Please try again.", "error");
    } finally {
      setCouponsLoading(false);
    }
  };

  const handlePickCoupon = async (code) => {
    setShowCouponModal(false);
    setPromoCode("");
    setCouponError("");
    setCouponLoading(true);
    try {
      const coupon = await api.coupons.validate(code, totals.subtotal);
      setAppliedCoupon(coupon);
      const label =
        coupon.discountType === "percentage"
          ? `${coupon.discountValue}% off`
          : `₹${coupon.discountValue} off`;
      toast(`Coupon "${coupon.code}" applied — ${label}`, "success");
    } catch (err) {
      setCouponError(err.message || "Invalid or expired coupon code.");
    } finally {
      setCouponLoading(false);
    }
  };

  // Order Placement state
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Prefill email and fetch saved addresses on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        fullName: user.name || prev.fullName,
        phone: user.phone || prev.phone,
      }));

      // Fetch saved addresses from backend or user profile
      const fetchAddresses = async () => {
        setLoadingAddresses(true);
        try {
          const res = await customerApi.addresses.getAll();
          const list = res.addresses || res || [];
          setSavedAddresses(list);
          if (list.length > 0) {
            const defaultAddr = list.find((a) => a.isDefault) || list[0];
            setSelectedAddressId(defaultAddr._id || defaultAddr.id);
            setUseNewAddress(false);
          } else {
            setUseNewAddress(true);
          }
        } catch (err) {
          console.warn(
            "Could not load addresses from backend, checking user profile:",
            err,
          );
          if (user.addresses && user.addresses.length > 0) {
            setSavedAddresses(user.addresses);
            const defaultAddr =
              user.addresses.find((a) => a.isDefault) || user.addresses[0];
            setSelectedAddressId(defaultAddr._id || defaultAddr.id);
            setUseNewAddress(false);
          } else {
            setUseNewAddress(true);
          }
        } finally {
          setLoadingAddresses(false);
        }
      };

      fetchAddresses();
    } else {
      setUseNewAddress(true);
    }
  }, [isAuthenticated, user]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCardInputChange = (field, value) => {
    setCardForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    const code = promoCode.trim();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    try {
      const coupon = await api.coupons.validate(code, totals.subtotal);
      setAppliedCoupon(coupon);
      setPromoCode("");
      const label =
        coupon.discountType === "percentage"
          ? `${coupon.discountValue}% off`
          : `₹${coupon.discountValue} off`;
      toast(`Coupon "${coupon.code}" applied — ${label}`, "success");
    } catch (err) {
      setCouponError(err.message || "Invalid or expired coupon code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const toggleAccordion = (section) => {
    setExpandedAccordion((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleContinueToPayment = (e) => {
    if (e) e.preventDefault();
    if (
      useNewAddress &&
      (!formData.email ||
        !formData.fullName ||
        !formData.address ||
        !formData.city)
    ) {
      toast(
        "Please fill in all required contact & delivery address fields.",
        "warning",
      );
      return;
    }
    setActiveStep(2);
    setExpandedAccordion({ shipping: false, payment: true, review: false });
  };

  const handleContinueToReview = (e) => {
    if (e) e.preventDefault();
    if (
      paymentMethod === "card" &&
      (!cardForm.cardNumber ||
        !cardForm.cardName ||
        !cardForm.expiry ||
        !cardForm.cvc)
    ) {
      toast("Please complete your card payment details.", "warning");
      return;
    }
    setActiveStep(3);
    setExpandedAccordion({ shipping: false, payment: false, review: true });
  };

  const [paymentError, setPaymentError] = useState(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast("Your cart is empty.", "error");
      return;
    }

    setPlacingOrder(true);
    setPaymentError(null);
    try {
      // Resolve selected shipping address
      let shippingAddressObj = {};
      if (useNewAddress || savedAddresses.length === 0) {
        shippingAddressObj = {
          fullName: formData.fullName,
          phone: formData.phone,
          addressLine1: formData.address,
          addressLine2: formData.apartment,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zip,
          country: formData.country,
        };
      } else {
        const selected = savedAddresses.find(
          (a) => (a._id || a.id) === selectedAddressId,
        );
        if (selected) {
          shippingAddressObj = {
            fullName: selected.fullName || selected.name || formData.fullName,
            phone: selected.phone || formData.phone,
            addressLine1: selected.addressLine1 || selected.address || "",
            addressLine2: selected.addressLine2 || selected.apartment || "",
            city: selected.city || "",
            state: selected.state || "",
            zipCode:
              selected.zipCode || selected.postalCode || selected.zip || "",
            country: selected.country || "India",
          };
        }
      }

      const orderPayload = {
        items: cart.map((item) => ({
          product: item.id || item._id,
          name: item.name,
          qty: item.quantity,
          price: item.price,
          size: item.size || "",
          color: item.color || "",
          image: item.image || item.img,
        })),
        shippingAddress: shippingAddressObj,
        paymentMethod: paymentMethod,
        shippingMethod: shippingMethod,
        customerEmail: formData.email,
        couponCode: appliedCoupon?.code || "",
        notes: giftNote || "",
      };

      // ── Razorpay Online Payment Flow ──────────────────────────────────────
      if (
        paymentMethod === "razorpay" ||
        paymentMethod === "card" ||
        paymentMethod === "upi" ||
        paymentMethod === "gpay"
      ) {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          toast(
            "Failed to load Razorpay SDK. Please check your internet connection.",
            "error",
          );
          setPlacingOrder(false);
          return;
        }

        const razorpayData =
          await customerApi.orders.createRazorpayOrder(orderPayload);

        const options = {
          key: razorpayData.keyId,
          amount: razorpayData.amount,
          currency: razorpayData.currency || "INR",
          name: companyName || "Zaevyul",
          description: "Artisanal Pashmina Purchase",
          image: "/storefront/artisan.png",
          order_id: razorpayData.razorpayOrderId,
          handler: async (response) => {
            try {
              setPlacingOrder(true);
              const verifyRes = await customerApi.orders.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderPayload,
              });
              clearCart();
              setOrderSuccess(verifyRes.order || verifyRes);
              toast(
                "Payment successful! Your order has been placed.",
                "success",
              );
            } catch (vErr) {
              console.error("Razorpay verification error:", vErr);
              const errMsg = vErr.message || "Payment verification failed.";
              setPaymentError(errMsg);
              toast(errMsg, "error");
            } finally {
              setPlacingOrder(false);
            }
          },
          prefill: {
            name: shippingAddressObj.fullName || user?.name || "",
            email: formData.email || user?.email || "",
            contact: shippingAddressObj.phone || user?.phone || "",
          },
          theme: {
            color: "#1C1916",
          },
          modal: {
            ondismiss: () => {
              setPlacingOrder(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response) => {
          const msg =
            response.error?.description || "Payment failed. Please try again.";
          setPaymentError(msg);
          toast(msg, "error");
          setPlacingOrder(false);
        });
        rzp.open();
        return;
      }

      // Standard / Cash on Delivery Flow
      const res = await customerApi.orders.place(orderPayload);
      clearCart();
      setOrderSuccess(res.order || res);
      toast(
        "Order placed successfully! Thank you for your purchase.",
        "success",
      );
    } catch (err) {
      console.error("Order placement failed:", err);
      const errMsg =
        err.message ||
        "Payment couldn't be completed. Your order has not been charged. Please try again or choose another payment method.";
      setPaymentError(errMsg);
      toast(errMsg, "error");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Express Shipping fee addition calculation
  const extraShippingCost = shippingMethod === "express" ? 1500 : 0; // ₹1500 or $15 equivalent
  const displayShippingCost =
    shippingMethod === "express" ? formatPrice(1500) : "FREE";

  // Calculate final total
  const finalSubtotal = totals.subtotal;
  const finalTax = totals.tax || 0;
  const finalTotal = totals.total + extraShippingCost;

  if (orderSuccess) {
    return <OrderConfirmationPage order={orderSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans text-[#1C1916] flex flex-col justify-between">
      <div>
        {/* Header Navbar */}
        <header className="bg-[#FAF8F5] border-b border-[#E6DED4]/80 px-4 sm:px-12 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11px] font-sans font-medium uppercase tracking-[0.14em] sm:tracking-[0.16em] text-[#1C1916]/70 hover:text-[#1C1916] transition-colors"
          >
            <ArrowLeft size={14} className="shrink-0" />
            <span className="hidden sm:inline">CONTINUE SHOPPING</span>
            <span className="sm:hidden">SHOPPING</span>
          </Link>

          <Link
            to="/"
            className="flex items-center justify-center text-center cursor-pointer"
          >
            <Logo variant="header" />
          </Link>

          <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[10.5px] font-sans font-medium uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#1C1916]/80">
            <Lock size={13} className="text-[#1C1916]/70 shrink-0" />
            <span className="hidden sm:inline">SECURE CHECKOUT</span>
            <span className="sm:hidden">SECURE</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-[1440px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-10 lg:px-14 pt-6 sm:pt-8 pb-16 sm:pb-20">
          {/* Checkout Title & Stepper Navigation */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="font-serif text-[28px] sm:text-[42px] font-normal text-[#1C1916] mb-4 sm:mb-6">
              Checkout
            </h1>

            {/* Stepper Tabs */}
            <div className="flex justify-center items-center gap-3 xs:gap-6 sm:gap-14 font-sans text-[10.5px] sm:text-[11.5px] font-light text-[#8A857E]">
              <button
                onClick={() => {
                  setActiveStep(1);
                  setExpandedAccordion({
                    shipping: true,
                    payment: false,
                    review: false,
                  });
                }}
                className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                  activeStep === 1
                    ? "border-[#1C1916] text-[#1C1916] font-medium"
                    : "border-transparent text-[#8A857E] hover:text-[#1C1916]"
                }`}
              >
                <span>01</span> Shipping
              </button>
              <button
                onClick={() => {
                  setActiveStep(2);
                  setExpandedAccordion({
                    shipping: false,
                    payment: true,
                    review: false,
                  });
                }}
                className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                  activeStep === 2
                    ? "border-[#1C1916] text-[#1C1916] font-medium"
                    : "border-transparent text-[#8A857E] hover:text-[#1C1916]"
                }`}
              >
                <span>02</span> Payment
              </button>
              <button
                onClick={() => {
                  setActiveStep(3);
                  setExpandedAccordion({
                    shipping: false,
                    payment: false,
                    review: true,
                  });
                }}
                className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                  activeStep === 3
                    ? "border-[#1C1916] text-[#1C1916] font-medium"
                    : "border-transparent text-[#8A857E] hover:text-[#1C1916]"
                }`}
              >
                <span>03</span> Review
              </button>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-14 items-start">
            {/* Left Column: Accordion Forms */}
            <div className="space-y-4">
              {/* Accordion Item 1: SHIPPING */}
              <div className="bg-[#FAF8F5] border border-[#E6DED4] rounded-[4px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion("shipping")}
                  className="w-full px-6 sm:px-8 py-5 flex items-center justify-between bg-[#FAF8F5] text-left cursor-pointer hover:bg-[#F5EFE7]/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-6 h-6 rounded-full border border-[#1C1916]/30 flex items-center justify-center font-sans text-[11px] font-medium text-[#1C1916]">
                      1
                    </span>
                    <h2 className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[#1C1916]">
                      SHIPPING
                    </h2>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-[#1C1916]/60 transition-transform duration-300 ease-in-out ${
                      expandedAccordion.shipping ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {expandedAccordion.shipping && (
                  <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-[#ECE7E1]/60 animate-fade-in">
                    {/* Saved Addresses Section (Image 2) */}
                    {isAuthenticated &&
                    savedAddresses.length > 0 &&
                    !useNewAddress ? (
                      <div className="mb-8">
                        <h3 className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#1C1916] mb-1">
                          SELECT A SAVED ADDRESS
                        </h3>
                        <p className="font-sans text-[12px] font-light text-[#8A857E] mb-5">
                          Choose an address where you would like your order to
                          be delivered.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                          {savedAddresses.map((addr) => {
                            const addrId = addr._id || addr.id;
                            const isSelected = selectedAddressId === addrId;
                            return (
                              <div
                                key={addrId}
                                onClick={() => setSelectedAddressId(addrId)}
                                className={`relative p-5 rounded-[4px] border transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? "border-[#1C1916] bg-[#FAF8F5]"
                                    : "border-[#E6DED4] bg-[#FAF8F5] hover:border-[#B58A5B]"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="inline-block px-2.5 py-0.5 rounded-[2px] bg-[#EFE9E1] font-sans text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#6B6560]">
                                    {addr.isDefault
                                      ? "Default"
                                      : addr.label || "Address"}
                                  </span>
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddressMenuOpen(
                                          addressMenuOpen === addrId
                                            ? null
                                            : addrId,
                                        );
                                      }}
                                      className="p-1 text-[#8A857E] hover:text-[#1C1916] rounded-full"
                                    >
                                      <MoreVertical size={15} />
                                    </button>
                                    {addressMenuOpen === addrId && (
                                      <div className="absolute right-0 top-6 z-20 bg-[#FAF8F5] border border-[#E6DED4] shadow-md rounded-[2px] py-1 text-[11px] min-w-[120px]">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            customerApi.addresses.setDefault(
                                              addrId,
                                            );
                                            setAddressMenuOpen(null);
                                            toast(
                                              "Set as default address",
                                              "success",
                                            );
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-[#F5EFE7] text-[#1C1916]"
                                        >
                                          Set as Default
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <h4 className="font-serif text-[15px] font-medium text-[#1C1916] mb-1">
                                  {addr.label || addr.fullName || "Home"}
                                </h4>
                                <p className="font-sans text-[12.5px] font-medium text-[#1C1916] mb-1">
                                  {addr.fullName ||
                                    addr.name ||
                                    user?.name ||
                                    "Customer Name"}
                                </p>
                                <p className="font-sans text-[12px] font-light text-[#6B6560] leading-relaxed">
                                  {addr.addressLine1 || addr.address}
                                  {addr.addressLine2 || addr.apartment
                                    ? `, ${addr.addressLine2 || addr.apartment}`
                                    : ""}
                                </p>
                                <p className="font-sans text-[12px] font-light text-[#6B6560]">
                                  {addr.city}, {addr.state}{" "}
                                  {addr.zipCode || addr.postalCode || addr.zip}
                                </p>
                                <p className="font-sans text-[12px] font-light text-[#6B6560] mb-2">
                                  {addr.country || "India"}
                                </p>
                                <p className="font-sans text-[11.5px] font-light text-[#8A857E]">
                                  {addr.phone ||
                                    user?.phone ||
                                    "+91 98765 43210"}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Button to toggle New Address Form */}
                        <button
                          type="button"
                          onClick={() => setUseNewAddress(true)}
                          className="w-full py-3.5 border border-[#E6DED4] rounded-[2px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#1C1916] hover:border-[#1C1916] hover:bg-[#FAF8F5] transition-all flex items-center justify-center gap-2 cursor-pointer mb-4"
                        >
                          <Plus size={14} /> USE A NEW ADDRESS
                        </button>
                      </div>
                    ) : (
                      /* New Address Form (Image 1) */
                      <form
                        onSubmit={handleContinueToPayment}
                        className="space-y-6"
                      >
                        {/* Contact Information */}
                        <div>
                          <h3 className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#1C1916] mb-4">
                            CONTACT INFORMATION
                          </h3>
                          <div className="space-y-1">
                            <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                              Email address
                            </label>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) =>
                                handleInputChange("email", e.target.value)
                              }
                              placeholder="Email address"
                              className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                            />
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#1C1916]">
                              DELIVERY ADDRESS
                            </h3>
                            {savedAddresses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setUseNewAddress(false)}
                                className="text-[10.5px] font-sans text-[#B58A5B] hover:underline"
                              >
                                &larr; Select saved address
                              </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                Full name
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={(e) =>
                                  handleInputChange("fullName", e.target.value)
                                }
                                placeholder="Full name"
                                className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                Phone number
                              </label>
                              <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) =>
                                  handleInputChange("phone", e.target.value)
                                }
                                placeholder="Phone number"
                                className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                Address
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.address}
                                onChange={(e) =>
                                  handleInputChange("address", e.target.value)
                                }
                                placeholder="Address"
                                className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                Apartment, suite, etc. (optional)
                              </label>
                              <input
                                type="text"
                                value={formData.apartment}
                                onChange={(e) =>
                                  handleInputChange("apartment", e.target.value)
                                }
                                placeholder="Apartment, suite, etc. (optional)"
                                className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                              />
                            </div>

                            {/* City, State, Postal Code Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                  City
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.city}
                                  onChange={(e) =>
                                    handleInputChange("city", e.target.value)
                                  }
                                  placeholder="City"
                                  className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                  State / Province
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.state}
                                  onChange={(e) =>
                                    handleInputChange("state", e.target.value)
                                  }
                                  placeholder="State / Province"
                                  className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                  Postal / Zip code
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.zip}
                                  onChange={(e) =>
                                    handleInputChange("zip", e.target.value)
                                  }
                                  placeholder="Postal / Zip code"
                                  className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                                />
                              </div>
                            </div>

                            {/* Country / Region Dropdown */}
                            <div className="space-y-1 pt-2">
                              <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                Country / Region
                              </label>
                              <div className="relative">
                                <select
                                  value={formData.country}
                                  onChange={(e) =>
                                    handleInputChange("country", e.target.value)
                                  }
                                  className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none appearance-none cursor-pointer pr-6"
                                >
                                  {COUNTRIES.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={14}
                                  className="absolute right-0 top-3 pointer-events-none text-[#8A857E]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Save Address Checkbox */}
                        <div className="flex items-center gap-2.5 pt-2">
                          <input
                            type="checkbox"
                            id="saveAddress"
                            checked={formData.saveAddressNextTime}
                            onChange={(e) =>
                              handleInputChange(
                                "saveAddressNextTime",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 rounded-[2px] border-[#E6DED4] text-[#1C1916] focus:ring-0 cursor-pointer"
                          />
                          <label
                            htmlFor="saveAddress"
                            className="font-sans text-[12px] font-light text-[#6B6560] cursor-pointer"
                          >
                            Save this address for next time
                          </label>
                        </div>
                      </form>
                    )}

                    {/* Shipping Method Selector (Image 3) */}
                    <div className="mt-8 pt-6 border-t border-[#ECE7E1]">
                      <h3 className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#1C1916] mb-4">
                        SHIPPING METHOD
                      </h3>

                      <div className="space-y-3">
                        <label
                          onClick={() => setShippingMethod("standard")}
                          className={`flex items-center justify-between p-4 rounded-[4px] border cursor-pointer transition-all ${
                            shippingMethod === "standard"
                              ? "border-[#1C1916] bg-[#FAF8F5]/40"
                              : "border-[#E6DED4] hover:border-[#B58A5B]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              checked={shippingMethod === "standard"}
                              onChange={() => setShippingMethod("standard")}
                              className="text-[#1C1916] focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <p className="font-sans text-[13px] font-medium text-[#1C1916]">
                                Standard Shipping
                              </p>
                              <p className="font-sans text-[11px] font-light text-[#B58A5B] mt-0.5">
                                {(() => {
                                  const now = new Date();
                                  const minD = new Date(now);
                                  minD.setDate(now.getDate() + 5);
                                  const maxD = new Date(now);
                                  maxD.setDate(now.getDate() + 7);
                                  const minS = minD.toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  );
                                  const maxS = maxD.toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  );
                                  return `Arrives ${minS} – ${maxS} (5-7 business days)`;
                                })()}
                              </p>
                            </div>
                          </div>
                          <span className="font-sans text-[11px] font-semibold text-[#2E7D32] uppercase tracking-wider">
                            FREE
                          </span>
                        </label>

                        <label
                          onClick={() => setShippingMethod("express")}
                          className={`flex items-center justify-between p-4 rounded-[4px] border cursor-pointer transition-all ${
                            shippingMethod === "express"
                              ? "border-[#1C1916] bg-[#FAF8F5]/40"
                              : "border-[#E6DED4] hover:border-[#B58A5B]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              checked={shippingMethod === "express"}
                              onChange={() => setShippingMethod("express")}
                              className="text-[#1C1916] focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <p className="font-sans text-[13px] font-medium text-[#1C1916]">
                                Express Shipping
                              </p>
                              <p className="font-sans text-[11px] font-light text-[#B58A5B] mt-0.5">
                                {(() => {
                                  const now = new Date();
                                  const minD = new Date(now);
                                  minD.setDate(now.getDate() + 2);
                                  const maxD = new Date(now);
                                  maxD.setDate(now.getDate() + 3);
                                  const minS = minD.toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  );
                                  const maxS = maxD.toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  );
                                  return `Arrives ${minS} – ${maxS} (2-3 business days)`;
                                })()}
                              </p>
                            </div>
                          </div>
                          <span className="font-sans text-[12.5px] font-medium text-[#1C1916]">
                            {formatPrice(1500)}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Section 1 Button */}
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={handleContinueToPayment}
                        className="w-full bg-[#1C1916] text-white py-4 font-sans text-[10.5px] font-semibold uppercase tracking-[0.25em] rounded-[2px] hover:bg-[#B58A5B] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        CONTINUE TO PAYMENT <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion Item 2: PAYMENT (Image 3) */}
              <div className="bg-[#FAF8F5] border border-[#E6DED4] rounded-[4px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion("payment")}
                  className="w-full px-6 sm:px-8 py-5 flex items-center justify-between bg-[#FAF8F5] text-left cursor-pointer hover:bg-[#F5EFE7]/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-6 h-6 rounded-full border border-[#1C1916]/30 flex items-center justify-center font-sans text-[11px] font-medium text-[#1C1916]">
                      2
                    </span>
                    <h2 className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[#1C1916]">
                      PAYMENT
                    </h2>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-[#1C1916]/60 transition-transform duration-300 ease-in-out ${
                      expandedAccordion.payment ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {expandedAccordion.payment && (
                  <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-[#ECE7E1]/60 animate-fade-in">
                    <h3 className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#1C1916] mb-4">
                      PAYMENT METHOD
                    </h3>

                    {/* Payment Options (Image 3) */}
                    <div className="space-y-3 mb-6">
                      {/* Razorpay Featured Option */}
                      <label
                        onClick={() => setPaymentMethod("razorpay")}
                        className={`flex items-center justify-between p-4 rounded-[4px] border cursor-pointer transition-all duration-300 ${
                          paymentMethod === "razorpay"
                            ? "border-[#1C1916] bg-[#FAF8F5] shadow-xs"
                            : "border-[#E6DED4] bg-[#FAF8F5] hover:border-[#B58A5B]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === "razorpay"}
                            onChange={() => setPaymentMethod("razorpay")}
                            className="text-[#1C1916] focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <span className="font-sans text-[13px] font-medium text-[#1C1916] flex items-center gap-2">
                              Razorpay Secure Payment
                              <span className="bg-[#2E7D32]/10 text-[#2E7D32] text-[9.5px] font-semibold uppercase px-2 py-0.5 rounded-[2px] tracking-wider">
                                FAST & SECURE
                              </span>
                            </span>
                            <p className="font-sans text-[11px] font-light text-[#8A857E] mt-0.5">
                              UPI (Google Pay, PhonePe, Paytm), Credit/Debit
                              Cards, NetBanking
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-sans text-[10px] font-bold tracking-wider text-[#0C2340] border border-[#0C2340]/20 px-2 py-1 rounded-[2px] bg-white">
                            UPI / CARDS
                          </span>
                        </div>
                      </label>

                      {/* Credit / Debit Card Option */}
                      <div
                        className={`rounded-[4px] border transition-all duration-300 overflow-hidden ${
                          paymentMethod === "card"
                            ? "border-[#1C1916] bg-[#FAF8F5] shadow-xs"
                            : "border-[#E6DED4] bg-[#FAF8F5] hover:border-[#B58A5B]"
                        }`}
                      >
                        <label
                          onClick={() => setPaymentMethod("card")}
                          className="flex items-center justify-between p-4 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === "card"}
                              onChange={() => setPaymentMethod("card")}
                              className="text-[#1C1916] focus:ring-0 cursor-pointer"
                            />
                            <span className="font-sans text-[13px] font-medium text-[#1C1916]">
                              Credit / Debit Card
                            </span>
                          </div>

                          {/* Real Card logos */}
                          <div className="flex items-center gap-2">
                            <img
                              src="/payment-logos/visa.svg"
                              alt="Visa"
                              className="h-5 w-auto object-contain"
                            />
                            <img
                              src="/payment-logos/mastercard.svg"
                              alt="Mastercard"
                              className="h-5 w-auto object-contain"
                            />
                            <img
                              src="/payment-logos/amex.svg"
                              alt="Amex"
                              className="h-5 w-auto object-contain"
                            />
                          </div>
                        </label>

                        {/* Credit Card Form Inputs */}
                        {paymentMethod === "card" && (
                          <div className="p-4 pt-0 space-y-4 border-t border-[#ECE7E1]/60 mt-2 animate-fade-in">
                            <div className="space-y-1">
                              <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                Card number
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  required
                                  value={cardForm.cardNumber}
                                  onChange={(e) =>
                                    handleCardInputChange(
                                      "cardNumber",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="1234 1234 1234 1234"
                                  className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors pr-8"
                                />
                                <CreditCard
                                  size={15}
                                  className="absolute right-0 top-2.5 text-[#8A857E]"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                Name on card
                              </label>
                              <input
                                type="text"
                                required
                                value={cardForm.cardName}
                                onChange={(e) =>
                                  handleCardInputChange(
                                    "cardName",
                                    e.target.value,
                                  )
                                }
                                placeholder="Name on card"
                                className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                  MM / YY
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={cardForm.expiry}
                                  onChange={(e) =>
                                    handleCardInputChange(
                                      "expiry",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="MM / YY"
                                  className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="block font-sans text-[11px] font-light text-[#6B6560]">
                                    CVC
                                  </label>
                                  <HelpCircle
                                    size={12}
                                    className="text-[#8A857E]"
                                  />
                                </div>
                                <input
                                  type="text"
                                  required
                                  value={cardForm.cvc}
                                  onChange={(e) =>
                                    handleCardInputChange("cvc", e.target.value)
                                  }
                                  placeholder="CVC"
                                  className="w-full border-b border-[#ECE7E1] py-2 text-[13px] font-light text-[#1C1916] bg-transparent focus:border-[#1C1916] outline-none transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* PayPal Option */}
                      <label
                        onClick={() => setPaymentMethod("paypal")}
                        className={`flex items-center justify-between p-4 rounded-[4px] border cursor-pointer transition-all duration-300 ${
                          paymentMethod === "paypal"
                            ? "border-[#1C1916] bg-[#FAF8F5] shadow-xs"
                            : "border-[#E6DED4] bg-[#FAF8F5] hover:border-[#B58A5B]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === "paypal"}
                            onChange={() => setPaymentMethod("paypal")}
                            className="text-[#1C1916] focus:ring-0 cursor-pointer"
                          />
                          <span className="font-sans text-[13px] font-medium text-[#1C1916]">
                            PayPal
                          </span>
                        </div>
                        <img
                          src="/payment-logos/paypal.svg"
                          alt="PayPal"
                          className="h-5 w-auto object-contain"
                        />
                      </label>

                      {/* Google Pay Option */}
                      <label
                        onClick={() => setPaymentMethod("gpay")}
                        className={`flex items-center justify-between p-4 rounded-[4px] border cursor-pointer transition-all duration-300 ${
                          paymentMethod === "gpay"
                            ? "border-[#1C1916] bg-[#FAF8F5] shadow-xs"
                            : "border-[#E6DED4] bg-[#FAF8F5] hover:border-[#B58A5B]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === "gpay"}
                            onChange={() => setPaymentMethod("gpay")}
                            className="text-[#1C1916] focus:ring-0 cursor-pointer"
                          />
                          <span className="font-sans text-[13px] font-medium text-[#1C1916]">
                            Google Pay
                          </span>
                        </div>
                        <span className="font-sans text-[11px] font-bold tracking-wider text-[#4285F4] border border-[#4285F4]/30 px-2 py-0.5 rounded-[2px] bg-white">
                          GPay (UPI)
                        </span>
                      </label>

                      {/* Apple Pay Option */}
                      <label
                        onClick={() => setPaymentMethod("apple_pay")}
                        className={`flex items-center justify-between p-4 rounded-[4px] border cursor-pointer transition-all duration-300 ${
                          paymentMethod === "apple_pay"
                            ? "border-[#1C1916] bg-[#FAF8F5] shadow-xs"
                            : "border-[#E6DED4] bg-[#FAF8F5] hover:border-[#B58A5B]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === "apple_pay"}
                            onChange={() => setPaymentMethod("apple_pay")}
                            className="text-[#1C1916] focus:ring-0 cursor-pointer"
                          />
                          <span className="font-sans text-[13px] font-medium text-[#1C1916]">
                            Apple Pay
                          </span>
                        </div>
                        <img
                          src="/payment-logos/applepay.svg"
                          alt="Apple Pay"
                          className="h-5 w-auto object-contain"
                        />
                      </label>
                    </div>

                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={handleContinueToReview}
                        className="w-full bg-[#1C1916] text-white py-4 font-sans text-[10.5px] font-semibold uppercase tracking-[0.25em] rounded-[2px] hover:bg-[#B58A5B] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        CONTINUE TO REVIEW <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion Item 3: REVIEW */}
              <div className="bg-[#FAF8F5] border border-[#E6DED4] rounded-[4px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion("review")}
                  className="w-full px-6 sm:px-8 py-5 flex items-center justify-between bg-[#FAF8F5] text-left cursor-pointer hover:bg-[#F5EFE7]/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-6 h-6 rounded-full border border-[#1C1916]/30 flex items-center justify-center font-sans text-[11px] font-medium text-[#1C1916]">
                      3
                    </span>
                    <h2 className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[#1C1916]">
                      REVIEW & PLACE ORDER
                    </h2>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-[#1C1916]/60 transition-transform duration-300 ease-in-out ${
                      expandedAccordion.review ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {expandedAccordion.review && (
                  <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-[#ECE7E1]/60 animate-fade-in">
                    <div className="space-y-4 mb-6">
                      <div className="p-4 bg-[#FAF8F5] rounded-[4px] border border-[#E6DED4]/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#8A857E]">
                            Delivery Address
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveStep(1);
                              setExpandedAccordion({
                                shipping: true,
                                payment: false,
                                review: false,
                              });
                            }}
                            className="text-[10.5px] text-[#B58A5B] hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="font-sans text-[12.5px] text-[#1C1916] font-medium">
                          {formData.fullName || "Customer Name"}
                        </p>
                        <p className="font-sans text-[12px] font-light text-[#6B6560]">
                          {formData.address || "123 MG Road"}{" "}
                          {formData.apartment}
                        </p>
                        <p className="font-sans text-[12px] font-light text-[#6B6560]">
                          {formData.city}, {formData.state} {formData.zip},{" "}
                          {formData.country}
                        </p>
                      </div>

                      <div className="p-4 bg-[#FAF8F5] rounded-[4px] border border-[#E6DED4]/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#8A857E]">
                            Payment Method
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveStep(2);
                              setExpandedAccordion({
                                shipping: false,
                                payment: true,
                                review: false,
                              });
                            }}
                            className="text-[10.5px] text-[#B58A5B] hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="font-sans text-[12.5px] text-[#1C1916] font-medium capitalize">
                          {paymentMethod === "card"
                            ? "Credit / Debit Card"
                            : paymentMethod.replace("_", " ")}
                        </p>
                      </div>
                    </div>

                    {paymentError && (
                      <div className="mb-4 p-4 bg-[#FDF2F2] border border-[#F8B4B4] rounded-[2px] text-[12.5px] text-[#C94C4C] space-y-1">
                        <div className="flex items-center gap-2 font-semibold uppercase text-[11px] tracking-wider">
                          <AlertCircle size={15} /> Payment Couldn't Be
                          Completed
                        </div>
                        <p className="font-light">{paymentError}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={placingOrder}
                      onClick={handlePlaceOrder}
                      className="w-full bg-[#1C1916] text-white py-4 font-sans text-[10.5px] font-semibold uppercase tracking-[0.25em] rounded-[2px] hover:bg-[#B58A5B] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {placingOrder ? (
                        "PROCESSING ORDER..."
                      ) : (
                        <>
                          PLACE ORDER <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: YOUR ORDER Summary Panel */}
            <div className="bg-[#FAF8F5] border border-[#E6DED4] rounded-[4px] p-5 sm:p-8 static lg:sticky lg:top-[95px]">
              <h2 className="font-serif text-[18px] font-normal tracking-wide text-[#1C1916] mb-6">
                YOUR ORDER
              </h2>

              {/* Order Items List */}
              <div className="space-y-4 mb-6 max-h-[340px] overflow-y-auto pr-1">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div
                      key={item.key || item.id}
                      className="flex gap-4 items-center"
                    >
                      <img
                        src={item.image || item.img || "/storefront/prod-1.png"}
                        alt={item.name}
                        className="w-14 h-16 object-cover bg-[#EFE9E1] rounded-[2px] border border-[#E6DED4]/60 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-[14px] text-[#1C1916] leading-tight truncate">
                          {item.name}
                        </h4>
                        <p className="font-sans text-[11px] font-light text-[#8A857E] mt-0.5">
                          {item.color || item.size || "Standard"}
                        </p>
                        <p className="font-sans text-[11px] font-light text-[#8A857E] mt-0.5">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-sans text-[12.5px] font-medium text-[#1C1916]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[12px] text-[#8A857E] italic">
                    Your cart is empty.
                  </p>
                )}
              </div>

              {/* Price Calculations Breakdown */}
              <div className="space-y-3 pt-4 border-t border-[#ECE7E1] font-sans text-[12.5px] text-[#6B6560] font-light">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[#1C1916] font-medium">
                    {formatPrice(finalSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-[#2E7D32] font-semibold uppercase text-[10.5px]">
                    {displayShippingCost}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="text-[#1C1916]">
                    {formatPrice(finalTax)}
                  </span>
                </div>

                {(totals.discount > 0 || appliedCoupon) && (
                  <div className="flex justify-between text-[#2E7D32] font-medium">
                    <span>Discount ({appliedCoupon?.code || "Coupon"})</span>
                    <span>
                      -
                      {formatPrice(
                        totals.discount || appliedCoupon?.discountAmount || 0,
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="flex justify-between items-baseline pt-5 mt-4 border-t border-[#1C1916]/10">
                <span className="font-serif text-[20px] font-normal text-[#1C1916]">
                  Total
                </span>
                <div className="text-right">
                  <span className="font-sans text-[10px] text-[#8A857E] font-medium uppercase mr-1.5">
                    {currencyCode}
                  </span>
                  <span className="font-sans text-[20px] font-semibold text-[#1C1916]">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Applied Coupon Badge */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-[#EAF3EB] border border-[#2E7D32]/30 px-3.5 py-2.5 rounded-[2px] mt-6 text-[#2E7D32] text-[12px]">
                  <div className="flex items-center gap-2 font-medium">
                    <Tag size={14} />
                    <span>
                      Coupon <strong>"{appliedCoupon.code}"</strong> applied
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setPromoCode("");
                      setCouponError("");
                      toast("Coupon removed", "info");
                    }}
                    className="text-[#C94C4C] hover:underline text-[11px] font-sans font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <form
                    onSubmit={handleApplyCoupon}
                    className="mt-6 flex gap-2"
                  >
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="flex-1 uppercase bg-[#FAF8F5] border border-[#E6DED4] px-3.5 py-2.5 text-[12px] font-light text-[#1C1916] outline-none placeholder:text-[#8A857E] rounded-[2px]"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="bg-[#C3A98B] hover:bg-[#B58A5B] text-white px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] rounded-[2px] transition-colors cursor-pointer"
                    >
                      {couponLoading ? "..." : "APPLY"}
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={openCouponModal}
                    className="mt-2.5 flex items-center gap-1 text-[11px] text-[#B58A5B] hover:text-[#1C1916] font-medium tracking-wide transition-colors cursor-pointer"
                  >
                    <Tag size={12} />
                    View available coupons
                    <ChevronRight size={11} />
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-[11px] text-[#C94C4C] mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {couponError}
                </p>
              )}

              {/* Trust Badges Block */}
              <div className="mt-8 pt-6 border-t border-[#ECE7E1] space-y-4 text-[11px] font-sans text-[#6B6560]">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={18}
                    className="text-[#1C1916] shrink-0 mt-0.5"
                  />
                  <div>
                    <h5 className="font-medium text-[#1C1916] uppercase text-[10px] tracking-wider mb-0.5">
                      SECURE CHECKOUT
                    </h5>
                    <p className="font-light text-[#8A857E] text-[10.5px] leading-snug">
                      Your payment information is processed securely.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Truck size={18} className="text-[#1C1916] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-[#1C1916] uppercase text-[10px] tracking-wider mb-0.5">
                      COMPLIMENTARY SHIPPING & DUTIES
                    </h5>
                    <p className="font-light text-[#8A857E] text-[10.5px] leading-snug">
                      Orders ship direct from Srinagar/Delhi with full tracking.
                      International duties & VAT options calculated
                      transparently.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <RotateCcw
                    size={18}
                    className="text-[#1C1916] shrink-0 mt-0.5"
                  />
                  <div>
                    <h5 className="font-medium text-[#1C1916] uppercase text-[10px] tracking-wider mb-0.5">
                      7-DAY HASSLE-FREE RETURNS
                    </h5>
                    <p className="font-light text-[#8A857E] text-[10.5px] leading-snug">
                      Shop with complete peace of mind. Easy returns and
                      exchanges within 7 days of delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />

      {/* Coupon Picker Modal */}
      {showCouponModal && (
        <CouponPickerModal
          coupons={availableCoupons}
          loading={couponsLoading}
          cartSubtotal={totals.subtotal}
          onPick={handlePickCoupon}
          onClose={() => setShowCouponModal(false)}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
}
