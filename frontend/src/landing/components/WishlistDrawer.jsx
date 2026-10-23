import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useFavorite } from "../../context/FavoritesContext";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";
import { getCategorySlug } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

export default function WishlistDrawer() {
  const { items, isOpen, setIsOpen, removeFavorites } = useFavorite();
  const { addToCart, setIsOpen: setCartOpen } = useCart();
  const { formatPrice } = useCurrency();
  const toast = useToast();

  const drawerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [removingIds, setRemovingIds] = useState([]);

  // Ensure only one drawer is open at a time — close cart drawer when wishlist opens
  useEffect(() => {
    if (isOpen) {
      setCartOpen(false);
    }
  }, [isOpen, setCartOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC key & click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    const handleOutsideClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, setIsOpen]);

  // Focus trapping
  useEffect(() => {
    if (!isOpen) return;
    const focusable = drawerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    first.focus();
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  const handleRemoveClick = async (productId) => {
    const idStr = String(productId);
    setRemovingIds((prev) => [...prev, idStr]);
    setTimeout(async () => {
      await removeFavorites(idStr);
      setRemovingIds((prev) => prev.filter((id) => id !== idStr));
    }, 300); // 300ms transition time
  };

  const handleMoveToCart = async (product) => {
    const id = product._id || product.id;
    // Map backend populated structure to local Cart item structure
    const imageVal =
      product.img ||
      (product.images && product.images[0]?.url) ||
      "/storefront/prod-1.png";

    const cartItem = {
      id: id,
      name: product.name,
      slug: product.slug,
      price: product.discountPrice || product.basePrice,
      image: imageVal,
      category: product.category,
      color: product.color || "",
      size: product.size || "",
      stockQuantity: product.quantity || 99,
      quantity: 1,
    };

    // Add to cart with openDrawer = false so Cart Drawer stays closed
    addToCart(cartItem, 1, "", "", false);

    // Remove from wishlist with dynamic slide out animation
    const idStr = String(id);
    setRemovingIds((prev) => [...prev, idStr]);
    setTimeout(async () => {
      await removeFavorites(idStr);
      setRemovingIds((prev) => prev.filter((i) => i !== idStr));
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-[visibility] duration-[350ms] ${isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"}`}
    >
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-[#1C1916]/30 backdrop-blur-[3px] transition-opacity duration-[350ms] ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className={`relative z-10 flex h-full w-full flex-col bg-[#FAF8F5] border-l border-[#ECE7E1] shadow-2xl transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] sm:max-w-[420px] lg:max-w-[480px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist Drawer"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-[#ECE7E1] bg-[#FAF8F5] px-6 sm:px-8">
          <h2 className="font-serif text-[18px] uppercase tracking-[0.2em] text-[#1C1916]">
            Favorites / Wishlist ({items.length})
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close wishlist"
            className="text-[#1C1916]/70 transition-colors hover:text-[#1C1916] p-1 -mr-1"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </header>

        {/* Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 space-y-8"
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5EFE7] text-[#B58A5B]">
                <Heart size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-[18px] font-light text-[#1C1916] mb-2.5">
                Your wishlist is empty
              </h3>
              <p className="font-sans text-[13px] text-[#8A857E] font-light mb-8 max-w-[280px] leading-relaxed">
                Save pashmina pieces to your favorites to keep track of what you
                love.
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="border border-[#1C1916] text-[#1C1916] hover:bg-[#1C1916] hover:text-white transition-colors duration-300 px-5 py-3 sm:px-8 text-[10px] font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase rounded-[1px]"
              >
                Explore Collections
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#ECE7E1] -my-4">
              {items.map((item) => {
                const idStr = String(item._id || item.id);
                const isRemoving = removingIds.includes(idStr);
                const imageVal =
                  item.img ||
                  (item.images && item.images[0]?.url) ||
                  "/storefront/prod-1.png";

                const detailSlug =
                  item.slug ||
                  (item.name || "")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");

                return (
                  <div
                    key={idStr}
                    className={`flex gap-4.5 py-6 transition-all duration-300 ease-in-out ${
                      isRemoving
                        ? "opacity-0 translate-x-8 max-h-0 py-0 overflow-hidden"
                        : ""
                    }`}
                  >
                    {/* Image */}
                    <Link
                      to={`/collection/${getCategorySlug(item.category)}/${detailSlug}`}
                      onClick={() => setIsOpen(false)}
                      className="relative aspect-[4/5] w-[84px] shrink-0 overflow-hidden rounded-[2px] bg-[#EFE9E1]"
                    >
                      <img
                        src={imageVal}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            to={`/collection/${getCategorySlug(item.category)}/${detailSlug}`}
                            onClick={() => setIsOpen(false)}
                            className="font-serif text-[14.5px] font-normal leading-snug text-[#1C1916] hover:text-[#B58A5B] transition-colors"
                          >
                            {item.name}
                          </Link>
                          <span className="font-sans text-[13.5px] font-normal text-[#1C1916] whitespace-nowrap">
                            {formatPrice(item.discountPrice || item.basePrice)}
                          </span>
                        </div>

                        {/* Live Stock Availability Badge */}
                        <div className="mt-1 font-sans text-[10.5px]">
                          {typeof item.quantity !== "undefined" && item.quantity <= 0 ? (
                            <span className="text-[#C94C4C] font-semibold uppercase tracking-wider">Out of Stock</span>
                          ) : typeof item.quantity !== "undefined" && item.quantity <= 3 ? (
                            <span className="text-[#B58A5B] font-medium">Only {item.quantity} left</span>
                          ) : (
                            <span className="text-[#2E7D32] font-medium">In Stock</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          disabled={typeof item.quantity !== "undefined" && item.quantity <= 0}
                          onClick={() => handleMoveToCart(item)}
                          className="text-[#1C1916] text-[10.5px] font-semibold uppercase tracking-[0.14em] hover:text-[#B58A5B] transition-colors border-b border-[#1C1916] hover:border-[#B58A5B] pb-0.5 cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ShoppingBag size={12} />{" "}
                          {typeof item.quantity !== "undefined" && item.quantity <= 0 ? "Out of Stock" : "Move to Bag"}
                        </button>

                        <button
                          onClick={() => handleRemoveClick(idStr)}
                          className="text-[#8A857E] hover:text-[#C94C4C] transition-colors p-1"
                          title="Remove from favorites"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
