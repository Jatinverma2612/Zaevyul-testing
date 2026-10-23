import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Package,
  Settings,
  Truck,
  Box,
  Check,
  MapPin,
  Copy,
  Search,
  Download,
  RotateCw,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { customerApi } from "../../../lib/customerApi";
import { useToast } from "../../../context/ToastContext";
import { useCurrency } from "../../../context/CurrencyContext";

// Ordered journey steps. Backends that don't track "out for delivery"
// separately will just show it completed at the same time as "shipped".
const JOURNEY_STEPS = [
  { key: "placed", label: "Placed", icon: Package },
  { key: "processing", label: "Processing", icon: Settings },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "outForDelivery", label: "Out for Delivery", icon: Box },
  { key: "delivered", label: "Delivered", icon: Check },
];

// Maps a raw order status onto how many journey steps are "complete".
const stepIndexForStatus = (status) => {
  switch (status) {
    case "pending":
      return 0;
    case "processing":
    case "packed":
      return 1;
    case "shipped":
      return 3; // shipped + out-for-delivery both read as reached
    case "delivered":
      return 4;
    default:
      return 0;
  }
};

const fmtDate = (d, withTime = false) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
      })
    : "—";

export default function OrderDetailPage({ orderId } = {}) {
  const { id: paramId } = useParams();
  const id = orderId ?? paramId;
  const navigate = useNavigate();
  const toast = useToast();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!order?._id) return;
    setDownloadingInvoice(true);
    try {
      const invName = order.invoice?.invoiceNumber || `invoice-${order.orderNumber}`;
      await customerApi.orders.downloadInvoice(order._id, `${invName}.pdf`);
    } catch (err) {
      toast(err.message || "Could not download invoice", "error");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await customerApi.orders.getById(id);
        if (!cancelled) setOrder(res.order || res);
      } catch (err) {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCopyTracking = async () => {
    if (!order?.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
      toast("Tracking number copied", "success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Could not copy tracking number", "error");
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs flex flex-col items-center justify-center py-24">
        <RefreshCw size={24} className="animate-spin text-[#B58A5B] mb-3" />
        <span className="font-sans text-xs text-[#8A857E]">
          Loading order details...
        </span>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs flex flex-col items-center justify-center py-24 text-center">
        <p className="font-serif text-[17px] text-[#1C1916] mb-2">
          Order not found
        </p>
        <p className="font-sans text-[12.5px] text-[#8A857E] mb-6">
          This order may have been removed, or the link is incorrect.
        </p>
        <Link
          to="/my-account/orders"
          className="text-[10.5px] font-semibold tracking-[0.15em] uppercase text-[#1C1916] hover:text-[#B58A5B] transition-colors"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const isCancelled =
    order.status === "cancelled" || order.status === "refunded";
  const currentStep = stepIndexForStatus(order.status);
  const addr = order.shippingAddress || {};
  const items = order.items || [];
  const itemCount = items.length;

  const subtotal =
    order.subtotal ??
    items.reduce((sum, it) => sum + (it.price || 0) * (it.qty || 1), 0);
  const discount = order.discount || 0;
  const shipping = order.shipping || 0;
  const tax = order.tax || 0;
  const total = order.total ?? subtotal - discount + shipping + tax;

  const STATUS_BADGE = {
    delivered: "text-[#2E7D32] bg-[#2E7D32]/8 border-[#2E7D32]/20",
    shipped: "text-[#2A5A8C] bg-[#2A5A8C]/8 border-[#2A5A8C]/20",
    processing: "text-[#9A6B23] bg-[#9A6B23]/8 border-[#9A6B23]/20",
    packed: "text-[#9A6B23] bg-[#9A6B23]/8 border-[#9A6B23]/20",
    pending: "text-[#9A6B23] bg-[#9A6B23]/8 border-[#9A6B23]/20",
    cancelled: "text-[#C94C4C] bg-[#C94C4C]/8 border-[#C94C4C]/20",
    refunded: "text-[#C94C4C] bg-[#C94C4C]/8 border-[#C94C4C]/20",
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 font-sans text-[11px] text-[#8A857E]">
        <Link to="/" className="hover:text-[#1C1916] transition-colors">
          Home
        </Link>
        <ChevronRight size={11} />
        <Link
          to="/my-account"
          className="hover:text-[#1C1916] transition-colors"
        >
          My Account
        </Link>
        <ChevronRight size={11} />
        <Link
          to="/my-account/orders"
          className="hover:text-[#1C1916] transition-colors"
        >
          Orders
        </Link>
        <ChevronRight size={11} />
        <span className="text-[#3D3833]">{order.orderNumber}</span>
      </div>

      {/* Title + status */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] sm:text-[32px] font-normal text-[#1C1916]">
            Order {order.orderNumber}
          </h1>
          <p className="font-sans text-[12px] text-[#8A857E] mt-1.5">
            Placed on {fmtDate(order.createdAt, true)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={downloadingInvoice}
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] border border-[#E6DED4] bg-white text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1C1916] hover:bg-[#FAF8F5] hover:border-[#B58A5B] hover:text-[#B58A5B] transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {downloadingInvoice ? (
              <>
                <RefreshCw size={13} className="animate-spin" /> DOWNLOADING...
              </>
            ) : (
              <>
                <Download size={13} /> DOWNLOAD INVOICE
              </>
            )}
          </button>
          <div
            className={`rounded-[4px] border px-4 py-2.5 text-right ${STATUS_BADGE[order.status] || "text-[#6B6560] bg-[#6B6560]/8 border-[#6B6560]/20"}`}
          >
            <span className="flex items-center gap-1.5 justify-end text-[13px] font-semibold capitalize">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {order.status}
            </span>
            {order.deliveredAt && (
              <p className="text-[10.5px] mt-0.5 opacity-80">
                Delivered on {fmtDate(order.deliveredAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Order Journey */}
      {!isCancelled && (
        <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
          <h3 className="font-serif text-[16px] text-[#1C1916] mb-8">
            Order Journey
          </h3>
          <div className="flex items-start">
            {JOURNEY_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isDone = i <= currentStep;
              const isLast = i === JOURNEY_STEPS.length - 1;
              return (
                <div
                  key={step.key}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center gap-2.5 min-w-[70px]">
                    <div
                      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                        isDone
                          ? "bg-[#B58A5B] border-[#B58A5B] text-white"
                          : "bg-white border-[#E6DED4] text-[#B0A99D]"
                      }`}
                    >
                      <Icon size={15} strokeWidth={1.8} />
                    </div>
                    <div className="text-center">
                      <p
                        className={`font-sans text-[11px] font-semibold ${
                          isDone ? "text-[#1C1916]" : "text-[#B0A99D]"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="font-sans text-[10px] text-[#8A857E] mt-0.5">
                        {i <= currentStep ? fmtDate(order.createdAt) : "—"}
                      </p>
                    </div>
                  </div>
                  {!isLast && (
                    <div
                      className={`h-px flex-1 mt-[-30px] ${
                        i < currentStep ? "bg-[#B58A5B]" : "bg-[#E6DED4]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-[#C94C4C]/5 border border-[#C94C4C]/20 rounded-[4px] p-5 text-[12.5px] text-[#C94C4C] font-medium">
          This order was {order.status}. {order.cancelledReason || ""}
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
        <h3 className="font-serif text-[16px] text-[#1C1916] mb-5">
          Order Items
        </h3>
        <div className="divide-y divide-[#ECE4D8]/60">
          {items.map((item, idx) => {
            const getItemImage = (i) => {
              if (!i) return "/storefront/prod-1.png";
              const prod = i.product;
              let url =
                i.image ||
                i.img ||
                i.imageVal ||
                (typeof prod === "object" ? prod?.img || prod?.image : null);

              if (!url && typeof prod === "object" && prod?.images) {
                if (Array.isArray(prod.images) && prod.images.length > 0) {
                  const first = prod.images[0];
                  url = typeof first === "string" ? first : first?.url || first?.src;
                }
              }

              if (url && typeof url === "string" && url.trim() !== "" && !url.includes("undefined")) {
                return url;
              }
              return "/storefront/prod-1.png";
            };

            const img = getItemImage(item);

            return (
              <div
                key={idx}
                className="py-4 first:pt-0 last:pb-0 flex items-center gap-4"
              >
                <img
                  src={img}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.src = "/storefront/prod-1.png";
                  }}
                  className="w-16 h-[76px] object-cover rounded-[3px] bg-[#EFE9E1] shrink-0 border border-[#E6DED4]/60"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-[14px] text-[#1C1916]">
                    {item.name}
                  </h4>
                  {item.sku && (
                    <p className="font-sans text-[10.5px] text-[#8A857E] mt-1">
                      SKU: {item.sku}
                    </p>
                  )}
                  <p className="font-sans text-[11.5px] text-[#8A857E] mt-1">
                    {item.size && <>Size: {item.size}  •  </>}
                    {item.color && <>Color: {item.color}  •  </>}
                    {item.qty && <>Qty: {item.qty}</>}
                  </p>
                </div>
                <span className="font-sans text-[13.5px] font-semibold text-[#1C1916] whitespace-nowrap">
                  {formatPrice((item.price || 0) * (item.qty || 1))}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary + Shipping Address */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
          <h3 className="font-serif text-[16px] text-[#1C1916] mb-5">
            Order Summary
          </h3>
          <div className="space-y-3 font-sans text-[12.5px] text-[#6B6560]">
            <div className="flex justify-between">
              <span>Subtotal ({itemCount} items)</span>
              <span className="text-[#1C1916] font-medium">
                {formatPrice(subtotal)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#2E7D32]">
                <span>Discount</span>
                <span className="font-medium">−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-[#1C1916]">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes</span>
              <span className="text-[#1C1916]">{formatPrice(tax)}</span>
            </div>
          </div>
          <div className="border-t border-[#E6DED4]/60 mt-4 pt-4 flex items-baseline justify-between">
            <span className="font-sans text-[13px] font-semibold text-[#1C1916]">
              Total
            </span>
            <span className="font-serif text-[19px] font-semibold text-[#1C1916]">
              {formatPrice(total)}
            </span>
          </div>
          {order.paymentMethod && (
            <p className="font-sans text-[11px] text-[#8A857E] mt-2">
              Paid via {order.paymentMethod}
              {order.cardLast4 ? ` **** ${order.cardLast4}` : ""}
            </p>
          )}
        </div>

        <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
          <h3 className="font-serif text-[16px] text-[#1C1916] mb-5">
            Shipping Address
          </h3>
          <div className="font-sans text-[12.5px] text-[#3D3833] leading-relaxed space-y-0.5">
            <p className="font-semibold text-[#1C1916]">
              {addr.recipientName || addr.name || "—"}
            </p>
            {addr.addressLine1 && <p>{addr.addressLine1}</p>}
            {addr.addressLine2 && <p>{addr.addressLine2}</p>}
            <p>
              {[addr.city, addr.state].filter(Boolean).join(", ")}{" "}
              {addr.postalCode}
            </p>
            {addr.country && <p>{addr.country}</p>}
            {addr.phone && <p>{addr.phone}</p>}
          </div>
          {addr.mapUrl && (
            <a
              href={addr.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-4 border border-[#E6DED4] rounded-[3px] px-3.5 py-2 text-[11px] font-semibold text-[#3D3833] hover:border-[#B58A5B] hover:text-[#1C1916] transition-colors"
            >
              <MapPin size={13} /> View on Map
            </a>
          )}
        </div>
      </div>

      {/* Order Information + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
          <h3 className="font-serif text-[16px] text-[#1C1916] mb-5">
            Order Information
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 font-sans text-[12px]">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8A857E] mb-1">
                Order Number
              </p>
              <p className="text-[#1C1916] font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8A857E] mb-1">
                Payment Method
              </p>
              <p className="text-[#1C1916] font-medium">
                {order.paymentMethod || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8A857E] mb-1">
                Order Date
              </p>
              <p className="text-[#1C1916] font-medium">
                {fmtDate(order.createdAt, true)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8A857E] mb-1">
                Shipping Method
              </p>
              <p className="text-[#1C1916] font-medium">
                {order.shippingMethod ||
                  (shipping === 0
                    ? "Standard Shipping (Free)"
                    : "Standard Shipping")}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8A857E] mb-1">
                Payment Status
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#2E7D32]/8 border border-[#2E7D32]/20 text-[#2E7D32] text-[10.5px] font-semibold">
                {order.paymentStatus || (isCancelled ? "Refunded" : "Paid")}
              </span>
            </div>
            {order.trackingNumber && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#8A857E] mb-1">
                  Tracking Number
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[#1C1916] font-medium">
                    {order.trackingNumber}
                  </p>
                  <button
                    onClick={handleCopyTracking}
                    title="Copy tracking number"
                    className="text-[#8A857E] hover:text-[#1C1916] transition-colors cursor-pointer"
                  >
                    <Copy size={12} />
                  </button>
                  {copied && (
                    <span className="text-[10px] text-[#2E7D32]">Copied</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
          <h3 className="font-serif text-[16px] text-[#1C1916] mb-5">
            Actions
          </h3>
          <div className="divide-y divide-[#ECE4D8]/60">
            <button
              onClick={() =>
                order.trackingNumber
                  ? toast(`Tracking ${order.trackingNumber}`, "info")
                  : toast("Tracking not available yet", "info")
              }
              className="w-full flex items-center justify-between py-3 first:pt-0 text-[12.5px] font-medium text-[#3D3833] hover:text-[#1C1916] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Search size={14} className="text-[#8A857E]" />
                Track Your Order
              </span>
              <ChevronRight size={13} className="text-[#8A857E]" />
            </button>
            <button
              onClick={handleDownloadInvoice}
              className="w-full flex items-center justify-between py-3 text-[12.5px] font-medium text-[#3D3833] hover:text-[#1C1916] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Download size={14} className="text-[#8A857E]" />
                Download Invoice
              </span>
              <ChevronRight size={13} className="text-[#8A857E]" />
            </button>
            <button
              onClick={() => navigate(`/my-account/orders/${id}/return`)}
              disabled={order.status !== "delivered"}
              className="w-full flex items-center justify-between py-3 text-[12.5px] font-medium text-[#3D3833] hover:text-[#1C1916] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#3D3833]"
            >
              <span className="flex items-center gap-3">
                <RotateCw size={14} className="text-[#8A857E]" />
                Return or Exchange Items
              </span>
              <ChevronRight size={13} className="text-[#8A857E]" />
            </button>
            <Link
              to="/contact"
              className="w-full flex items-center justify-between py-3 last:pb-0 text-[12.5px] font-medium text-[#3D3833] hover:text-[#1C1916] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <HelpCircle size={14} className="text-[#8A857E]" />
                Need Help?
              </span>
              <ChevronRight size={13} className="text-[#8A857E]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
