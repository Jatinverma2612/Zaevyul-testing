import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Mail,
  ArrowRight,
  Package,
  ShoppingBag,
  Eye,
  Download,
  RotateCcw,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { customerApi } from "../../../lib/customerApi";

const TABS = [
  { key: "all", label: "All Orders" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
];

const SORT_OPTIONS = [
  { key: "latest", label: "Latest" },
  { key: "oldest", label: "Oldest" },
  { key: "amount-high", label: "Amount: High to Low" },
  { key: "amount-low", label: "Amount: Low to High" },
];

// Maps raw backend statuses onto the tab buckets above.
const tabForStatus = (status) => {
  switch (status) {
    case "delivered":
      return "delivered";
    case "shipped":
      return "shipped";
    case "processing":
    case "packed":
    case "pending":
      return "processing";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "returned";
    default:
      return "processing";
  }
};

const STATUS_STYLES = {
  delivered: "text-[#2E7D32] bg-[#2E7D32]/8 border-[#2E7D32]/20",
  shipped: "text-[#2A5A8C] bg-[#2A5A8C]/8 border-[#2A5A8C]/20",
  processing: "text-[#9A6B23] bg-[#9A6B23]/8 border-[#9A6B23]/20",
  packed: "text-[#9A6B23] bg-[#9A6B23]/8 border-[#9A6B23]/20",
  pending: "text-[#9A6B23] bg-[#9A6B23]/8 border-[#9A6B23]/20",
  cancelled: "text-[#6B6560] bg-[#6B6560]/8 border-[#6B6560]/20",
  refunded: "text-[#6B6560] bg-[#6B6560]/8 border-[#6B6560]/20",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchOrders = async () => {
      try {
        const res = await customerApi.orders.getAll();
        if (!cancelled) setOrders(res.orders || []);
      } catch (err) {
        console.error("Failed to load customer orders:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this pending order?"))
      return;
    try {
      await customerApi.orders.cancel(orderId);
      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === orderId ? { ...o, status: "cancelled" } : o,
        ),
      );
    } catch (err) {
      alert(err.message || "Failed to cancel order.");
    }
  };

  const visibleOrders = useMemo(() => {
    let list = orders;
    if (activeTab !== "all") {
      list = list.filter((o) => tabForStatus(o.status) === activeTab);
    }
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "amount-high":
          return b.total - a.total;
        case "amount-low":
          return a.total - b.total;
        case "latest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return list;
  }, [orders, activeTab, sortBy]);

  if (loading) {
    return (
      <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs flex flex-col items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-[#B58A5B] mb-3" />
        <span className="font-sans text-xs text-[#8A857E]">
          Loading your orders...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] shadow-xs overflow-hidden">
      {/* Header row: tabs + sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-8">
        <h3 className="font-serif text-[18px] font-normal tracking-wide text-[#1C1916] flex items-center gap-2.5">
          <Sparkles size={16} className="text-[#B58A5B]" /> My Orders
        </h3>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            onBlur={() => setTimeout(() => setSortOpen(false), 150)}
            className="flex items-center gap-2 border border-[#E6DED4] rounded-full px-4 py-1.5 text-[11px] font-medium text-[#3D3833] hover:border-[#B58A5B] transition-colors cursor-pointer"
          >
            Sort by:{" "}
            <span className="text-[#1C1916] font-semibold">
              {SORT_OPTIONS.find((s) => s.key === sortBy)?.label}
            </span>
            <ChevronDown size={12} className="text-[#8A857E]" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 mt-1.5 w-[190px] bg-white border border-[#E6DED4] rounded-[4px] shadow-lg z-10 py-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onMouseDown={() => setSortBy(opt.key)}
                  className={`w-full text-left px-3.5 py-2 text-[11.5px] hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                    sortBy === opt.key
                      ? "text-[#B58A5B] font-semibold"
                      : "text-[#3D3833]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 px-6 sm:px-8 mt-5 border-b border-[#E6DED4]/60 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative pb-3 text-[11.5px] font-semibold tracking-wide whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === tab.key
                ? "text-[#1C1916]"
                : "text-[#8A857E] hover:text-[#1C1916]"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#B58A5B] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {visibleOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-12 h-12 rounded-full bg-[#FBF9F6] border border-[#E6DED4]/40 flex items-center justify-center text-[#8A857E] mb-4">
            <Mail size={18} strokeWidth={1.5} />
          </div>
          <p className="font-serif text-[15px] font-light text-[#1C1916] mb-1">
            {activeTab === "all"
              ? "You have no orders yet."
              : "No orders in this category."}
          </p>
          <p className="font-sans text-[12.5px] text-[#8A857E] font-light mb-5">
            Explore our handwoven, curated heritage pieces.
          </p>
          <Link
            to="/collections"
            className="group inline-flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#1C1916] hover:text-[#B58A5B] transition-colors duration-200 cursor-pointer"
          >
            Explore Collection{" "}
            <ArrowRight
              size={12}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-left">
                <th className="px-6 sm:px-8 py-3 font-sans text-[9px] font-semibold tracking-wider uppercase text-[#8A857E] whitespace-nowrap">
                  Order
                </th>
                <th className="px-4 py-3 font-sans text-[9px] font-semibold tracking-wider uppercase text-[#8A857E] whitespace-nowrap">
                  Date
                </th>
                <th className="px-4 py-3 font-sans text-[9px] font-semibold tracking-wider uppercase text-[#8A857E] whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 font-sans text-[9px] font-semibold tracking-wider uppercase text-[#8A857E] whitespace-nowrap">
                  Total
                </th>
                <th className="px-6 sm:px-8 py-3 font-sans text-[9px] font-semibold tracking-wider uppercase text-[#8A857E] text-right whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE4D8]/60">
              {visibleOrders.map((order) => {
                const id = order._id || order.id;
                const itemCount = order.items?.length || 0;
                const canCancel = order.status === "pending";
                const canDownload = order.status !== "cancelled" && order.status !== "refunded";

                return (
                  <tr
                    key={id}
                    className="hover:bg-[#FAF8F5]/60 transition-colors"
                  >
                    <td className="px-6 sm:px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F5EFE7] flex items-center justify-center text-[#B58A5B] shrink-0">
                          <ShoppingBag size={13} strokeWidth={1.6} />
                        </div>
                        <div>
                          <div className="font-sans text-[12.5px] font-semibold text-[#1C1916]">
                            {order.orderNumber}
                          </div>
                          <div className="font-sans text-[10.5px] text-[#8A857E]">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-sans text-[12px] text-[#3D3833] whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10.5px] font-medium capitalize whitespace-nowrap ${
                          STATUS_STYLES[order.status] ||
                          "text-[#6B6560] bg-[#6B6560]/8 border-[#6B6560]/20"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-sans text-[12.5px] font-semibold text-[#1C1916] whitespace-nowrap">
                      ₹{order.total.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 sm:px-8 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/my-account/orders/${id}`}
                          title="View order"
                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#6B6560] hover:text-[#1C1916] hover:bg-[#F0EAE0] transition-colors cursor-pointer"
                        >
                          <Eye size={14} strokeWidth={1.6} />
                        </Link>
                        <button
                          disabled={!canDownload}
                          title={
                            canDownload
                              ? "Download PDF Invoice"
                              : "Invoice unavailable for cancelled orders"
                          }
                          onClick={() => {
                            if (canDownload) {
                              const filename = `${order.invoice?.invoiceNumber || order.orderNumber}.pdf`;
                              customerApi.orders.downloadInvoice?.(id, filename).catch(() => {});
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#6B6560] hover:text-[#B58A5B] hover:bg-[#F0EAE0] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <Download size={14} strokeWidth={1.6} />
                        </button>
                        <button
                          disabled={!canCancel}
                          title={canCancel ? "Cancel order" : "Not cancellable"}
                          onClick={() => canCancel && handleCancelOrder(id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#6B6560] hover:text-[#C94C4C] hover:bg-[#C94C4C]/8 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#6B6560]"
                        >
                          <RotateCcw size={14} strokeWidth={1.6} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
