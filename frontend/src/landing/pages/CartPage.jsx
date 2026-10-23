import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Bookmark,
  Bell,
  MoreHorizontal,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  Gift,
  Truck,
  RotateCcw,
  Lock,
  Check,
  ShoppingBag,
  CreditCard,
  X,
  Tag,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import { useCart } from "../../context/CartContext";
import { useFavorite } from "../../context/FavoritesContext";
import { getCategorySlug, api } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { customerApi } from "../../lib/customerApi";
import { useEffect } from "react";
import CouponPickerModal from "../../components/CouponPickerModal";

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const {
    cart,
    updateQuantity,
    removeItem,
    totals,
    clearCart,
    selectedAddress,
    setSelectedAddress,
    appliedCoupon,
    setAppliedCoupon,
    giftNote,
    saveGiftNote,
    clearGiftNote,
  } = useCart();
  const { addFavorite } = useFavorite();
  const { user, isAuthenticated } = useCustomerAuth();
  const { formatPrice, currencyCode } = useCurrency();

  const [confirmModalItem, setConfirmModalItem] = useState(null);
  const [removingKeys, setRemovingKeys] = useState([]);

  const handleMoveToWishlist = async (item) => {
    if (!isAuthenticated) {
      toast("Please log in to save favorites", "info");
      return;
    }
    const success = await addFavorite({
      _id: item.id,
      name: item.name,
      slug: item.slug,
      basePrice: item.price,
      img: item.image,
      category: item.category,
      color: item.color,
      size: item.size
    });
    if (success) {
      removeItem(item.key);
      toast(`"${item.name}" moved to Favorites`, "success");
    }
  };

  const executeRemove = (key) => {
    setRemovingKeys((prev) => [...prev, key]);
    setConfirmModalItem(null);
    setTimeout(() => {
      removeItem(key);
      setRemovingKeys((prev) => prev.filter((k) => k !== key));
    }, 300);
  };

  const executeMoveToWishlist = async (item) => {
    setConfirmModalItem(null);
    await handleMoveToWishlist(item);
  };

  // State for gift note accordion UI
  const [showGiftInput, setShowGiftInput] = useState(false);
  const [tempGiftNote, setTempGiftNote] = useState(giftNote || "");

  useEffect(() => {
    setTempGiftNote(giftNote || "");
  }, [giftNote]);

  const handleSaveGiftNote = (e) => {
    if (e) e.preventDefault();
    saveGiftNote(tempGiftNote);
    toast("Gift note saved to your order", "success");
  };

  const handleClearGiftNote = () => {
    setTempGiftNote("");
    clearGiftNote();
    toast("Gift note removed", "info");
  };

  // Coupon code state
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) { setCouponError("Please enter a coupon code."); return; }
    setCouponLoading(true);
    setCouponError("");
    try {
      const coupon = await api.coupons.validate(code, totals.subtotal);
      setAppliedCoupon(coupon);
      setCouponInput("");
      const label = coupon.discountType === "percentage"
        ? `${coupon.discountValue}% off`
        : `₹${coupon.discountValue} off`;
      toast(`Coupon "${coupon.code}" applied — ${label}`, "success");
    } catch (err) {
      setCouponError(err.message || "Invalid or expired coupon code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    toast("Coupon removed", "success");
  };

  const couponDiscount = totals.discount || 0;
  const finalTotal = totals.total;

  // Coupon modal state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsLoaded, setCouponsLoaded] = useState(false);

  const openCouponModal = async () => {
    setShowCouponModal(true);
    if (couponsLoaded) return; // already fetched
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
    setCouponInput("");
    setCouponError("");
    setCouponLoading(true);
    try {
      const coupon = await api.coupons.validate(code, totals.subtotal);
      setAppliedCoupon(coupon);
      const label = coupon.discountType === "percentage"
        ? `${coupon.discountValue}% off`
        : `₹${coupon.discountValue} off`;
      toast(`Coupon "${coupon.code}" applied — ${label}`, "success");
    } catch (err) {
      setCouponError(err.message || "Could not apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  };



  // State for checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Info, 2 = Processing, 3 = Success
  const [checkoutForm, setCheckoutForm] = useState({
    email: "",
    name: "",
    address: "",
    city: "",
    postalCode: "",
    cardNumber: "4111 2222 3333 4444",
    cardExpiry: "12/29",
    cardCvc: "123",
  });
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // Autofetch and set user default address to trigger backend tax estimation on mount
  useEffect(() => {
    if (isAuthenticated && user?.addresses?.length) {
      const defaultAddr =
        user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddr);
      setSelectedAddressId(defaultAddr._id || "");
    } else {
      setSelectedAddress(null);
      setSelectedAddressId("");
    }
  }, [isAuthenticated, user, setSelectedAddress]);

  // Handle address change in checkout modal
  const handleAddressChange = (addrId) => {
    setSelectedAddressId(addrId);
    if (user?.addresses) {
      const addr = user.addresses.find((a) => a._id === addrId);
      setSelectedAddress(addr);
    }
  };

  // Prefill when checkout modal opens
  useEffect(() => {
    if (showCheckoutModal && isAuthenticated && user) {
      const currentAddr = selectedAddress || user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
      setSelectedAddressId(currentAddr?._id || "");
      setCheckoutForm({
        email: user.email || "",
        name: user.name || "",
        address: currentAddr?.addressLine || "",
        city: currentAddr?.city || "",
        postalCode: currentAddr?.postalCode || "",
        cardNumber: "4111 2222 3333 4444",
        cardExpiry: "12/29",
        cardCvc: "123",
      });
    }
  }, [showCheckoutModal, isAuthenticated, user, selectedAddress]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("checkout") === "1" && isAuthenticated) {
      setCheckoutStep(1);
      setShowCheckoutModal(true);
      navigate("/cart", { replace: true });
    }
  }, [location.search, isAuthenticated, navigate]);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAddressId) {
      toast("Please select a saved shipping address", "error");
      return;
    }

    setCheckoutStep(2);
    try {
      if (!isAuthenticated) {
        toast("Please log in to complete your purchase", "info");
        navigate("/login?redirect=cart");
        return;
      }

      await customerApi.orders.place({
        items: cart.map((item) => ({
          product: item.id,
          qty: item.quantity,
          price: item.price,
          size: item.size || "",
        })),
        subtotal: totals.subtotal,
        shipping: totals.shipping || 0,
        discount: couponDiscount || 0,
        coupon: appliedCoupon?.code || "",
        total: finalTotal,
        currency: currencyCode,
        paymentMethod: "Credit Card",
        shippingAddressId: selectedAddressId,
        notes: giftNote,
      });

      setCheckoutStep(3);
      clearCart();
      localStorage.removeItem("zae_cart_gift_note");
      setGiftNote("");
      setIsGiftSaved(false);
      toast("Order placed successfully!", "success");
    } catch (err) {
      setCheckoutStep(1);
      toast(err.message || "Failed to place order. Please try again.", "error");
    }
  };

  return (
    <div className="bg-[#FAF8F5] text-[#1C1916] font-sans min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Standard Site Navbar */}
      <Navbar />

      {/* Main Container with top padding to clear the fixed navbar */}
      <main className="flex-1 pt-[68px]">
        {/* Dedicated Minimal Cart Header */}
        <div className="border-b border-[#E6DED4]/60 bg-[#FAF8F5]">
          <div className="mx-auto max-w-[1440px] 2xl:max-w-[1680px] w-full px-4 sm:px-10 lg:px-16 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase text-[#1C1916]/70 hover:text-[#1C1916] cursor-pointer transition-colors duration-200"
            >
              <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
                ←
              </span>{" "}
              CART
            </button>
            <div className="flex items-center gap-4 sm:gap-5 text-[#1C1916]/70">
              <button
                onClick={() => toast("Added to saved items", "success")}
                className="hover:text-[#1C1916] cursor-pointer transition-colors"
                aria-label="Bookmark cart status"
              >
                <Bookmark size={15} strokeWidth={1.4} />
              </button>
              <button
                onClick={() =>
                  toast("Notifications set for this cart", "success")
                }
                className="hover:text-[#1C1916] cursor-pointer transition-colors"
                aria-label="Notifications"
              >
                <Bell size={15} strokeWidth={1.4} />
              </button>
              <button
                onClick={() => toast("More options coming soon", "success")}
                className="hover:text-[#1C1916] cursor-pointer transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal size={15} strokeWidth={1.4} />
              </button>
            </div>
          </div>
        </div>

        {/* Cart Contents Section */}
        <div className="mx-auto max-w-[1440px] 2xl:max-w-[1680px] w-full px-4 sm:px-10 lg:px-16 py-8 sm:py-12">
          {/* Title Area */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 pb-6 border-b border-[#E6DED4]/60">
            <div>
              <h1 className="font-serif text-[32px] md:text-[38px] font-normal tracking-wide text-[#1C1916]">
                Your Cart
              </h1>
              <p className="font-sans text-[12px] text-[#8A857E] mt-1.5 font-light">
                {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
              </p>
            </div>
            <Link
              to="/collections"
              className="group inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1C1916] hover:text-[#B58A5B] transition-colors duration-200 cursor-pointer"
            >
              Continue Shopping{" "}
              <ArrowRight
                size={12}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>

          {cart.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5EFE7] text-[#B58A5B]">
                <ShoppingBag size={24} strokeWidth={1.3} />
              </div>
              <h2 className="font-serif text-[20px] font-light text-[#1C1916] mb-3">
                Your cart is empty
              </h2>
              <p className="font-sans text-[13.5px] text-[#8A857E] font-light mb-8 max-w-[320px] leading-relaxed">
                Explore our handwoven luxury collections to add a touch of
                Kashmiri heritage to your wardrobe.
              </p>
              <Link
                to="/collections"
                className="border border-[#1C1916] text-[#1C1916] hover:bg-[#1C1916] hover:text-white transition-colors duration-300 px-8 py-3.5 text-[10px] font-semibold tracking-[0.2em] uppercase rounded-[2px] cursor-pointer"
              >
                Explore Collections
              </Link>
            </div>
          ) : (
            /* Main Cart Layout */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16 items-start">
              {/* Left Side: Items List & Extras */}
              <div className="lg:col-span-2 space-y-8">
                <div className="divide-y divide-[#E6DED4]/60 bg-white rounded-lg border border-[#E6DED4]/40 px-4 sm:px-6">
                  {cart.map((item) => {
                    const productSlug =
                      item.slug ||
                      (item.name || "")
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "");
                    const detailPath = `/collection/${getCategorySlug(item.category)}/${productSlug}`;

                    const isRemoving = removingKeys.includes(item.key);

                    return (
                      <div key={item.key} className={`flex gap-4 sm:gap-6 py-6 md:py-8 transition-all duration-300 ease-in-out ${
                        isRemoving
                          ? "opacity-0 translate-x-8 max-h-0 py-0 overflow-hidden"
                          : ""
                      }`}>
                        {/* Image */}
                        <Link
                          to={detailPath}
                          className="aspect-[4/5] w-[84px] sm:w-[130px] shrink-0 overflow-hidden rounded-[4px] bg-[#EFE9E1] border border-[#E6DED4]/30 shadow-sm"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </Link>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <Link
                                to={detailPath}
                                className="font-serif text-[15px] sm:text-[19px] font-normal leading-snug text-[#1C1916] hover:text-[#B58A5B] transition-colors cursor-pointer truncate"
                              >
                                {item.name}
                              </Link>

                              {/* Price */}
                              <span className="font-sans text-[14px] sm:text-[16px] font-medium text-[#1C1916] whitespace-nowrap">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>

                            {/* Options Details */}
                            <p className="font-sans text-[11px] sm:text-[12px] text-[#8A857E] mt-1.5 font-light">
                              {item.color}{" "}
                              <span className="mx-1 text-[#E6DED4]">•</span>{" "}
                              {item.size}
                            </p>

                            {/* Stock Indicator */}
                            {item.stockQuantity <= 5 && (
                              <span className="inline-block mt-2 font-sans text-[9px] font-semibold uppercase tracking-wider text-[#C94C4C] bg-[#C94C4C]/5 px-2 py-0.5 rounded-[2px]">
                                Only {item.stockQuantity} items left
                              </span>
                            )}
                          </div>

                          {/* Controls & Delete */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mt-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center border border-[#E6DED4] bg-white rounded-[2px] shadow-xs">
                              <button
                                onClick={() =>
                                  updateQuantity(item.key, item.quantity - 1)
                                }
                                disabled={item.quantity <= 1}
                                className="px-2.5 sm:px-3 py-1.5 text-[#8A857E] hover:text-[#1C1916] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="px-2 font-sans text-[12px] text-[#1C1916] font-medium select-none min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.key, item.quantity + 1)
                                }
                                disabled={item.quantity >= item.stockQuantity}
                                className="px-2.5 sm:px-3 py-1.5 text-[#8A857E] hover:text-[#1C1916] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Increase quantity"
                              >
                                <Plus size={11} />
                              </button>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4">
                              <button
                                onClick={() => handleMoveToWishlist(item)}
                                className="font-sans text-[10.5px] sm:text-[11px] font-semibold text-[#8A857E] hover:text-[#B58A5B] transition-colors uppercase tracking-wider pb-0.5 border-b border-transparent hover:border-[#B58A5B]/40 cursor-pointer whitespace-nowrap"
                              >
                                Move to Wishlist
                              </button>

                              {/* Trash Button */}
                              <button
                                onClick={() => setConfirmModalItem(item)}
                                className="p-1.5 text-[#8A857E] hover:text-[#C94C4C] hover:bg-[#C94C4C]/5 rounded-full cursor-pointer transition-colors duration-200"
                                aria-label="Remove item"
                              >
                                <Trash2 size={16} strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Gift Note Accordion */}
                <div className="border border-[#E6DED4]/60 rounded-[4px] bg-[#FBF9F6] overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setShowGiftInput(!showGiftInput)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer hover:bg-[#F5EFE7]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Gift size={16} className="text-[#B58A5B] shrink-0" />
                      <div>
                        <span className="font-sans text-[12px] md:text-[13px] font-medium tracking-wide text-[#1C1916]">
                          Add a gift note or special instructions
                        </span>
                        {!!giftNote && (
                          <span className="ml-2.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#2E7D32] uppercase tracking-wider bg-[#2E7D32]/5 px-2 py-0.5 rounded-[2px]">
                            <Check size={8} strokeWidth={3} /> Added
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[#8A857E] font-light text-lg ml-2">
                      {showGiftInput ? "−" : "+"}
                    </span>
                  </button>

                  {showGiftInput && (
                    <form
                      onSubmit={handleSaveGiftNote}
                      className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#E6DED4]/40"
                    >
                      <textarea
                        value={tempGiftNote}
                        onChange={(e) => setTempGiftNote(e.target.value)}
                        placeholder="Write a message to be hand-written on our luxury packaging card (Max 250 characters)..."
                        maxLength={250}
                        rows={3}
                        className="w-full p-3 bg-white border border-[#E6DED4] rounded-[2px] font-sans text-[12.5px] font-light text-[#1C1916] placeholder:text-[#8A857E]/65 focus:outline-none focus:border-[#B58A5B] transition-colors resize-none"
                      />
                      <div className="flex flex-wrap items-center justify-end gap-2.5 mt-3">
                        {!!giftNote && (
                          <button
                            type="button"
                            onClick={handleClearGiftNote}
                            className="px-3.5 py-2 text-[10px] font-semibold tracking-wider uppercase text-[#C94C4C] hover:bg-[#C94C4C]/5 rounded-[2px] transition-colors cursor-pointer"
                          >
                            Remove Note
                          </button>
                        )}
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-[#1C1916] hover:bg-[#B58A5B] text-white text-[10px] sm:text-[10.5px] font-semibold tracking-[0.16em] uppercase rounded-[2px] transition-colors cursor-pointer shadow-xs"
                        >
                          SAVE INSTRUCTIONS
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Side: Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-[#FBF9F6] border border-[#E6DED4]/60 rounded-[4px] p-5 sm:p-8 static lg:sticky lg:top-[95px] shadow-xs">
                  <h2 className="font-serif text-[18px] font-normal tracking-wide text-[#1C1916] mb-6">
                    Order Summary
                  </h2>

                  {totals.error && (
                    <div className="mb-4 flex items-center justify-between gap-2 text-[#C94C4C] bg-[#C94C4C]/5 border border-[#C94C4C]/20 p-3 rounded-[3px] text-[11.5px] font-light leading-relaxed">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{totals.error}</span>
                      </div>
                      <button
                        onClick={() => {
                          const match = totals.error.match(/Product not found: (\S+)/);
                          if (match && match[1]) {
                            removeItem(match[1]);
                          } else {
                            clearCart();
                          }
                        }}
                        className="shrink-0 text-[10.5px] font-medium underline hover:text-[#1C1916] transition-colors"
                      >
                        Clear item
                      </button>
                    </div>
                  )}

                  <div className={`space-y-4 font-sans text-[12.5px] font-light text-[#6B6560] ${totals.loading ? 'opacity-50' : ''} transition-opacity duration-200`}>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-[#1C1916] font-medium">
                        {formatPrice(totals.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-[#1C1916]">
                        {totals.shipping === 0 ? (
                          <span className="text-[#2E7D32] font-semibold uppercase tracking-wider text-[10px] bg-[#2E7D32]/5 px-2 py-0.5 rounded-[2px]">
                            Free
                          </span>
                        ) : (
                          formatPrice(totals.shipping)
                        )}
                      </span>
                    </div>

                    {totals.tax > 0 && (
                      <div className="flex justify-between">
                        <span>{totals.taxName || 'Estimated Tax'} {totals.taxRate ? `(${totals.taxRate}%)` : ''}</span>
                        <span className="text-[#1C1916]">
                          {formatPrice(totals.tax)}
                        </span>
                      </div>
                    )}

                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-[#2E7D32]">
                        <span className="flex items-center gap-1">
                          <Gift size={11} />
                          Coupon ({appliedCoupon?.code})
                        </span>
                        <span className="font-semibold">−{formatPrice(couponDiscount)}</span>
                      </div>
                    )}

                    <div className="border-t border-[#E6DED4]/60 my-5 pt-4 flex justify-between text-[15px] font-normal text-[#1C1916]">
                      <span className="font-medium">Total</span>
                      <div className="text-right">
                        <span className="font-serif text-[18px] font-semibold">
                          {formatPrice(finalTotal)}
                        </span>
                        <p className="text-[10px] text-[#8A857E] mt-0.5 font-light">
                          {totals.taxName ? `${totals.taxName} included` : 'Taxes included'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Coupon Code Entry */}
                  <div className="mb-5">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-[#2E7D32]/5 border border-[#2E7D32]/30 rounded-[4px] px-3 py-2.5">
                        <div className="flex items-center gap-2 text-[#2E7D32]">
                          <Check size={13} strokeWidth={2} />
                          <span className="font-semibold text-[11px] tracking-wide">{appliedCoupon.code}</span>
                          <span className="text-[#6B6560] text-[10.5px]">
                            {appliedCoupon.discountType === "percentage"
                              ? `${appliedCoupon.discountValue}% off`
                              : `₹${appliedCoupon.discountValue} flat off`}
                          </span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-[10px] text-[#C94C4C] hover:underline font-semibold tracking-wide ml-2 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                            placeholder="Enter coupon code"
                            className="flex-1 border border-[#E6DED4] rounded-[3px] px-3 py-2 text-[12px] font-light text-[#1C1916] placeholder:text-[#8A857E]/60 focus:outline-none focus:border-[#B58A5B] transition-colors bg-white uppercase"
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={couponLoading}
                            className="bg-[#1C1916] text-white px-4 py-2 text-[10.5px] font-semibold tracking-wider uppercase rounded-[3px] hover:bg-[#B58A5B] transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
                          >
                            {couponLoading ? "..." : "Apply"}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[#C94C4C] text-[10.5px] mt-1.5 font-light">{couponError}</p>
                        )}
                        <button
                          onClick={openCouponModal}
                          className="mt-2 flex items-center gap-1 text-[10.5px] text-[#B58A5B] hover:text-[#1C1916] font-medium tracking-wide transition-colors cursor-pointer"
                        >
                          <Tag size={11} />
                          View available coupons
                          <ChevronRight size={10} />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    disabled={cart.length === 0 || totals.loading}
                    onClick={() => {
                      navigate("/checkout");
                    }}
                    className="w-full mt-6 bg-[#1C1916] text-white py-4 font-sans text-[10.5px] font-semibold uppercase tracking-[0.25em] rounded-[2px] hover:bg-[#B58A5B] transition-colors duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {totals.loading ? "Recalculating..." : <>Checkout <ArrowRight size={13} /></>}
                  </button>

                  {/* Benefit items */}
                  <div className="mt-8 pt-6 border-t border-[#E6DED4]/60 space-y-4 text-[11px] font-sans text-[#8A857E] font-light">
                    <div className="flex items-center gap-3">
                      <Truck size={14} className="text-[#B58A5B]" />
                      <span>Complimentary shipping on all orders</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Lock size={14} className="text-[#B58A5B]" />
                      <span>100% secure checkout and data protection</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RotateCcw size={14} className="text-[#B58A5B]" />
                      <span>Easy returns within 7 days of delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Trust Badges (Matching details exactly) */}
          <div className="border-t border-[#E6DED4]/60 mt-20 pt-12 max-w-[1000px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-[#E6DED4]/60">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-10 h-10 rounded-full bg-[#F5EFE7] flex items-center justify-center mb-3">
                  <Truck size={17} className="text-[#B58A5B]" />
                </div>
                <h4 className="font-serif text-[14px] font-normal text-[#1C1916]">
                  Complimentary Shipping
                </h4>
                <p className="text-[11.5px] text-[#8A857E] mt-1 font-light max-w-[180px]">
                  On all domestic orders
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 pt-8 md:pt-4">
                <div className="w-10 h-10 rounded-full bg-[#F5EFE7] flex items-center justify-center mb-3">
                  <RotateCcw size={17} className="text-[#B58A5B]" />
                </div>
                <h4 className="font-serif text-[14px] font-normal text-[#1C1916]">
                  Easy Returns
                </h4>
                <p className="text-[11.5px] text-[#8A857E] mt-1 font-light max-w-[180px]">
                  Within 7 days of delivery
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 pt-8 md:pt-4">
                <div className="w-10 h-10 rounded-full bg-[#F5EFE7] flex items-center justify-center mb-3">
                  <Lock size={17} className="text-[#B58A5B]" />
                </div>
                <h4 className="font-serif text-[14px] font-normal text-[#1C1916]">
                  Secure Payments
                </h4>
                <p className="text-[11.5px] text-[#8A857E] mt-1 font-light max-w-[180px]">
                  100% protected checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Standard Site Footer */}
      <SiteFooter />

      {/* Checkout Dialog Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div
            onClick={() => setShowCheckoutModal(false)}
            className="fixed inset-0 bg-[#1C1916]/45 backdrop-blur-[4px] cursor-pointer"
          />

          {/* Modal content */}
          <div className="relative z-10 w-full max-w-[500px] max-h-[90vh] overflow-y-auto bg-[#FAF8F5] border border-[#E6DED4] rounded-lg shadow-2xl p-5 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute right-4 top-4 text-[#8A857E] hover:text-[#1C1916] cursor-pointer text-xl font-light p-1"
            >
              ✕
            </button>

            {checkoutStep === 1 && (
              <form onSubmit={handleCheckoutSubmit}>
                <h3 className="font-serif text-[22px] font-normal tracking-wide text-[#1C1916] mb-2 flex items-center gap-2">
                  <CreditCard className="text-[#B58A5B]" size={20} /> Heritage
                  Checkout
                </h3>
                <p className="font-sans text-[12.5px] text-[#8A857E] mb-6 font-light">
                  Select a saved shipping address to complete the order.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={checkoutForm.email}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="e.g. customer@luxury.com"
                      className="w-full p-3 bg-white border border-[#E6DED4] rounded-[2px] font-sans text-[12.5px] placeholder:text-[#8A857E]/50 focus:outline-none focus:border-[#B58A5B]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
                        Shipping Address *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCheckoutModal(false);
                          navigate("/my-account/addresses/new?returnTo=checkout");
                        }}
                        className="text-[10px] font-semibold uppercase tracking-wider text-[#B58A5B] hover:text-[#1C1916] cursor-pointer"
                      >
                        Add Address
                      </button>
                    </div>

                    {user?.addresses?.length ? (
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {user.addresses.map((addr) => (
                          <label
                            key={addr._id}
                            className={`block cursor-pointer rounded-[4px] border p-3 bg-white ${
                              selectedAddressId === addr._id
                                ? "border-[#B58A5B]"
                                : "border-[#E6DED4]"
                            }`}
                          >
                            <div className="flex gap-3">
                              <input
                                type="radio"
                                name="shippingAddress"
                                checked={selectedAddressId === addr._id}
                                onChange={() => handleAddressChange(addr._id)}
                                className="mt-1"
                              />
                              <div className="min-w-0 text-[12.5px] text-[#3D3833] leading-relaxed">
                                <p className="font-medium text-[#1C1916]">
                                  {addr.recipientName || addr.name}
                                  {addr.isDefault && (
                                    <span className="ml-2 text-[10px] uppercase tracking-wider text-[#B58A5B]">
                                      Default
                                    </span>
                                  )}
                                </p>
                                <p>{addr.addressLine1 || addr.addressLine}</p>
                                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                                <p>
                                  {addr.city}, {addr.state} {addr.postalCode}
                                </p>
                                <p>{addr.country}</p>
                                <p>{addr.phone}</p>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[4px] border border-[#E6DED4] bg-white p-4 text-[12.5px] text-[#8A857E]">
                        No saved addresses yet. Add an address to continue checkout.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#E6DED4]/60 pt-4 mt-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560] mb-1.5">
                      Card Details (Simulated Test Card)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={checkoutForm.cardNumber}
                      className="w-full p-3 bg-[#FAF8F5] border border-[#E6DED4] rounded-[2px] font-sans text-[12.5px] text-[#8A857E] cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 bg-[#1C1916] text-white py-4 font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] rounded-[2px] hover:bg-[#B58A5B] transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  Pay Now (
                  {formatPrice(
                    totals.subtotal +
                      (totals.shipping > 0 ? totals.shipping : 0),
                  )}
                  )
                </button>
              </form>
            )}

            {checkoutStep === 2 && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 border-3 border-[#B58A5B] border-t-transparent rounded-full animate-spin mb-6" />
                <h3 className="font-serif text-[19px] text-[#1C1916] mb-2">
                  Authenticating Transaction
                </h3>
                <p className="font-sans text-[13px] text-[#8A857E] font-light max-w-[280px] leading-relaxed">
                  Connecting to secure payment gateway. Please do not close this
                  window.
                </p>
              </div>
            )}

            {checkoutStep === 3 && (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#2E7D32]/8 flex items-center justify-center text-[#2E7D32] mb-6 animate-bounce">
                  <Check size={32} strokeWidth={2} />
                </div>
                <h3 className="font-serif text-[24px] text-[#1C1916] mb-3">
                  Order Confirmed
                </h3>
                <p className="font-sans text-[13.5px] text-[#8A857E] font-light max-w-[320px] leading-relaxed mb-8">
                  Thank you for your purchase. We have received your order and
                  are preparing your luxury packaging. A confirmation email has
                  been sent.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowCheckoutModal(false);
                      navigate("/my-account/orders");
                    }}
                    className="bg-[#1C1916] hover:bg-[#B58A5B] text-white px-7 py-3.5 text-[10px] font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors cursor-pointer"
                  >
                    View My Orders
                  </button>
                  <button
                    onClick={() => {
                      setShowCheckoutModal(false);
                      navigate("/collections");
                    }}
                    className="border border-[#1C1916] text-[#1C1916] hover:bg-[#1C1916] hover:text-white px-7 py-3.5 text-[10px] font-semibold tracking-[0.2em] uppercase rounded-[2px] transition-colors cursor-pointer"
                  >
                    Return to Store
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Remove Confirmation Modal */}
      {confirmModalItem && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(28, 25, 22, 0.45)', backdropFilter: 'blur(4px)'
        }}>
          <div className="bg-[#FAF8F5] border border-[#E6DED4] p-6 sm:p-8 max-w-[400px] w-full mx-4 rounded-[4px] shadow-2xl relative text-left">
            <button
              onClick={() => setConfirmModalItem(null)}
              className="absolute top-4 right-4 text-[#1C1916]/50 hover:text-[#1C1916] transition-colors p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <h3 className="font-serif text-[18px] text-[#1C1916] mb-3">
              Remove Item?
            </h3>
            <p className="font-sans text-[13px] text-[#6B6560] font-light leading-relaxed mb-6">
              Would you like to move <strong>{confirmModalItem.name}</strong> to your Wishlist, or remove it from the cart completely?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => executeMoveToWishlist(confirmModalItem)}
                className="w-full bg-[#1C1916] text-white py-3 font-sans text-[10px] font-semibold uppercase tracking-wider hover:bg-[#B58A5B] transition-colors duration-300 rounded-[1px] cursor-pointer"
              >
                Move to Wishlist
              </button>
              <button
                onClick={() => executeRemove(confirmModalItem.key)}
                className="w-full border border-[#C94C4C] text-[#C94C4C] hover:bg-[#C94C4C] hover:text-white py-3 font-sans text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 rounded-[1px] cursor-pointer"
              >
                Remove from Cart
              </button>
              <button
                onClick={() => setConfirmModalItem(null)}
                className="w-full border border-[#ECE7E1] text-[#6B6560] hover:text-[#1C1916] py-3 font-sans text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 rounded-[1px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
