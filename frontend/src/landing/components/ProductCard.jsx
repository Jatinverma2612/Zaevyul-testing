import React, { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Plus, Heart, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { getCategorySlug, getHoverImage } from "../../lib/api";
import { useCart } from "../../context/CartContext";
import { useFavorite } from "../../context/FavoritesContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useCurrency } from "../../context/CurrencyContext";

const getProductWeave = (p) => p.weave || p.material || "Diamond";
const getProductTime = (p) => p.time || "120 Hrs";
const getGalleryImages = (product) => {
  if (!product) return ["/storefront/prod-1.png"];
  const list = [];

  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach((imgObj) => {
      const url = typeof imgObj === "string" ? imgObj : imgObj?.url;
      if (url && !list.includes(url)) list.push(url);
    });
  }

  if (product.img && !list.includes(product.img)) {
    list.unshift(product.img);
  }

  const hover = product.hoverImg || getHoverImage(product);
  if (hover && !list.includes(hover)) {
    list.push(hover);
  }

  if (list.length === 0) list.push("/storefront/prod-1.png");
  return list;
};

export default function ProductCard({
  p,
  viewMode = "grid",
  className = "",
  imageRef,
  showMeta = false,
  showAddButton = true,
  onClick,
}) {
  const { addToCart, isInCart, setIsOpen } = useCart();
  const { toggleFavorites, isFavorite } = useFavorite();
  const { isAuthenticated } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatPrice } = useCurrency();

  const getProductPrice = (prod) => {
    return formatPrice(prod.discountPrice || prod.basePrice);
  };

  const productId = p._id || p.id;
  const favorite = isFavorite(productId);
  const inCart = isInCart(productId);

  const catSlug = p.categorySlug || getCategorySlug(p.category);
  const detailPath = `/collection/${catSlug}/${p.slug}`;

  // Gallery slider state & scroll handlers
  const gallery = getGalleryImages(p);
  const extendedGallery =
    gallery.length > 1 ? [...gallery, gallery[0]] : gallery;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const scrollContainerRef = useRef(null);
  // Tracks the pending "snap the clone back to the real first image"
  // timeout so a fast second click/swipe can cancel a stale reset.
  const resetTimeoutRef = useRef(null);

  const clearPendingReset = () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  // Real index in `gallery` (not the extended/cloned list) derived from
  // the container's actual scroll position, so we never rely on
  // possibly-stale `currentIdx` state when computing the next move.
  const getRealIdxFromScroll = (container, width) => {
    if (!width) return currentIdx;
    return Math.round(container.scrollLeft / width) % gallery.length;
  };

  // Helper for instant position snaps without CSS scroll-behavior interference
  const instantScroll = (container, targetLeft) => {
    if (!container) return;
    const originalBehavior = container.style.scrollBehavior;
    container.style.scrollBehavior = "auto";
    container.scrollLeft = targetLeft;
    void container.offsetHeight;
    container.style.scrollBehavior = originalBehavior;
  };

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHasInteracted(true);
    clearPendingReset();

    const container = scrollContainerRef.current;
    if (!container || gallery.length <= 1) return;
    const width = container.clientWidth;
    if (!width) return;

    const realIdx = getRealIdxFromScroll(container, width);

    if (realIdx === 0) {
      // Instantly snap to the clone at the end without backward animation, then smooth-scroll back to last photo
      instantScroll(container, gallery.length * width);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const c = scrollContainerRef.current;
          if (!c) return;
          c.scrollTo({
            left: (gallery.length - 1) * width,
            behavior: "smooth",
          });
          setCurrentIdx(gallery.length - 1);
        });
      });
    } else {
      const prevIdx = realIdx - 1;
      container.scrollTo({ left: prevIdx * width, behavior: "smooth" });
      setCurrentIdx(prevIdx);
    }
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHasInteracted(true);
    clearPendingReset();

    const container = scrollContainerRef.current;
    if (!container || gallery.length <= 1) return;
    const width = container.clientWidth;
    if (!width) return;

    const realIdx = getRealIdxFromScroll(container, width);
    const nextIdx = realIdx + 1;

    container.scrollTo({ left: nextIdx * width, behavior: "smooth" });
    setCurrentIdx(nextIdx % gallery.length);

    if (nextIdx === gallery.length) {
      resetTimeoutRef.current = setTimeout(() => {
        const c = scrollContainerRef.current;
        if (!c) return;
        const w = c.clientWidth;
        if (w && Math.round(c.scrollLeft / w) === gallery.length) {
          instantScroll(c, 0);
        }
        resetTimeoutRef.current = null;
      }, 380);
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || gallery.length <= 1) return;
    const width = container.clientWidth;
    if (!width) return;

    const rawIdx = Math.round(container.scrollLeft / width);

    if (rawIdx === gallery.length) {
      setCurrentIdx(0);
      clearPendingReset();
      resetTimeoutRef.current = setTimeout(() => {
        const c = scrollContainerRef.current;
        if (!c) return;
        const w = c.clientWidth;
        if (w && Math.round(c.scrollLeft / w) === gallery.length) {
          instantScroll(c, 0);
        }
        resetTimeoutRef.current = null;
      }, 120);
      return;
    }

    const newIdx = rawIdx % gallery.length;
    if (newIdx !== currentIdx && newIdx >= 0 && newIdx < gallery.length) {
      setCurrentIdx(newIdx);
    }
  };

  const handleMouseLeave = () => {
    clearPendingReset();
    if (hasInteracted || currentIdx !== 0) {
      setHasInteracted(false);
      setCurrentIdx(0);
      if (scrollContainerRef.current) {
        instantScroll(scrollContainerRef.current, 0);
      }
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    await toggleFavorites(productId);
  };

  const defaultLayoutClass =
    viewMode === "list"
      ? "flex-col sm:flex-row gap-6 items-center border-b border-[#ECE7E1] pb-8"
      : "flex-col";

  const wrapperClass = `group flex text-decoration-none ${defaultLayoutClass} ${className}`;
  const mainImg =
    p.img || (p.images && p.images[0]?.url) || "/storefront/prod-1.png";
  const hoverImg = p.hoverImg || getHoverImage(p);

  return (
    <Link
      to={detailPath}
      onClick={onClick}
      onMouseLeave={handleMouseLeave}
      className={wrapperClass}
    >
      {/* Image container */}
      <div
        ref={imageRef}
        className={`relative overflow-hidden bg-[#EFE9E1] rounded-[2px] shrink-0
          ${viewMode === "list" ? "w-full sm:w-[220px] aspect-[4/5]" : "w-full aspect-[4/5]"}`}
      >
        {/* State 1: Classic Hover Image Transition (when user has not clicked chevron arrows) */}
        {!hasInteracted ? (
          <>
            <img
              src={mainImg}
              alt={p.name}
              className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ease-in-out group-hover:opacity-0"
            />
            <img
              src={hoverImg}
              alt={`${p.name} hover detail`}
              className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-700 ease-in-out opacity-0 scale-[1.02] group-hover:opacity-100 group-hover:scale-100"
            />
          </>
        ) : (
          /* State 2: Scrollable Gallery Track with extended clone for infinite forward flow */
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none select-none scroll-smooth"
          >
            {extendedGallery.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt={`${p.name} image ${idx + 1}`}
                className="w-full h-full object-cover object-top shrink-0 snap-center"
              />
            ))}
          </div>
        )}

        {/* Desktop small chevron arrows (no bg) */}
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous image"
              className="hidden md:flex absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 p-1 text-[#1C1916]/80 hover:text-[#1C1916] hover:scale-125 transition-all duration-200 opacity-0 group-hover:opacity-100 bg-transparent cursor-pointer focus:outline-none drop-shadow-sm"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next image"
              className="hidden md:flex absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 p-1 text-[#1C1916]/80 hover:text-[#1C1916] hover:scale-125 transition-all duration-200 opacity-0 group-hover:opacity-100 bg-transparent cursor-pointer focus:outline-none drop-shadow-sm"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </>
        )}

        {/* Gallery position dots/dashes indicator */}
        {gallery.length > 1 && hasInteracted && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 items-center px-1.5 py-0.5 rounded-full bg-black/15 backdrop-blur-[1px]">
            {gallery.map((_, idx) => (
              <span
                key={idx}
                className={`h-0.5 transition-all duration-300 rounded-full ${
                  currentIdx === idx ? "w-3 bg-white" : "w-1 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Favorite button overlay */}
        <button
          onClick={handleToggleFavorite}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          title={!isAuthenticated ? "Sign in to save favorites" : undefined}
          className="absolute cursor-pointer top-3 right-3 z-10 flex p-1 items-center justify-center bg-transparent transition-transform duration-200 hover:scale-110 group/fav focus:outline-none"
        >
          <Heart
            size={18}
            strokeWidth={1.75}
            className={`transition-colors duration-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] ${
              favorite
                ? "fill-[#C94C4C] text-[#C94C4C]"
                : "text-white group-hover/fav:text-[#B58A5B]"
            }`}
          />
        </button>

        {p.quantity <= 0 && (
          <div className="absolute inset-0 bg-[#1C1916]/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.25em] text-white bg-[#1C1916]/80 px-4.5 py-2.5 rounded-[1px] shadow-sm">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Details container */}
      <div className={`flex-1 w-full ${viewMode === "list" ? "pt-2" : "mt-4"}`}>
        {showMeta ? (
          <>
            {/* Title + plus button row */}
            <div className="flex items-center justify-between gap-3 sm:mt-1">
              <h3 className="font-serif text-[15px] sm:text-[16px] font-normal leading-snug text-[#1C1916] group-hover:text-[#B58A5B] transition-colors duration-200">
                {p.name}
              </h3>
              {showAddButton && (
                <button
                  disabled={p.quantity <= 0 && !inCart}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (inCart) {
                      setIsOpen(true);
                    } else {
                      addToCart(p, 1);
                    }
                  }}
                  aria-label={
                    inCart
                      ? `${p.name} is in cart`
                      : p.quantity <= 0
                        ? `${p.name} is out of stock`
                        : `Add ${p.name} to bag`
                  }
                  title={inCart ? "In Cart (Click to view)" : undefined}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 sm:h-8 sm:w-8 ${
                    inCart
                      ? "bg-[#1C1916] border-[#1C1916] text-white shadow-xs cursor-pointer hover:scale-105"
                      : p.quantity <= 0
                        ? "border-[#1C1916]/20 text-[#1C1916] opacity-35 cursor-not-allowed"
                        : "border-[#1C1916]/20 text-[#1C1916] hover:border-[#1C1916] hover:bg-[#1C1916] hover:text-white cursor-pointer"
                  }`}
                >
                  {inCart ? (
                    <Check size={13} strokeWidth={2.2} />
                  ) : (
                    <Plus size={13} strokeWidth={1.5} />
                  )}
                </button>
              )}
            </div>

            {/* Material + price row */}
            <div className="mt-1.5 flex items-center justify-between text-[12px] text-[#6B6560] sm:text-[13px]">
              <span className="font-sans font-light">
                {p.material || "Pashmina"}
              </span>
              <span className="font-sans font-normal text-[#1C1916]">
                {getProductPrice(p)}
              </span>
            </div>

            {/* Weave / Time meta row */}
            <div className="mt-3.5 border-t border-[#ECE7E1] pt-3.5 sm:mt-4 sm:pt-4 grid grid-cols-2 gap-3">
              <div>
                <span className="block font-sans text-[9px] font-semibold tracking-[0.15em] uppercase text-[#B8AFA5] mb-1">
                  Weave
                </span>
                <span className="block font-sans text-[12px] text-[#1C1916] sm:text-[13px]">
                  {getProductWeave(p)}
                </span>
              </div>
              <div>
                <span className="block font-sans text-[9px] font-semibold tracking-[0.15em] uppercase text-[#B8AFA5] mb-1">
                  Time
                </span>
                <span className="block font-sans text-[12px] text-[#1C1916] sm:text-[13px]">
                  {getProductTime(p)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <h3 className="font-serif text-[15px] sm:text-[16px] font-normal leading-snug text-[#1C1916] group-hover:text-[#B58A5B] transition-colors duration-200">
                {p.name}
              </h3>
              <span className="font-sans text-[12px] sm:text-[13px] font-normal text-[#1C1916] mt-1.5">
                {getProductPrice(p)}
              </span>
            </div>
            {showAddButton && (
              <button
                disabled={p.quantity <= 0 && !inCart}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (inCart) {
                    setIsOpen(true);
                  } else {
                    addToCart(p, 1);
                  }
                }}
                aria-label={
                  inCart
                    ? `${p.name} is in cart`
                    : p.quantity <= 0
                      ? `${p.name} is out of stock`
                      : `Add ${p.name} to bag`
                }
                title={inCart ? "In Cart (Click to view)" : undefined}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 sm:h-8 sm:w-8 mt-0.5 ${
                  inCart
                    ? "bg-[#1C1916] border-[#1C1916] text-white shadow-xs cursor-pointer hover:scale-105"
                    : p.quantity <= 0
                      ? "border-[#1C1916]/20 text-[#1C1916] opacity-35 cursor-not-allowed"
                      : "border-[#1C1916]/20 text-[#1C1916] hover:border-[#1C1916] hover:bg-[#1C1916] hover:text-white cursor-pointer"
                }`}
              >
                {inCart ? (
                  <Check size={13} strokeWidth={2.2} />
                ) : (
                  <Plus size={13} strokeWidth={1.5} />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
