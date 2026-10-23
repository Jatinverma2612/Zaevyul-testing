import React from "react";
import { Tag, X, AlertCircle, ChevronRight, Gift } from "lucide-react";

export default function CouponPickerModal({
  coupons,
  loading,
  cartSubtotal,
  onPick,
  onClose,
  formatPrice,
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-md bg-[#FAF8F5] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6DED4]/60">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-[#B58A5B]" />
            <h3 className="font-serif text-[17px] text-[#1C1916]">Available Coupons</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E6DED4]/50 transition-colors cursor-pointer text-[#6B6560]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="py-10 flex flex-col items-center gap-3 text-[#8A857E]">
              <div className="w-8 h-8 border-2 border-[#B58A5B] border-t-transparent rounded-full animate-spin" />
              <p className="text-[12px] font-light">Loading coupons…</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-3 text-[#8A857E]">
              <AlertCircle size={28} className="text-[#E6DED4]" />
              <p className="text-[13px] font-light">No coupons available right now.</p>
            </div>
          ) : (
            coupons.map((coupon) => {
              const minAmt = coupon.minOrderValue ?? coupon.minOrderAmount ?? 0;
              const shortfall = minAmt - cartSubtotal;
              const eligible = shortfall <= 0;
              const discLabel =
                coupon.type === "percentage" || coupon.discountType === "percentage"
                  ? `${coupon.value ?? coupon.discountValue}% off`
                  : `₹${coupon.value ?? coupon.discountValue} flat off`;

              return (
                <div
                  key={coupon.code}
                  className={`relative border rounded-[6px] px-4 py-3.5 ${
                    eligible
                      ? "border-[#B58A5B]/40 bg-white"
                      : "border-[#E6DED4] bg-[#FDFBF8] opacity-80"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Code pill */}
                      <span className="inline-block font-mono font-bold text-[12px] tracking-widest bg-[#F5EFE7] text-[#B58A5B] border border-[#B58A5B]/30 rounded-[3px] px-2 py-0.5 mb-1.5">
                        {coupon.code}
                      </span>
                      <p className="font-sans text-[13px] font-medium text-[#1C1916]">{discLabel}</p>
                      {coupon.description && (
                        <p className="font-sans text-[11px] text-[#8A857E] font-light mt-0.5">{coupon.description}</p>
                      )}
                      {minAmt > 0 && (
                        <p className="font-sans text-[10.5px] text-[#8A857E] font-light mt-1">
                          Min. order: {formatPrice(minAmt)}
                        </p>
                      )}
                    </div>

                    {eligible ? (
                      <button
                        onClick={() => onPick(coupon.code)}
                        className="shrink-0 flex items-center gap-1 bg-[#1C1916] hover:bg-[#B58A5B] text-white text-[10px] font-semibold tracking-wider uppercase px-3 py-2 rounded-[3px] transition-colors cursor-pointer"
                      >
                        Apply <ChevronRight size={10} />
                      </button>
                    ) : (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#C4A882] bg-[#F5EFE7] px-3 py-2 rounded-[3px]">
                        Locked
                      </span>
                    )}
                  </div>

                  {/* Shortfall nudge */}
                  {!eligible && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-[#B58A5B] font-medium bg-[#FDF5EB] border border-[#E6DED4]/60 rounded-[3px] px-2.5 py-1.5">
                      <Gift size={11} />
                      Add items worth {formatPrice(shortfall)} more to avail {discLabel}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E6DED4]/60 text-center">
          <p className="text-[10.5px] text-[#8A857E] font-light">Only one coupon can be applied per order.</p>
        </div>
      </div>
    </div>
  );
}
