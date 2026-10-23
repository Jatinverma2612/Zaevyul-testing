import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import ProductCard from "./ProductCard";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [arrowTop, setArrowTop] = useState(null);
  const scrollerRef = useRef(null);
  const firstImageRef = useRef(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const data = await api.products.featured();
        setProducts(data);
      } catch (error) {
        console.error("Error loading featured products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const displayProducts = products.length > 0 ? products : [];

  // Keep the arrow buttons vertically centered on the image itself,
  // not the full card (image + title + price + meta rows below it).
  const measureImageHeight = useCallback(() => {
    if (firstImageRef.current) {
      setArrowTop(firstImageRef.current.offsetHeight / 2);
    }
  }, []);

  useEffect(() => {
    measureImageHeight();
    window.addEventListener("resize", measureImageHeight);

    let observer;
    if (firstImageRef.current && "ResizeObserver" in window) {
      observer = new ResizeObserver(measureImageHeight);
      observer.observe(firstImageRef.current);
    }

    return () => {
      window.removeEventListener("resize", measureImageHeight);
      if (observer) observer.disconnect();
    };
  }, [measureImageHeight, displayProducts.length]);

  const scrollByCard = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("a")?.offsetWidth || 300;
    const gap = 24;
    el.scrollBy({ left: direction * (cardWidth + gap), behavior: "smooth" });
  };

  return (
    <section className="overflow-hidden bg-[#FAF8F5] py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 w-full">
        <div className="flex flex-col items-start justify-between gap-5 mb-12 sm:mb-16 sm:flex-row sm:items-end sm:gap-8">
          <h2
            className="font-serif font-normal text-[#1C1916]"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}
          >
            Carefully Crafted for you
          </h2>

          <Link
            to="/collections"
            className="inline-flex items-center gap-2 whitespace-nowrap font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6B6560] transition-colors duration-200 hover:text-[#1C1916] sm:text-[10px]"
          >
            View All
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>

        {/* Scroller with edge-mounted chevron buttons */}
        <div className="relative">
          <button
            onClick={() => scrollByCard(-1)}
            aria-label="Scroll previous"
            style={arrowTop !== null ? { top: arrowTop } : undefined}
            className="hidden lg:flex absolute -left-6 xl:-left-8 -translate-y-1/2 z-10 p-2 items-center justify-center bg-transparent text-[#1C1916] transition-transform duration-200 hover:scale-125 hover:text-[#B58A5B] cursor-pointer focus:outline-none"
          >
            <ChevronLeft size={24} strokeWidth={1.5} className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]" />
          </button>

          <div
            ref={scrollerRef}
            className="relative z-0 flex overflow-x-auto pb-4 gap-6 scroll-smooth snap-x snap-mandatory scrollbar-none lg:gap-8 xl:gap-9"
          >
            {displayProducts.map((p, i) => (
              <ProductCard
                key={p._id || p.id}
                p={p}
                imageRef={i === 0 ? firstImageRef : undefined}
                showMeta={true}
                className="w-[78%] min-w-[240px] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-24px)] 2xl:w-[calc(25%-24px)] shrink-0 snap-start"
              />
            ))}
          </div>

          <button
            onClick={() => scrollByCard(1)}
            aria-label="Scroll next"
            style={arrowTop !== null ? { top: arrowTop } : undefined}
            className="hidden lg:flex absolute -right-6 xl:-right-8 -translate-y-1/2 z-10 p-2 items-center justify-center bg-transparent text-[#1C1916] transition-transform duration-200 hover:scale-125 hover:text-[#B58A5B] cursor-pointer focus:outline-none"
          >
            <ChevronRight size={24} strokeWidth={1.5} className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]" />
          </button>
        </div>
      </div>
    </section>
  );
}
