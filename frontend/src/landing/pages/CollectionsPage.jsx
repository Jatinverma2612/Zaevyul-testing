import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingBag,
  Filter,
  Grid,
  List,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowRight,
  X,
  Menu,
} from "lucide-react";
import SiteFooter from "../components/SiteFooter";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";

import { api, getCategorySlug, getHoverImage } from "../../lib/api";
import { updateCategorySEO, resetSEO } from "../../lib/seo";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";

const FILTER_OPTIONS = {
  gender: ["Men", "Women", "Neutral"],
  material: ["100% Pashmina", "Silk Pashmina Blend"],
  color: ["Ivory", "Midnight Black", "Sand Beige", "Charcoal"],
  size: ["Standard (200x70cm)", "Large (200x100cm)"],
  design: ["Solid / Plain", "Sozni Embroidery", "Kani Weave"],
  price: ["Under ₹25,000", "₹25,000 - ₹50,000", "Over ₹50,000"],
};

const FALLBACK_CATEGORIES = [
  { _id: "shawls", name: "Shawls", slug: "shawls" },
  { _id: "stoles", name: "Stoles", slug: "stoles" },
  { _id: "scarves", name: "Scarves", slug: "scarves" },
  { _id: "throws", name: "Throws", slug: "throws" },
];

// One matcher per filter group. Each takes a product and the list of
// currently *selected* values for that group and returns whether the
// product satisfies that group (OR across values within the group, empty
// selection = no restriction). These are reused both to filter the product
// list and to work out which options in other groups are still reachable.
const FILTER_MATCHERS = {
  gender: (p, selected) => {
    if (!selected || selected.length === 0) return true;
    const pGender = (p.gender || "").toLowerCase().trim();
    return selected.some((g) => {
      const gLower = g.toLowerCase().trim();
      return pGender === gLower;
    });
  },
  categories: (p, selected) => {
    if (selected.length === 0) return true;
    const pCat = p.category;
    if (!pCat) return false;
    const pCatId = typeof pCat === "string" ? pCat : pCat._id || pCat.id;
    return selected.includes(String(pCatId));
  },
  material: (p, selected) => {
    if (selected.length === 0) return true;
    if (!p.material) return false;
    const m = p.material.toLowerCase();
    return selected.some((mat) => {
      if (mat === "100% Pashmina")
        return m.includes("100%") || m.includes("pure");
      if (mat === "Silk Pashmina Blend")
        return m.includes("silk") || m.includes("blend");
      return m.includes(mat.toLowerCase());
    });
  },
  color: (p, selected) => {
    if (selected.length === 0) return true;
    if (!p.color) return false;
    const c = p.color.toLowerCase();
    return selected.some((col) => {
      if (col === "Ivory")
        return (
          c.includes("ivory") || c.includes("cream") || c.includes("white")
        );
      if (col === "Midnight Black")
        return (
          c.includes("black") ||
          c.includes("midnight") ||
          c.includes("dark") ||
          c.includes("charcoal")
        );
      if (col === "Sand Beige")
        return (
          c.includes("beige") ||
          c.includes("sand") ||
          c.includes("saffron") ||
          c.includes("amber") ||
          c.includes("brown")
        );
      if (col === "Charcoal")
        return (
          c.includes("charcoal") ||
          c.includes("grey") ||
          c.includes("gray") ||
          c.includes("stone") ||
          c.includes("mist")
        );
      return c.includes(col.toLowerCase());
    });
  },
  size: (p, selected) => {
    if (selected.length === 0) return true;
    if (!p.size) return false;
    const s = p.size.toLowerCase();
    return selected.some((sz) => {
      if (sz === "Standard (200x70cm)")
        return (
          s.includes("standard") ||
          s.includes("170") ||
          s.includes("190") ||
          s.includes("200")
        );
      if (sz === "Large (200x100cm)")
        return s.includes("large") || s.includes("king") || s.includes("240");
      return s.includes(sz.toLowerCase());
    });
  },
  design: (p, selected) => {
    if (selected.length === 0) return true;
    const text = `${p.name} ${p.description || ""}`.toLowerCase();
    return selected.some((ds) => {
      if (ds === "Solid / Plain")
        return (
          text.includes("solid") ||
          text.includes("plain") ||
          text.includes("classic") ||
          text.includes("undyed")
        );
      if (ds === "Sozni Embroidery")
        return (
          text.includes("embroidery") ||
          text.includes("embroidered") ||
          text.includes("sozni")
        );
      if (ds === "Kani Weave")
        return (
          text.includes("kani") ||
          text.includes("weave") ||
          text.includes("woven") ||
          text.includes("loomed") ||
          text.includes("heritage")
        );
      return text.includes(ds.toLowerCase());
    });
  },
  price: (p, selected) => {
    if (selected.length === 0) return true;
    const price = p.discountPrice || p.basePrice || 0;
    return selected.some((pr) => {
      if (pr === "Under ₹25,000") return price < 25000;
      if (pr === "₹25,000 - ₹50,000") return price >= 25000 && price <= 50000;
      if (pr === "Over ₹50,000") return price > 50000;
      return false;
    });
  },
};

const getProductImage = (p) =>
  p.img || (p.images && p.images[0]?.url) || "/storefront/prod-1.png";
// getProductPrice is now defined inside the component via useCurrency

const getCategoryHeroImage = (catObj, fallbackProducts, isAllCollections) => {
  if (isAllCollections) return "/storefront/pashmina-banner.png";
  if (!catObj) return "/storefront/pashmina-banner.png";
  if (catObj.mainImage) {
    const url = typeof catObj.mainImage === "string" ? catObj.mainImage : catObj.mainImage.url;
    if (url) return url;
  }
  if (catObj.image) {
    const url = typeof catObj.image === "string" ? catObj.image : catObj.image.url;
    if (url) return url;
  }
  if (catObj.banner) {
    const url = typeof catObj.banner === "string" ? catObj.banner : catObj.banner.url;
    if (url) return url;
  }
  if (catObj.img) {
    const url = typeof catObj.img === "string" ? catObj.img : catObj.img.url;
    if (url) return url;
  }
  if (fallbackProducts && fallbackProducts.length > 0) {
    const firstProdImg = getProductImage(fallbackProducts[0]);
    if (firstProdImg) return firstProdImg;
  }
  return "/storefront/pashmina-banner.png";
};

export default function CollectionsPage() {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [openFilters, setOpenFilters] = useState({
    categories: true,
    gender: true,
    material: false,
    color: false,
    size: false,
    design: false,
    price: false,
  });

  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    gender: [],
    material: [],
    color: [],
    size: [],
    design: [],
    price: [],
  });
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(11);
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const getProductPrice = (prod) =>
    formatPrice(prod.discountPrice || prod.basePrice);

  const handleFilterChange = (filterKey, value) => {
    setSelectedFilters((prev) => {
      const current = Array.isArray(prev[filterKey]) ? prev[filterKey] : [];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [filterKey]: updated };
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prodList, catList] = await Promise.all([
          api.products.listPublic ? api.products.listPublic() : api.products.list(),
          api.categories.list(),
        ]);
        setProducts(prodList || []);
        setCategories(catList || []);
      } catch (error) {
        console.error("Error loading collections page data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFilterOpen]);

  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const genderParam = searchParams.get("gender");
    if (genderParam && ["men", "women", "neutral"].includes(genderParam.toLowerCase())) {
      const gLabel = genderParam.toLowerCase() === "men" ? "Men" : genderParam.toLowerCase() === "women" ? "Women" : "Neutral";
      setSelectedFilters((prev) => ({ ...prev, gender: [gLabel] }));
    } else {
      setSelectedFilters((prev) => ({ ...prev, gender: [] }));
    }
  }, [location.search]);

  useEffect(() => {
    if (category) {
      setSelectedFilters((prev) => ({ ...prev, categories: [] }));
    }
  }, [category]);

  // Whenever the category, active filters, or sort order change, the result
  // set is effectively new — go back to showing the first page of it.
  useEffect(() => {
    setVisibleCount(11);
  }, [category, selectedFilters, sortBy]);

  const activeCategoryObj = categories.find(
    (c) =>
      category &&
      (c.slug || c.id || c._id || "").toLowerCase() === (category || "").toLowerCase(),
  );

  const isAllCollections = !category;

  useEffect(() => {
    updateCategorySEO(activeCategoryObj, category);
    return () => {
      resetSEO();
    };
  }, [activeCategoryObj, category]);

  const filteredProducts = activeCategoryObj
    ? products.filter((p) => {
        const pCat = p.category;
        if (!pCat) return false;
        const pCatId = typeof pCat === "string" ? pCat : pCat._id || pCat.id;
        const activeCatId = activeCategoryObj._id || activeCategoryObj.id;
        return String(pCatId) === String(activeCatId);
      })
    : products;

  // A product must satisfy every filter group (AND across groups). Within a
  // group, matching any one selected value is enough (OR within a group).
  const activeFilteredProducts = filteredProducts.filter((p) =>
    Object.keys(FILTER_MATCHERS).every((key) =>
      FILTER_MATCHERS[key](p, selectedFilters[key] || []),
    ),
  );

  // For a given filter group, returns the subset of `options` that are
  // still reachable — i.e. at least one product matches that option AND
  // every *other* currently-selected filter group. Already-selected
  // options are always kept so they can still be unchecked.
  const getAvailableOptions = (key, options) => {
    const selected = Array.isArray(selectedFilters[key]) ? selectedFilters[key] : [];
    const pool = filteredProducts.filter((p) =>
      Object.keys(FILTER_MATCHERS).every(
        (k) => k === key || FILTER_MATCHERS[k](p, selectedFilters[k] || []),
      ),
    );
    return options.filter(
      (opt) =>
        selected.includes(opt) ||
        pool.some((p) => FILTER_MATCHERS[key](p, [opt])),
    );
  };

  const categoryOptionList =
    categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  const availableCategoryIds = new Set(
    getAvailableOptions(
      "categories",
      categoryOptionList.map((c) => String(c.id || c._id)),
    ),
  );
  const availableCategories = categoryOptionList.filter((c) =>
    availableCategoryIds.has(String(c.id || c._id)),
  );

  const availableMaterial = getAvailableOptions(
    "material",
    FILTER_OPTIONS.material,
  );
  const availableColor = getAvailableOptions("color", FILTER_OPTIONS.color);
  const availableSize = getAvailableOptions("size", FILTER_OPTIONS.size);
  const availableDesign = getAvailableOptions("design", FILTER_OPTIONS.design);
  const availablePrice = getAvailableOptions("price", FILTER_OPTIONS.price);

  const sortedProducts = [...activeFilteredProducts];
  if (sortBy === "price-asc") {
    sortedProducts.sort((a, b) => {
      const pa = a.discountPrice || a.basePrice || 0;
      const pb = b.discountPrice || b.basePrice || 0;
      return pa - pb;
    });
  } else if (sortBy === "price-desc") {
    sortedProducts.sort((a, b) => {
      const pa = a.discountPrice || a.basePrice || 0;
      const pb = b.discountPrice || b.basePrice || 0;
      return pb - pa;
    });
  } else if (sortBy === "newest") {
    sortedProducts.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
  } else if (sortBy === "popular") {
    sortedProducts.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
  }

  const filteredProductsCount = sortedProducts.length;

  const hasMoreToShow = visibleCount < sortedProducts.length;
  const visibleProducts = sortedProducts.slice(0, visibleCount);

  // Inject spotlight card at index 6 if there are enough visible products
  const displayProducts = [...visibleProducts];
  if (displayProducts.length >= 6) {
    displayProducts.splice(6, 0, { id: "spotlight", isSpotlight: true });
  } else {
    displayProducts.push({ id: "spotlight", isSpotlight: true });
  }

  const pageTitle = isAllCollections
    ? "ALL PRODUCTS"
    : activeCategoryObj?.name?.toUpperCase() || "PASHMINA & SHAWLS";

  const getBannerHeading = () => {
    if (selectedFilters.gender && selectedFilters.gender.length === 1) {
      const g = selectedFilters.gender[0];
      return (
        <>
          {g.toUpperCase()}'S
          <br />
          COLLECTION
        </>
      );
    }
    if (isAllCollections) {
      return (
        <>
          ALL
          <br />
          COLLECTIONS
        </>
      );
    }
    const name = activeCategoryObj?.name || category || "PASHMINA & SHAWLS";
    const upperName = name.toUpperCase();

    const words = upperName.split(" ");
    if (words.length > 1) {
      const ampersandIdx = words.indexOf("&");
      if (ampersandIdx !== -1) {
        const firstLine = words.slice(0, ampersandIdx).join(" ");
        const secondLine = words.slice(ampersandIdx).join(" ");
        return (
          <>
            {firstLine}
            <br />
            {secondLine}
          </>
        );
      }
      const mid = Math.ceil(words.length / 2);
      const firstLine = words.slice(0, mid).join(" ");
      const secondLine = words.slice(mid).join(" ");
      return (
        <>
          {firstLine}
          <br />
          {secondLine}
        </>
      );
    }

    return upperName;
  };

  const bannerHeading = getBannerHeading();

  const bannerSubtext = isAllCollections
    ? "Explore our complete range of hand-loomed luxury pashmina products, curated with heritage."
    : activeCategoryObj?.description ||
      "Timeless weaves. Thoughtful details. Each piece carries the warmth of Kashmir.";

  const heroImage = getCategoryHeroImage(
    activeCategoryObj,
    filteredProducts,
    isAllCollections,
  );

  const toggleFilter = (key) => {
    setOpenFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetFilters = () => {
    setSelectedFilters({
      categories: [],
      gender: [],
      material: [],
      color: [],
      size: [],
      design: [],
      price: [],
    });
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1916] font-sans selection:bg-[#B58A5B] selection:text-white">
      {/* 2. Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="pb-24 sm:pb-32">
        {/* 3. Breadcrumbs */}
        <div className="mx-auto px-6 sm:px-10 lg:px-16 w-full pt-8 sm:pt-10 pb-4">
          <nav className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A857E]">
            <Link to="/" className="hover:text-[#1C1916] transition-colors">
              HOME
            </Link>
            <span className="mx-2.5 text-[#E6DED4] sm:mx-3">/</span>
            {isAllCollections ? (
              <span className="text-[#1C1916]">COLLECTIONS</span>
            ) : (
              <>
                <Link
                  to="/collections"
                  className="hover:text-[#1C1916] transition-colors"
                >
                  COLLECTIONS
                </Link>
                <span className="mx-2.5 text-[#E6DED4] sm:mx-3">/</span>
                <span className="text-[#1C1916]">
                  {activeCategoryObj?.name?.toUpperCase() ||
                    (category ? category.toUpperCase() : "PASHMINA & SHAWLS")}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* 4. Page Header Banner */}
        <section className="bg-[#FAF8F5] overflow-hidden border-b border-[#ECE7E1] w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch w-full">
            {/* Left Side (aligned with content container) */}
            <div className="py-10 sm:py-14 lg:py-20 px-6 sm:px-10 lg:pl-[max(4rem,calc((100vw-1200px)/2+4rem))] lg:pr-12 w-full flex flex-col justify-center">
              <div className="max-w-[500px]">
                <h1 className="font-serif text-[2.75rem] font-light leading-[1.08] text-[#1C1916] sm:text-[3.5rem] lg:text-[4.2rem] xl:text-[4.5rem]">
                  {bannerHeading}
                </h1>
                <p className="font-sans text-[13px] sm:text-[14px] text-[#6B6560] font-light leading-relaxed mt-5 max-w-[380px]">
                  {bannerSubtext}
                </p>
              </div>
            </div>

            {/* Right Side Full-Bleed Image (touches the right edge of browser) */}
            <div className="w-full h-[360px] sm:h-[460px] lg:h-[540px] xl:h-[580px] overflow-hidden bg-[#E8E1D9]">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={activeCategoryObj?.name || "Luxurious folded pashmina fabrics"}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full animate-pulse bg-[#E8E1D9]" />
              )}
            </div>
          </div>
        </section>

        {/* 5. Filter/Sort Bar */}
        <section className="border-b border-[#ECE7E1] bg-[#FAF8F5] sticky top-[68px] z-30">
          <div className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 w-full py-4 flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  // On desktop toggle sidebar; on mobile open drawer
                  if (window.innerWidth >= 1024) {
                    setDesktopFilterOpen((o) => !o);
                  } else {
                    setMobileFilterOpen(true);
                  }
                }}
                className="flex items-center gap-2 font-sans text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1C1916] hover:text-[#B58A5B] transition-colors"
              >
                <Filter size={13} strokeWidth={1.5} />
                <span>FILTER</span>
              </button>
              <button
                onClick={resetFilters}
                className="hidden sm:inline-block text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A857E] hover:text-[#1C1916] transition-colors ml-8"
              >
                Clear All
              </button>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-[#8A857E] ml-4 pl-4 sm:ml-8 sm:pl-8 border-l border-[#E6DED4]">
                {filteredProductsCount}{" "}
                {filteredProductsCount === 1 ? "ITEM" : "ITEMS"}
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1 font-sans text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1C1916]/80">
                <span className="hidden sm:inline">SORT BY:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-0 focus:outline-none focus:ring-0 text-[#1C1916] font-semibold cursor-pointer pr-4 text-[9px] sm:text-[10px] md:text-[11px]"
                >
                  <option value="newest">NEWEST</option>
                  <option value="price-asc">PRICE: LOW TO HIGH</option>
                  <option value="price-desc">PRICE: HIGH TO LOW</option>
                  <option value="popular">POPULAR</option>
                </select>
              </div>

              {/* Grid/List Toggle */}
              <div className="hidden sm:flex items-center gap-3 border-l border-[#E6DED4] pl-6 text-[#8A857E]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`transition-colors duration-200 ${viewMode === "grid" ? "text-[#1C1916]" : "hover:text-[#1C1916]"}`}
                  aria-label="Grid view"
                >
                  <Grid size={15} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`transition-colors duration-200 ${viewMode === "list" ? "text-[#1C1916]" : "hover:text-[#1C1916]"}`}
                  aria-label="List view"
                >
                  <List size={15} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Product Section Grid + Sidebar Layout */}
        <section className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 w-full mt-10">
          <div className="flex gap-8 lg:gap-12">
            {/* 6. Sidebar Filters (Desktop only — slides in/out) */}
            <aside
              className={`hidden lg:block shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                desktopFilterOpen
                  ? "w-[220px] opacity-100"
                  : "w-0 opacity-0 pointer-events-none"
              }`}
            >
              <div className="divide-y divide-[#ECE7E1] border-b border-[#ECE7E1] w-[220px]">
                {/* 1. Categories Accordion — hidden when browsing a specific category */}
                {!category && (
                  <div className="py-4">
                    <button
                      onClick={() => toggleFilter("categories")}
                      className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                    >
                      <span>Categories</span>
                      {openFilters.categories ? (
                        <ChevronUp size={13} />
                      ) : (
                        <ChevronDown size={13} />
                      )}
                    </button>
                    {openFilters.categories && (
                      <div className="mt-4 flex flex-col gap-3">
                        {availableCategories.map((opt) => {
                          const optId = String(opt.id || opt._id);
                          return (
                            <label
                              key={optId}
                              className="flex items-center gap-3 cursor-pointer text-[12px] text-[#6B6560] hover:text-[#1C1916] transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFilters.categories.includes(
                                  optId,
                                )}
                                onChange={() =>
                                  handleFilterChange("categories", optId)
                                }
                                className="rounded-[1px] border-[#E6DED4] text-[#B58A5B] focus:ring-[#B58A5B] w-3.5 h-3.5"
                              />
                              <span>{opt.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Material Accordion */}
                <div className="py-4">
                  <button
                    onClick={() => toggleFilter("material")}
                    className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                  >
                    <span>Material</span>
                    {openFilters.material ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </button>
                  {openFilters.material && (
                    <div className="mt-4 flex flex-col gap-3">
                      {availableMaterial.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 cursor-pointer text-[12px] text-[#6B6560] hover:text-[#1C1916]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.material.includes(opt)}
                            onChange={() => handleFilterChange("material", opt)}
                            className="rounded-[1px] border-[#E6DED4] text-[#B58A5B] focus:ring-[#B58A5B] w-3.5 h-3.5"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Color Accordion */}
                <div className="py-4">
                  <button
                    onClick={() => toggleFilter("color")}
                    className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                  >
                    <span>Color</span>
                    {openFilters.color ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </button>
                  {openFilters.color && (
                    <div className="mt-4 flex flex-col gap-3">
                      {availableColor.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 cursor-pointer text-[12px] text-[#6B6560] hover:text-[#1C1916]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.color.includes(opt)}
                            onChange={() => handleFilterChange("color", opt)}
                            className="rounded-[1px] border-[#E6DED4] text-[#B58A5B] focus:ring-[#B58A5B] w-3.5 h-3.5"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Size Accordion */}
                <div className="py-4">
                  <button
                    onClick={() => toggleFilter("size")}
                    className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                  >
                    <span>Size</span>
                    {openFilters.size ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </button>
                  {openFilters.size && (
                    <div className="mt-4 flex flex-col gap-3">
                      {availableSize.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 cursor-pointer text-[12px] text-[#6B6560] hover:text-[#1C1916]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.size.includes(opt)}
                            onChange={() => handleFilterChange("size", opt)}
                            className="rounded-[1px] border-[#E6DED4] text-[#B58A5B] focus:ring-[#B58A5B] w-3.5 h-3.5"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Design Accordion */}
                <div className="py-4">
                  <button
                    onClick={() => toggleFilter("design")}
                    className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                  >
                    <span>Design</span>
                    {openFilters.design ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </button>
                  {openFilters.design && (
                    <div className="mt-4 flex flex-col gap-3">
                      {availableDesign.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 cursor-pointer text-[12px] text-[#6B6560] hover:text-[#1C1916]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.design.includes(opt)}
                            onChange={() => handleFilterChange("design", opt)}
                            className="rounded-[1px] border-[#E6DED4] text-[#B58A5B] focus:ring-[#B58A5B] w-3.5 h-3.5"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. Price Accordion */}
                <div className="py-4">
                  <button
                    onClick={() => toggleFilter("price")}
                    className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                  >
                    <span>Price</span>
                    {openFilters.price ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </button>
                  {openFilters.price && (
                    <div className="mt-4 flex flex-col gap-3">
                      {availablePrice.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 cursor-pointer text-[12px] text-[#6B6560] hover:text-[#1C1916]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.price.includes(opt)}
                            onChange={() => handleFilterChange("price", opt)}
                            className="rounded-[1px] border-[#E6DED4] text-[#B58A5B] focus:ring-[#B58A5B] w-3.5 h-3.5"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reset Filters button */}
              <button
                onClick={resetFilters}
                className="w-full border border-[#1C1916] text-[#1C1916] hover:bg-[#1C1916] hover:text-white transition-colors duration-300 py-3 text-[10px] font-semibold tracking-[0.2em] uppercase rounded-[1px] mt-8"
              >
                RESET FILTERS
              </button>
            </aside>

            {/* Mobile Filter Drawer Overlay */}
            <div
              className={`fixed inset-0 z-50 flex lg:hidden transition-opacity duration-300 ${mobileFilterOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            >
              <div
                className="fixed inset-0 bg-black/35 backdrop-blur-sm"
                onClick={() => setMobileFilterOpen(false)}
              />
              <div
                className={`relative w-full max-w-[320px] bg-[#FAF8F5] p-6 flex flex-col justify-between border-r border-[#E6DED4] overflow-y-auto transition-transform duration-500 ease-in-out ${mobileFilterOpen ? "translate-x-0" : "-translate-x-full"}`}
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#E6DED4]">
                    <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1C1916]">
                      FILTERS
                    </span>
                    <button
                      onClick={() => setMobileFilterOpen(false)}
                      className="text-[#1C1916]/60 hover:text-[#1C1916]"
                    >
                      <X size={18} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="divide-y divide-[#ECE7E1] mt-4">
                    {/* Accordions inside mobile drawer — skip categories when on a specific category page */}
                    {Object.keys(openFilters)
                      .filter((k) => !(k === "categories" && category))
                      .map((filterKey) => {
                        const optionsForKey =
                          filterKey === "categories"
                            ? availableCategories
                            : filterKey === "material"
                              ? availableMaterial
                              : filterKey === "color"
                                ? availableColor
                                : filterKey === "size"
                                  ? availableSize
                                  : filterKey === "design"
                                    ? availableDesign
                                    : availablePrice;
                        return (
                          <div key={filterKey} className="py-4">
                            <button
                              onClick={() => toggleFilter(filterKey)}
                              className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                            >
                              <span className="capitalize">{filterKey}</span>
                              {openFilters[filterKey] ? (
                                <ChevronUp size={12} />
                              ) : (
                                <ChevronDown size={12} />
                              )}
                            </button>
                            {openFilters[filterKey] && (
                              <div className="mt-3.5 flex flex-col gap-2.5 pl-1">
                                {filterKey === "categories" &&
                                  optionsForKey.map((opt) => {
                                    const optId = String(opt.id || opt._id);
                                    return (
                                      <label
                                        key={optId}
                                        className="flex items-center gap-3 cursor-pointer text-[12px] text-[#6B6560]"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedFilters.categories.includes(
                                            optId,
                                          )}
                                          onChange={() =>
                                            handleFilterChange(
                                              "categories",
                                              optId,
                                            )
                                          }
                                          className="rounded-[1px] border-[#E6DED4] text-[#B58A5B] w-3.5 h-3.5"
                                        />
                                        <span>{opt.name}</span>
                                      </label>
                                    );
                                  })}
                                {filterKey !== "categories" &&
                                  optionsForKey.map((opt) => (
                                    <label
                                      key={opt}
                                      className="flex items-center gap-3 cursor-pointer text-[12px] text-[#6B6560]"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedFilters[
                                          filterKey
                                        ].includes(opt)}
                                        onChange={() =>
                                          handleFilterChange(filterKey, opt)
                                        }
                                        className="rounded-[1px] border-[#E6DED4] text-[#B58A5B] w-3.5 h-3.5"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-4 border-t border-[#ECE7E1]">
                  <button
                    onClick={() => {
                      resetFilters();
                      setMobileFilterOpen(false);
                    }}
                    className="flex-1 border border-[#1C1916]/40 text-[#1C1916]/70 py-3 text-[10px] font-semibold uppercase tracking-[0.15em]"
                  >
                    CLEAR
                  </button>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="flex-1 bg-[#1C1916] text-white py-3 text-[10px] font-semibold uppercase tracking-[0.15em] hover:bg-[#B58A5B] transition-colors"
                  >
                    SHOW {filteredProductsCount} {filteredProductsCount === 1 ? "PRODUCT" : "PRODUCTS"}
                  </button>
                </div>
              </div>
            </div>

            {/* 7. Product Grid */}
            <div className="flex-1">
              {/* Active Filter Chips */}
              {Object.values(selectedFilters).some((arr) => Array.isArray(arr) && arr.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 mb-8 pb-4 border-b border-[#ECE7E1]">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A857E] mr-1">
                    Active Filters:
                  </span>
                  {Object.entries(selectedFilters).map(([key, valArr]) =>
                    Array.isArray(valArr) && valArr.map((val) => {
                      let displayVal = val;
                      if (key === "categories") {
                        const c = categories.find(
                          (cat) => String(cat.id || cat._id) === String(val),
                        );
                        displayVal = c ? c.name : val;
                      }
                      return (
                        <span
                          key={`${key}-${val}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0ECE8] border border-[#E6DED4] text-[#1C1916] font-sans text-[11px] font-medium rounded-[2px] transition-colors hover:bg-[#E6DED4]"
                        >
                          <span>{displayVal}</span>
                          <button
                            onClick={() => handleFilterChange(key, val)}
                            className="text-[#8A857E] hover:text-[#1C1916] transition-colors p-0.5 cursor-pointer"
                            aria-label={`Remove filter ${displayVal}`}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      );
                    }),
                  )}
                  <button
                    onClick={resetFilters}
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B58A5B] hover:text-[#1C1916] transition-colors ml-2 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {sortedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#ECE7E1] rounded-[2px] bg-[#FAF8F5] px-6">
                  <span className="font-serif text-[22px] font-light text-[#1C1916] mb-2">
                    We couldn't find an exact match
                  </span>
                  <p className="font-sans text-[13px] text-[#6B6560] font-light max-w-[420px] leading-relaxed mb-6">
                    Try broadening your search criteria or exploring these curated collections:
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-[500px]">
                    <button
                      onClick={() => setSearchParams({ gender: "men" })}
                      className="px-3.5 py-1.5 bg-white border border-[#E6DED4] text-[#1C1916] text-[11px] font-medium rounded-[1px] hover:border-[#1C1916] transition-colors cursor-pointer"
                    >
                      Men's Collection
                    </button>
                    <button
                      onClick={() => setSearchParams({ gender: "women" })}
                      className="px-3.5 py-1.5 bg-white border border-[#E6DED4] text-[#1C1916] text-[11px] font-medium rounded-[1px] hover:border-[#1C1916] transition-colors cursor-pointer"
                    >
                      Women's Collection
                    </button>
                    <button
                      onClick={() => setSearchParams({ category: "stoles" })}
                      className="px-3.5 py-1.5 bg-white border border-[#E6DED4] text-[#1C1916] text-[11px] font-medium rounded-[1px] hover:border-[#1C1916] transition-colors cursor-pointer"
                    >
                      Pashmina Stoles
                    </button>
                  </div>

                  <button
                    onClick={resetFilters}
                    className="bg-[#1C1916] text-white px-8 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] rounded-[1px] hover:bg-[#B58A5B] transition-colors cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className={`grid gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 lg:gap-x-10
                      ${viewMode === "grid" ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1"}`}
                  >
                    {displayProducts.map((p, idx) => {
                      // Index 6 is the Artisan Spotlight Card
                      if (p.isSpotlight) {
                        return (
                          <div
                            key="spotlight"
                            className={`flex flex-col justify-between bg-[#F5EFE7] rounded-[2px] border border-[#E6DED4]/60 overflow-hidden
                              ${viewMode === "list" ? "sm:flex-row sm:items-stretch sm:min-h-[220px]" : "min-h-[380px]"}`}
                          >
                            {/* Top half: Image */}
                            <div
                              className={`overflow-hidden relative bg-[#EFE9E1] ${viewMode === "list" ? "sm:w-[40%] sm:h-full" : "h-[45%]"}`}
                            >
                              <img
                                src="/storefront/artisan.png"
                                alt="Artisan working at a weaving loom"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            </div>

                            {/* Bottom half: Content */}
                            <div
                              className={`p-6 flex flex-col justify-between ${viewMode === "list" ? "sm:w-[60%] sm:justify-center" : "h-[55%]"}`}
                            >
                              <div>
                                <span className="block font-sans text-[9px] font-semibold tracking-[0.2em] uppercase text-[#B58A5B] mb-2.5">
                                  ARTISAN SPOTLIGHT
                                </span>
                                <p className="font-serif text-[15px] sm:text-[16px] font-light italic leading-relaxed text-[#1C1916]">
                                  Weaver's hands to brave every seal convection
                                  what the-willsart of dimart and chant in the
                                  loom.
                                </p>
                              </div>
                              <Link
                                to="/journal"
                                className="group inline-flex items-center gap-1.5 font-sans text-[9px] sm:text-[10px] font-semibold tracking-[0.15em] uppercase text-[#1C1916] border-b border-[#1C1916]/20 pb-0.5 w-fit mt-5 hover:border-[#1C1916] transition-all cursor-pointer"
                              >
                                <span>The Loom (Journal)</span>
                                <ArrowRight
                                  size={12}
                                  strokeWidth={1.5}
                                  className="transition-transform duration-300 group-hover:translate-x-1"
                                />
                              </Link>
                            </div>
                          </div>
                        );
                      }

                      // Standard Product Card
                      return (
                        <ProductCard
                          key={p._id || p.id}
                          p={p}
                          viewMode={viewMode}
                        />
                      );
                    })}
                  </div>

                  {/* 8. Load More button — hidden once every matching product is visible */}
                  {hasMoreToShow && (
                    <div className="flex justify-center mt-16 sm:mt-20">
                      <button
                        onClick={() => setVisibleCount(sortedProducts.length)}
                        className="border border-[#1C1916] text-[#1C1916] hover:bg-[#1C1916] hover:text-white transition-colors duration-300 px-10 py-3.5 text-[10px] font-semibold tracking-[0.25em] uppercase rounded-[1px]"
                      >
                        LOAD MORE
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 9. Site Footer */}
      <SiteFooter />
    </div>
  );
}
