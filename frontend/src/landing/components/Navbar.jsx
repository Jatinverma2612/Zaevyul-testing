import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  LogOut,
  Globe,
  ChevronDown,
} from "lucide-react";
import { api, getCategorySlug } from "../../lib/api";
import { useCart } from "../../context/CartContext";
import { useFavorite } from "../../context/FavoritesContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import CurrencySelector from "../../components/CurrencySelector";
import { useCurrency } from "../../context/CurrencyContext";
import Logo from "../../components/Logo";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/collections", hasDropdown: true },
  { label: "Men", href: "/collections?gender=men" },
  { label: "Women", href: "/collections?gender=women" },
  { label: "About Us", href: "/about" },
  { label: "Journal", href: "/journal" },
];

const DEFAULT_STORE_NAME = "Zaevyul";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const { setIsOpen: setCartOpen, totals, isBadgeAnimated } = useCart();
  const { setIsOpen: setWishlistOpen, items: wishlistItems } = useFavorite();
  const { user, isAuthenticated, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatPrice } = useCurrency();

  const handleNavClick = (href) => {
    setShopDropdownOpen(false);
    setMobileOpen(false);
    const currentPath = location.pathname + location.search;
    if (currentPath === href || (href === "/" && location.pathname === "/")) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [mobileShopExpand, setMobileShopExpand] = useState(false);

  // Load products and categories when search is opened
  const openSearchPanel = async () => {
    setSearchOpen(true);
    if (products.length === 0 || categories.length === 0) {
      setLoadingData(true);
      try {
        const prodData = api.products.listPublic
          ? await api.products.listPublic()
          : await api.products.list();
        const catData = await api.categories.list();
        setProducts(prodData || []);
        setCategories(catData || []);
      } catch (err) {
        console.error("Error fetching search data:", err);
      } finally {
        setLoadingData(false);
      }
    }
  };

  // Close search panel on ESC key
  useEffect(() => {
    if (!searchOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  // Price formatting helper matching the rest of the site
  const getProductPrice = (p) => {
    const priceVal = p.discountPrice || p.basePrice;
    return formatPrice(priceVal);
  };

  // Levenshtein distance calculator for typo correction
  const levenshteinDistance = (a, b) => {
    const tmp = [];
    for (let i = 0; i <= a.length; i++) {
      tmp[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      tmp[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        tmp[i][j] =
          a[i - 1] === b[j - 1]
            ? tmp[i - 1][j - 1]
            : Math.min(
                tmp[i - 1][j - 1] + 1,
                tmp[i][j - 1] + 1,
                tmp[i - 1][j] + 1,
              );
      }
    }
    return tmp[a.length][b.length];
  };

  const isWordFuzzyMatch = (queryWord, targetWord) => {
    if (targetWord.includes(queryWord) || queryWord.includes(targetWord))
      return true;

    const distance = levenshteinDistance(queryWord, targetWord);
    if (queryWord.length <= 3) {
      return distance === 0;
    }
    if (queryWord.length <= 4) {
      return distance <= 1; // e.g., "sawl" (4) vs "shawl" (5) is 1
    }
    if (queryWord.length <= 6) {
      return distance <= 2; // e.g., "creme" (5) vs "cream" (5) is 2, "shael" (5) vs "shawl" (5) is 1, "blaket" (6) vs "blanket" (7) is 1
    }
    return distance <= 3; // e.g., "pashmena" (8) vs "pashmina" (8) is 1
  };

  const isTextFuzzyMatch = (targetText, queryTokens) => {
    if (!targetText) return false;
    const targetWords = targetText
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

    return queryTokens.every((qToken) => {
      return targetWords.some((tWord) => isWordFuzzyMatch(qToken, tWord));
    });
  };

  // Fuzzy-matching search logic with typo correction support
  const getSearchResults = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { products: [], categories: [] };

    const queryTokens = q.split(/\s+/).filter(Boolean);

    const matchedCategories = categories.filter((c) => {
      const catText = `${c.name} ${c.description || ""}`;
      return isTextFuzzyMatch(catText, queryTokens);
    });

    const matchedProducts = products.filter((p) => {
      const catObj = categories.find((c) => c.id === p.category);
      const catName = catObj ? catObj.name : "";
      const tagsStr = (p.tags || []).join(" ");
      const productText = `${p.name} ${p.description || ""} ${p.sku || ""} ${p.material || ""} ${p.color || ""} ${catName} ${tagsStr}`;

      return isTextFuzzyMatch(productText, queryTokens);
    });

    return {
      products: matchedProducts,
      categories: matchedCategories,
    };
  };

  const results = getSearchResults();
  const storeName = (settings?.storeName || DEFAULT_STORE_NAME).trim();
  const displayStoreName = (storeName || DEFAULT_STORE_NAME).toUpperCase();

  const activeCategories = categories.filter((c) => c.status !== "inactive");
  const categoryColumns = [];
  for (let i = 0; i < activeCategories.length; i += 10) {
    categoryColumns.push(activeCategories.slice(i, i + 10));
  }

  useEffect(() => {
    let active = true;
    const fetchInitialData = async () => {
      try {
        const catData = await api.categories.list();
        if (active && Array.isArray(catData)) {
          setCategories(catData);
        }
      } catch (err) {
        console.error("Error loading categories in Navbar:", err);
      }
    };
    fetchInitialData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const data = await api.settings.getPublicLive();
        if (active) setSettings(data);
      } catch (err) {
        console.error("Error loading settings in Navbar:", err);
        if (active) setSettings(null);
      }
    };
    fetchSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleWishlistClick = () => {
    if (isAuthenticated) {
      setWishlistOpen(true);
    } else {
      navigate("/login", { state: { from: "/" } });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-[68px] items-center justify-between border-b border-[#E7DED3] bg-[#FAF8F5]/92 px-3 backdrop-blur-xl sm:px-8 lg:px-14 xl:px-18">
        {/* Search Overlay */}
        {searchOpen && (
          <div className="absolute inset-0 z-50 flex h-[68px] items-center bg-[#FAF8F5] px-3 sm:px-8 lg:px-14 xl:px-18 border-b border-[#E7DED3]">
            <div className="relative flex w-full min-w-0 items-center gap-2 sm:gap-3">
              <Search
                size={18}
                aria-hidden="true"
                className="text-[#1C1916]/60"
                strokeWidth={1.4}
              />
              <input
                type="text"
                autoFocus
                aria-label="Search products and collections"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products and collections"
                className="min-w-0 flex-1 bg-transparent font-sans text-[13px] text-[#1C1916] placeholder-[#1C1916]/40 focus:outline-none"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1 text-[#1C1916]/60 hover:text-[#1C1916] cursor-pointer"
              >
                <X size={18} strokeWidth={1.4} />
              </button>
            </div>
          </div>
        )}

        {/* Search Results Dropdown */}
        {searchOpen && (
          <div className="absolute top-[67px] left-0 right-0 z-40 border-b border-[#E7DED3] bg-[#FAF8F5]/98 shadow-[0_20px_40px_rgba(28,25,22,0.08)] backdrop-blur-xl max-h-[75vh] overflow-y-auto">
            <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-4 py-5 text-left sm:gap-8 sm:px-8 sm:py-8 md:grid-cols-4 lg:px-14 xl:px-18">
              {/* Left Column: Categories */}
              <div className="md:col-span-1 md:border-r border-[#E7DED3]/40 md:pr-6">
                <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#1C1916]/45 mb-4">
                  {searchQuery ? "Matching Categories" : "Explore Collections"}
                </h3>
                <div className="flex flex-col gap-2">
                  {loadingData ? (
                    <div className="text-[12px] text-[#8A857E] animate-pulse">
                      Loading categories...
                    </div>
                  ) : (searchQuery ? results.categories : categories).length >
                    0 ? (
                    (searchQuery ? results.categories : categories)
                      .slice(0, 6)
                      .map((cat) => (
                        <Link
                          key={cat.id || cat.slug}
                          to={`/collections/${cat.slug}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="text-[13px] font-medium text-[#1C1916] hover:text-[#B58A5B] transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))
                  ) : (
                    <div className="text-[12px] text-[#8A857E] italic">
                      No categories found
                    </div>
                  )}
                </div>
              </div>

              {/* Right Columns: Products */}
              <div className="md:col-span-3">
                <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#1C1916]/45 mb-4">
                  {searchQuery
                    ? `Products (${results.products.length})`
                    : "Featured Pieces"}
                </h3>

                {loadingData ? (
                  <div className="text-[12px] text-[#8A857E] animate-pulse">
                    Loading products...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                    {(searchQuery
                      ? results.products
                      : products.filter((p) => p.featured)
                    )
                      .slice(0, 8)
                      .map((prod) => {
                        const catSlug = getCategorySlug(prod.category);
                        return (
                          <Link
                            key={prod.id}
                            to={`/collection/${catSlug}/${prod.slug}`}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-[#F5EFE7]/40 rounded-[2px] transition-colors group"
                          >
                            <img
                              src={
                                prod.images?.[0]?.url ||
                                "/storefront/prod-1.png"
                              }
                              alt={prod.name}
                              className="w-12 h-16 object-cover bg-[#F5EFE7] rounded-[2px] border border-[#E7DED3]/40"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-serif text-[13.5px] text-[#1C1916] truncate group-hover:text-[#B58A5B] transition-colors">
                                {prod.name}
                              </h4>
                              <p className="font-sans text-[10px] text-[#8A857E] uppercase tracking-wider mt-0.5 truncate">
                                {prod.color} • {prod.material}
                              </p>
                            </div>
                            <div className="text-right flex flex-col justify-center">
                              <span className="font-sans text-[12px] font-semibold text-[#1C1916]">
                                {getProductPrice(prod)}
                              </span>
                              {prod.discountPrice && (
                                <span className="font-sans text-[9px] text-[#8A857E] line-through">
                                  {formatPrice(prod.basePrice)}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}

                    {!(
                      searchQuery
                        ? results.products
                        : products.filter((p) => p.featured)
                    ).length && (
                      <div className="col-span-2 py-8 text-center text-[13px] text-[#8A857E] italic">
                        No products found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="hidden items-center lg:flex gap-7 relative z-20">
          {NAV_LINKS.map((link) => {
            if (link.hasDropdown) {
              return (
                <div
                  key={link.label}
                  className="relative flex items-center"
                  onMouseEnter={() => setShopDropdownOpen(true)}
                  onMouseLeave={() => setShopDropdownOpen(false)}
                >
                  <div className="flex items-center gap-1 py-4 cursor-pointer">
                    <Link
                      to={link.href}
                      className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1C1916]/64 transition-colors duration-200 hover:text-[#1C1916]"
                      onClick={() => handleNavClick(link.href)}
                    >
                      {link.label}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShopDropdownOpen((prev) => !prev);
                      }}
                      className="text-[#1C1916]/64 hover:text-[#1C1916] transition-colors p-0.5"
                      aria-label="Toggle Shop categories menu"
                    >
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${
                          shopDropdownOpen ? "rotate-180 text-[#1C1916]" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mega Dropdown Panel for Categories (10 items per column, filling column first) */}
                  {shopDropdownOpen && (
                    <div
                      className="absolute top-full left-0 z-50 mt-0 min-w-[260px] max-w-[85vw] border border-[#E7DED3] bg-[#FAF8F5]/98 p-6 shadow-[0_20px_40px_rgba(28,25,22,0.12)] backdrop-blur-xl rounded-[2px] transition-all animate-fade-in"
                      onMouseEnter={() => setShopDropdownOpen(true)}
                      onMouseLeave={() => setShopDropdownOpen(false)}
                    >
                      <div className="mb-3.5 flex items-center justify-between border-b border-[#E7DED3]/60 pb-2">
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#1C1916]/45">
                          Categories
                        </span>
                        <Link
                          to="/collections"
                          onClick={() => handleNavClick("/collections")}
                          className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B58A5B] hover:underline"
                        >
                          Shop All →
                        </Link>
                      </div>

                      {activeCategories.length === 0 ? (
                        <div className="py-3 text-[12px] text-[#8A857E] italic">
                          Loading categories...
                        </div>
                      ) : (
                        <div className="flex gap-8 lg:gap-10">
                          {categoryColumns.map((col, colIdx) => (
                            <div
                              key={colIdx}
                              className="flex min-w-[130px] flex-col gap-2"
                            >
                              {col.map((cat) => {
                                const catPath = `/collections/${cat.slug || cat._id || cat.id}`;
                                return (
                                  <Link
                                    key={cat.id || cat.slug || cat._id}
                                    to={catPath}
                                    onClick={() => handleNavClick(catPath)}
                                    className="font-sans text-[12px] font-medium text-[#1C1916]/80 transition-colors hover:text-[#B58A5B] py-0.5 truncate"
                                  >
                                    {cat.name}
                                  </Link>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1C1916]/64 transition-colors duration-200 hover:text-[#1C1916]"
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <button
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="text-[#1C1916]/70 transition-colors hover:text-[#1C1916] lg:hidden relative z-20"
        >
          <Menu size={20} strokeWidth={1.4} />
        </button>

        <Link
          to="/"
          onClick={() => handleNavClick("/")}
          className="absolute left-1/2 -translate-x-1/2 text-center flex items-center justify-center cursor-pointer z-10"
        >
          <Logo variant="header" />
        </Link>

        <div className="flex min-w-0 items-center gap-[18px] sm:gap-4 lg:gap-5 text-[#1C1916]/70 relative z-20">
          <CurrencySelector className="hidden lg:inline-block" />
          <button
            aria-label="Search"
            onClick={openSearchPanel}
            className="shrink-0 p-1 transition-colors hover:text-[#1C1916]"
          >
            <Search size={17} strokeWidth={1.4} />
          </button>

          {/* User icon — links to account or login */}
          {isAuthenticated ? (
            <div className="hidden lg:flex items-center gap-3">
              <Link
                to="/my-account"
                aria-label="My Account"
                className="transition-colors hover:text-[#1C1916] cursor-pointer flex items-center gap-1.5"
                title={user?.name || "My Account"}
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-[#E6DED4]"
                  />
                ) : (
                  <User size={17} strokeWidth={1.4} />
                )}
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              aria-label="Sign In"
              className="hidden lg:block transition-colors hover:text-[#1C1916] cursor-pointer"
            >
              <User size={17} strokeWidth={1.4} />
            </Link>
          )}

          {/* Heart / Wishlist */}
          <button
            aria-label={
              isAuthenticated ? "Wishlist" : "Sign in to save favorites"
            }
            className="hidden lg:block transition-colors hover:text-[#1C1916] relative cursor-pointer"
            onClick={handleWishlistClick}
          >
            <Heart size={17} strokeWidth={1.4} className="text-[#1C1916]/70" />
            {isAuthenticated && wishlistItems.length > 0 && (
              <span className="absolute -right-1.5 -top-1 flex h-[13px] w-[13px] items-center justify-center rounded-full bg-[#B58A5B] text-[8px] font-bold leading-none text-white transition-all duration-300 animate-fade-in">
                {wishlistItems.length}
              </span>
            )}
          </button>

          <Link
            to="/cart"
            aria-label="Bag"
            className="relative transition-colors hover:text-[#1C1916] cursor-pointer"
          >
            <ShoppingBag size={17} strokeWidth={1.4} />
            <span
              className={`absolute -right-1.5 -top-1 flex h-[13px] w-[13px] items-center justify-center rounded-full bg-[#B58A5B] text-[8px] font-bold leading-none text-white transition-all duration-300 ${
                isBadgeAnimated ? "scale-[1.3] bg-[#825433]" : ""
              }`}
            >
              {totals.itemCount}
            </span>
          </Link>
        </div>
      </nav>

      {/* Search Backdrop Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 top-[68px] z-30 bg-[#1C1916]/15 backdrop-blur-[2px]"
          onClick={() => {
            setSearchOpen(false);
            setSearchQuery("");
          }}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-[200] flex flex-col bg-[#FAF8F5] transition-transform duration-500 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[68px] items-center justify-between border-b border-[#E8E1D9] px-6 sm:px-8">
          <span
            className="max-w-[calc(100vw-96px)] truncate whitespace-nowrap font-serif text-[16px] uppercase tracking-[0.2em] text-[#1C1916] sm:text-[18px] sm:tracking-[0.28em]"
            title={storeName}
          >
            {displayStoreName}
          </span>
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="text-[#1C1916]"
          >
            <X size={20} strokeWidth={1.4} />
          </button>
        </div>
        <nav className="flex flex-col px-6 pt-6 sm:px-8 max-h-[calc(100vh-170px)] overflow-y-auto">
          {NAV_LINKS.map((link, idx) => {
            if (link.hasDropdown) {
              return (
                <div
                  key={link.label}
                  style={{
                    transitionDelay: mobileOpen ? `${idx * 70}ms` : "0ms",
                  }}
                  className={`border-b border-[#E8E1D9] py-4 transition-all duration-[750ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] first:border-t
                    ${mobileOpen ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"}`}
                >
                  <div className="flex items-center justify-between">
                    <Link
                      to={link.href}
                      onClick={() => handleNavClick(link.href)}
                      className="font-serif text-[27px] font-light text-[#1C1916] transition-colors hover:text-[#B58A5B]"
                    >
                      {link.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMobileShopExpand((prev) => !prev)}
                      className="p-2 text-[#1C1916]/70 hover:text-[#1C1916]"
                      aria-label="Toggle categories"
                    >
                      <ChevronDown
                        size={20}
                        className={`transition-transform duration-200 ${
                          mobileShopExpand ? "rotate-180 text-[#B58A5B]" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {mobileShopExpand && (
                    <div className="mt-3 flex flex-col gap-2 pl-4 border-l border-[#B58A5B]/30 my-2">
                      <Link
                        to="/collections"
                        onClick={() => handleNavClick("/collections")}
                        className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#B58A5B] py-1"
                      >
                        Shop All Products →
                      </Link>
                      {activeCategories.map((cat) => {
                        const catPath = `/collections/${cat.slug || cat._id || cat.id}`;
                        return (
                          <Link
                            key={cat.id || cat.slug || cat._id}
                            to={catPath}
                            onClick={() => handleNavClick(catPath)}
                            className="font-sans text-[13.5px] font-medium text-[#1C1916]/80 hover:text-[#B58A5B] transition-colors py-0.5"
                          >
                            {cat.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                style={{
                  transitionDelay: mobileOpen ? `${idx * 70}ms` : "0ms",
                }}
                className={`border-b border-[#E8E1D9] py-5 font-serif text-[27px] font-light text-[#1C1916] transition-all duration-[750ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] first:border-t hover:pl-3
                  ${mobileOpen ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Drawer Footer */}
        <div className="mt-auto border-t border-[#E8E1D9] p-6 sm:p-8 flex flex-col gap-4 bg-[#FAF8F5]">
          <div className="flex justify-around items-center w-full">
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1C1916]/70 hover:text-[#1C1916] cursor-pointer"
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <User size={16} strokeWidth={1.4} />
                  )}
                  <span>{user?.name?.split(" ")[0] || "Account"}</span>
                </Link>
                <div className="h-4 w-px bg-[#E8E1D9]" />
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1C1916]/70 hover:text-[#1C1916]"
                >
                  <LogOut size={16} strokeWidth={1.4} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1C1916]/70 hover:text-[#1C1916] cursor-pointer"
                >
                  <User size={16} strokeWidth={1.4} />
                  <span>Sign In</span>
                </Link>
                <div className="h-4 w-px bg-[#E8E1D9]" />
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleWishlistClick();
                  }}
                  className="flex items-center gap-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1C1916]/70 hover:text-[#1C1916]"
                >
                  <Heart size={16} strokeWidth={1.4} />
                  <span>Wishlist</span>
                </button>
              </>
            )}
          </div>
          <div className="h-px w-full bg-[#E8E1D9]/60" />
          <div className="flex items-center justify-between gap-3 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1C1916]/80 py-1">
            <div className="flex items-center gap-2 text-[#1C1916]">
              <Globe size={16} strokeWidth={1.4} />
              <span>Currency</span>
            </div>
            <CurrencySelector dropUp={true} />
          </div>
        </div>
      </div>
    </>
  );
}
