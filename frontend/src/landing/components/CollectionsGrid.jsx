import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";

const getCategoryImage = (cat) => {
  if (cat?.mainImage?.url) return cat.mainImage.url;
  const slug = (cat?.slug || cat?.name || "").toLowerCase();
  return "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124709/zaevyul/storefront/cat-shawls.jpg";
};

function ColCard({ cat, className = "" }) {
  if (!cat) return null;
  const heightClass = className.includes("h-") ? "" : "h-full";
  return (
    <Link
      to={`/collections/${cat.slug || cat.id}`}
      className={`group relative block w-full overflow-hidden rounded-[2px] cursor-pointer ${heightClass} ${className}`}
    >
      <img
        src={getCategoryImage(cat)}
        alt={cat.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3 min-[400px]:bottom-4 min-[400px]:left-4 sm:bottom-7 sm:left-7">
        <span className="block truncate font-serif text-[15px] font-normal leading-tight text-white min-[400px]:text-[18px] sm:text-[22px] lg:text-[26px] 2xl:text-[30px]">
          {cat.name}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 font-sans text-[7.5px] font-medium uppercase tracking-[0.12em] text-white/75 min-[400px]:mt-1.5 min-[400px]:text-[8.5px] sm:text-[10px]">
          Explore <ArrowRight size={10} strokeWidth={1.5} />
        </span>
      </div>
    </Link>
  );
}

export default function CollectionsGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await api.categories.list();
        const activeCats = (data || []).filter((c) => c.status !== "inactive");
        setCategories(activeCats);
      } catch (error) {
        console.error("Error fetching categories for homepage:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Group categories into sets of 4 to preserve original 4-card grid layout
  const categoryGroups = [];
  for (let i = 0; i < categories.length; i += 4) {
    categoryGroups.push(categories.slice(i, i + 4));
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const width = container.offsetWidth;
      if (width > 0) {
        const index = Math.round(container.scrollLeft / width);
        setActiveGroupIndex(index);
      }
    }
  };

  const scrollToGroup = (index) => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: index * width,
        behavior: "smooth",
      });
      setActiveGroupIndex(index);
    }
  };

  const scroll = (direction) => {
    const nextIndex =
      direction === "left"
        ? Math.max(0, activeGroupIndex - 1)
        : Math.min(categoryGroups.length - 1, activeGroupIndex + 1);
    scrollToGroup(nextIndex);
  };

  // Row heights scale fluidly and continuously with viewport width (no
  // window checks / no breakpoint jump) so anything from a small phone to
  // an ultra-wide monitor gets proportionate card sizes.
  const gridRowStyle = {
    gridTemplateRows: "clamp(140px, 32vw, 420px) clamp(140px, 32vw, 320px)",
  };

  return (
    <section
      id="collections"
      className="overflow-hidden bg-[#F3ECE3] py-10 min-[400px]:py-14 sm:py-20 lg:py-28 2xl:py-32"
    >
      <div className="mx-auto w-full max-w-[1720px] px-4 sm:px-6 md:px-10 lg:px-16 2xl:max-w-[1920px] 3xl:max-w-[2200px]">
        {/* Header Bar */}
        <div className="mb-6 flex flex-row items-end justify-between gap-3 min-[400px]:mb-8 sm:mb-12 lg:mb-14">
          <div className="min-w-0">
            <p className="mb-1.5 font-sans text-[8px] font-semibold uppercase tracking-[0.25em] text-[#B58A5B] min-[400px]:mb-2 min-[400px]:text-[9px] sm:mb-4 sm:tracking-[0.3em] sm:text-[10px]">
              Collections
            </p>
            <h2
              className="font-serif font-normal leading-[1.05] text-[#1C1916]"
              style={{ fontSize: "clamp(1.5rem, 6vw, 3.85rem)" }}
            >
              Curated for Every Moment.
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-4 pb-1">
            <Link
              to="/collections"
              className="inline-flex items-center gap-1 whitespace-nowrap font-sans text-[8px] font-semibold uppercase tracking-[0.15em] text-[#6B6560] transition-colors duration-200 hover:text-[#1C1916] min-[400px]:gap-1.5 min-[400px]:text-[9px] sm:text-[10px] sm:tracking-[0.2em]"
            >
              View All
              <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Scroller Track */}
        <div className="relative">
          {/* Side Chevron Buttons - only shown once there's room (desktop) */}
          {categoryGroups.length > 1 && (
            <button
              onClick={() => scroll("left")}
              disabled={activeGroupIndex === 0}
              aria-label="Scroll previous"
              className="absolute -left-5 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer items-center justify-center p-2 text-[#1C1916] transition-transform duration-200 hover:scale-125 hover:text-[#B58A5B] focus:outline-none disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:scale-100 disabled:hover:text-[#1C1916] lg:flex xl:-left-8"
            >
              <ChevronLeft
                size={24}
                strokeWidth={1.5}
                className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
              />
            </button>
          )}

          {loading ? (
            <div
              className="grid grid-cols-2 gap-2 min-[400px]:gap-2.5 sm:gap-4 lg:gap-5"
              style={gridRowStyle}
            >
              <div className="h-full animate-pulse rounded-[2px] bg-[#E8E1D9] sm:row-span-2" />
              <div className="contents sm:grid sm:h-full sm:grid-cols-2 sm:gap-4 lg:gap-5">
                <div className="h-full animate-pulse rounded-[2px] bg-[#E8E1D9]" />
                <div className="h-full animate-pulse rounded-[2px] bg-[#E8E1D9]" />
              </div>
              <div className="h-full animate-pulse rounded-[2px] bg-[#E8E1D9]" />
            </div>
          ) : (
            <div>
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="scrollbar-none flex w-full snap-x snap-mandatory scroll-smooth overflow-x-auto"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {categoryGroups.map((group, groupIdx) => (
                  <div
                    key={groupIdx}
                    className="w-full shrink-0 snap-start px-0.5"
                  >
                    <div
                      className="relative z-0 grid grid-cols-2 gap-2 min-[400px]:gap-2.5 sm:gap-4 lg:gap-5"
                      style={gridRowStyle}
                    >
                      {group[0] && (
                        <ColCard
                          cat={group[0]}
                          className="h-full sm:row-span-2"
                        />
                      )}

                      <div className="contents sm:grid sm:h-full sm:grid-cols-2 sm:gap-4 lg:gap-5">
                        {group[1] && (
                          <ColCard cat={group[1]} className="h-full" />
                        )}
                        {group[2] && (
                          <ColCard cat={group[2]} className="h-full" />
                        )}
                      </div>

                      {group[3] && (
                        <ColCard cat={group[3]} className="h-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Indicator Dots */}
              {categoryGroups.length > 1 && (
                <div className="mt-5 flex items-center justify-center gap-1.5 min-[400px]:mt-6 sm:mt-8 sm:gap-2">
                  {categoryGroups.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToGroup(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer sm:h-2 ${
                        activeGroupIndex === idx
                          ? "w-6 bg-[#1C1916] sm:w-8"
                          : "w-1.5 bg-[#1C1916]/25 hover:bg-[#1C1916]/50 sm:w-2"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Side Chevron Buttons */}
          {categoryGroups.length > 1 && (
            <button
              onClick={() => scroll("right")}
              disabled={activeGroupIndex === categoryGroups.length - 1}
              aria-label="Scroll next"
              className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer items-center justify-center p-2 text-[#1C1916] transition-transform duration-200 hover:scale-125 hover:text-[#B58A5B] focus:outline-none disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:scale-100 disabled:hover:text-[#1C1916] lg:flex xl:-right-8"
            >
              <ChevronRight
                size={24}
                strokeWidth={1.5}
                className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
              />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
