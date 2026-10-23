import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  FileText,
  X,
  ChevronRight
} from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import { useToast } from "../../context/ToastContext";
import { useCurrency } from "../../context/CurrencyContext";
import { customerApi } from "../../lib/customerApi";

const TIMELINE_STEPS = [
  { key: "pending", label: "Order Placed", desc: "We have received your order." },
  { key: "processing", label: "Confirmed & Prepared", desc: "Undergoing quality inspection in Kashmir." },
  { key: "shipped", label: "Shipped", desc: "In transit with express logistics partner." },
  { key: "out_for_delivery", label: "Out for Delivery", desc: "With local courier for final delivery." },
  { key: "delivered", label: "Delivered", desc: "Hand-delivered to recipient." }
];

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const initialOrderNo = searchParams.get("order") || "";
  const initialEmail = searchParams.get("email") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrderNo);
  const [emailOrPhone, setEmailOrPhone] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("Size / Fit issue");
  const [returnDetails, setReturnDetails] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const toast = useToast();
  const { formatPrice } = useCurrency();

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!orderNumber.trim()) {
      toast("Please enter your Order Number", "warning");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await customerApi.orders.get(orderNumber.trim());
      if (data && data.order) {
        setOrder(data.order);
        setError(null);
      } else {
        setError("No order found matching this order number. Please verify and try again.");
        setOrder(null);
      }
    } catch (err) {
      console.error("Track order error:", err);
      setError(err.message || "Failed to locate order. Please check order number.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNo) {
      handleSearch();
    }
  }, []);

  const getStepIndex = (status) => {
    switch (status) {
      case "pending": return 0;
      case "processing":
      case "packed": return 1;
      case "shipped": return 2;
      case "out_for_delivery": return 3;
      case "delivered": return 4;
      default: return 0;
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await customerApi.orders.cancel(order._id || order.id);
      toast("Order cancelled successfully", "success");
      handleSearch();
    } catch (err) {
      toast(err.message || "Failed to cancel order", "error");
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReturn(true);
    try {
      await customerApi.orders.requestReturn(order._id || order.id, {
        reason: returnReason,
        details: returnDetails
      });
      toast("Return request submitted successfully!", "success");
      setReturnModalOpen(false);
      handleSearch();
    } catch (err) {
      toast(err.message || "Failed to submit return request", "error");
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1916] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center max-w-[600px] mx-auto mb-10">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A5B] block mb-2">
            Guest Concierge
          </span>
          <h1 className="font-serif text-[32px] sm:text-[40px] font-light text-[#1C1916] mb-3">
            Track Your Order
          </h1>
          <p className="font-sans text-[13px] font-light text-[#6B6560] leading-relaxed">
            Enter your order number to inspect real-time preparation status, express delivery updates, and luxury care resources.
          </p>
        </div>

        {/* Search Form Card */}
        <div className="bg-white border border-[#E6DED4] p-6 sm:p-8 rounded-[2px] shadow-xs max-w-[680px] mx-auto mb-12">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1C1916] mb-1.5">
                  Order Number *
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. ZAE-2026-X8F9"
                  className="w-full border border-[#ECE7E1] bg-[#FAF8F5] p-3 text-[13px] text-[#1C1916] rounded-[1px] focus:border-[#1C1916] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1C1916] mb-1.5">
                  Email or Phone (Optional)
                </label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full border border-[#ECE7E1] bg-[#FAF8F5] p-3 text-[13px] text-[#1C1916] rounded-[1px] focus:border-[#1C1916] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1C1916] text-white py-3.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] rounded-[1px] hover:bg-[#B58A5B] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? "SEARCHING..." : "TRACK SHIPMENT"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-[#FDF2F2] border border-[#F8B4B4] rounded-[2px] text-[12.5px] text-[#C94C4C] flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Order Details & Timeline Display */}
        {order && (
          <div className="space-y-10 animate-fadeIn">
            {/* Summary & Actions Bar */}
            <div className="bg-[#FAF8F5] border border-[#E6DED4] p-6 sm:p-8 rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-serif text-[22px] font-medium text-[#1C1916]">{order.orderNumber}</h2>
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2E7D32] bg-[#EAF5EB] px-2.5 py-0.5 border border-[#C8E6C9] rounded-[2px]">
                    Status: {order.status}
                  </span>
                </div>
                <p className="font-sans text-[12px] text-[#6B6560] font-light">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} • Total: {formatPrice(order.total)}
                </p>
              </div>

              {/* Action Buttons (Cancel / Return) */}
              <div className="flex items-center gap-3">
                {order.status === "pending" && (
                  <button
                    onClick={handleCancelOrder}
                    className="px-4 py-2 border border-[#C94C4C] text-[#C94C4C] hover:bg-[#C94C4C] hover:text-white font-sans text-[10px] font-semibold uppercase tracking-[0.14em] rounded-[1px] transition-colors cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}

                {order.status === "delivered" && (
                  <button
                    onClick={() => setReturnModalOpen(true)}
                    className="px-4 py-2 border border-[#1C1916] text-[#1C1916] hover:bg-[#1C1916] hover:text-white font-sans text-[10px] font-semibold uppercase tracking-[0.14em] rounded-[1px] transition-colors cursor-pointer"
                  >
                    Request Return / Exchange
                  </button>
                )}

                {order.status === "return_requested" && (
                  <span className="font-sans text-[11px] text-[#B58A5B] font-semibold uppercase tracking-[0.1em] bg-[#F5EFE7] px-3 py-1 border border-[#E6DED4] rounded-[2px]">
                    Return Requested
                  </span>
                )}
              </div>
            </div>

            {/* Visual Stepper Timeline */}
            <div className="bg-white border border-[#E6DED4] p-6 sm:p-10 rounded-[2px]">
              <h3 className="font-serif text-[18px] font-normal text-[#1C1916] mb-8">Shipment Progress</h3>

              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
                {TIMELINE_STEPS.map((step, idx) => {
                  const currentIdx = getStepIndex(order.status);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={step.key} className="flex md:flex-col items-center md:text-center gap-4 md:gap-3 flex-1 relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors ${
                          isCompleted
                            ? "bg-[#1C1916] text-white"
                            : "bg-[#F5EFE7] text-[#8A857E] border border-[#E6DED4]"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={18} /> : idx + 1}
                      </div>
                      <div>
                        <h4 className={`font-sans text-[12px] uppercase tracking-wider font-semibold ${isCurrent ? "text-[#B58A5B]" : "text-[#1C1916]"}`}>
                          {step.label}
                        </h4>
                        <p className="font-sans text-[11px] text-[#8A857E] font-light max-w-[160px] leading-tight mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Product Items & Delivery Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 bg-white border border-[#E6DED4] p-6 sm:p-8 rounded-[2px]">
                <h3 className="font-serif text-[18px] font-normal text-[#1C1916] mb-6">Items in this Order</h3>
                <div className="divide-y divide-[#ECE7E1]">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-4 flex gap-4 items-center">
                      <img src={item.image || item.img} alt={item.name} className="w-16 h-20 object-cover rounded-[2px] border border-[#E6DED4]" />
                      <div className="flex-1">
                        <h4 className="font-serif text-[15px] text-[#1C1916]">{item.name}</h4>
                        <p className="font-sans text-[11.5px] text-[#8A857E] font-light">Size: {item.size || "Standard"} • Qty: {item.qty}</p>
                      </div>
                      <span className="font-sans text-[13px] font-medium text-[#1C1916]">{formatPrice(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-[#FAF8F5] border border-[#E6DED4] p-6 sm:p-8 rounded-[2px]">
                <h3 className="font-serif text-[18px] font-normal text-[#1C1916] mb-4">Delivery Address</h3>
                <div className="font-sans text-[12.5px] text-[#6B6560] font-light space-y-1">
                  <p className="font-medium text-[#1C1916]">{order.shippingAddress?.recipientName || order.customerName}</p>
                  <p>{order.shippingAddress?.line1}</p>
                  {order.shippingAddress?.line2 && <p>{order.shippingAddress?.line2}</p>}
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</p>
                  <p>{order.shippingAddress?.country}</p>
                  {order.shippingAddress?.phone && <p className="pt-2 text-[#8A857E]">Phone: {order.shippingAddress.phone}</p>}
                </div>
              </div>
            </div>

            {/* Post-Purchase Pashmina Luxury Care & Certificate Section */}
            <div className="bg-[#F5EFE7]/80 border border-[#E6DED4] p-6 sm:p-10 rounded-[2px]">
              <div className="max-w-[700px] mb-8">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B58A5B] block mb-1">
                  Luxury Preservation & Authenticity
                </span>
                <h3 className="font-serif text-[24px] font-light text-[#1C1916]">
                  Pashmina Care & Heritage Guide
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-[2px] border border-[#E6DED4]">
                  <ShieldCheck className="text-[#B58A5B] mb-3" size={24} />
                  <h4 className="font-serif text-[15px] font-medium text-[#1C1916] mb-1.5">Artisan Certificate</h4>
                  <p className="font-sans text-[12px] text-[#6B6560] font-light leading-relaxed">
                    Your piece includes an official Certificate of Kashmiri Craftsmanship authenticating hand-loomed Chanthangi fleece down.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-[2px] border border-[#E6DED4]">
                  <RotateCcw className="text-[#B58A5B] mb-3" size={24} />
                  <h4 className="font-serif text-[15px] font-medium text-[#1C1916] mb-1.5">Storage & Protection</h4>
                  <p className="font-sans text-[12px] text-[#6B6560] font-light leading-relaxed">
                    Store loosely folded in breathable cotton or muslin wrapping. Avoid plastic packaging and use cedar moth repellent.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-[2px] border border-[#E6DED4]">
                  <FileText className="text-[#B58A5B] mb-3" size={24} />
                  <h4 className="font-serif text-[15px] font-medium text-[#1C1916] mb-1.5">Cleaning Instructions</h4>
                  <p className="font-sans text-[12px] text-[#6B6560] font-light leading-relaxed">
                    Professional dry cleaning recommended. For spot cleaning, press lightly with lukewarm water and mild organic silk soap.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Return Request Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1916]/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#E6DED4] rounded-[2px] max-w-[500px] w-full p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setReturnModalOpen(false)}
              className="absolute top-5 right-5 text-[#1C1916]/60 hover:text-[#1C1916] p-1.5 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-serif text-[22px] font-light text-[#1C1916] mb-2">Request Return or Exchange</h3>
            <p className="font-sans text-[12px] font-light text-[#6B6560] mb-6">
              Our 7-day hassle-free return policy ensures complete satisfaction.
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1C1916] mb-1">
                  Reason for Return *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full border border-[#ECE7E1] bg-white p-3 text-[13px] text-[#1C1916] rounded-[1px] outline-none"
                >
                  <option value="Size / Fit issue">Size / Fit issue</option>
                  <option value="Color mismatch">Color mismatch</option>
                  <option value="Changed mind">Changed mind</option>
                  <option value="Defect or Damage">Defect or Damage</option>
                </select>
              </div>

              <div>
                <label className="block font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1C1916] mb-1">
                  Additional Details
                </label>
                <textarea
                  rows={3}
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  placeholder="Please specify any additional notes for doorstep pickup..."
                  className="w-full border border-[#ECE7E1] bg-white p-3 text-[13px] text-[#1C1916] rounded-[1px] outline-none"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-[#ECE7E1] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-5 py-2.5 border border-[#1C1916]/30 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1C1916] rounded-[1px] hover:bg-[#1C1916]/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="bg-[#1C1916] text-white px-7 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] rounded-[1px] hover:bg-[#B58A5B] cursor-pointer"
                >
                  {submittingReturn ? "Submitting..." : "Submit Return Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
