import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Heart,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  Ruler,
  Maximize2,
  X,
  Star,
  Upload,
} from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import CraftHighlight from "../components/CraftHighlight";
import RelatedProducts from "../components/RelatedProducts";

import { api, getCategorySlug, getHoverImage } from "../../lib/api";
import { updateProductSEO, resetSEO } from "../../lib/seo";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useToast } from "../../context/ToastContext";
import { useFavorite } from "../../context/FavoritesContext";
import { usePersonalization } from "../../context/PersonalizationContext";

// Helper functions
const getProductCategory = (p) => {
  if (!p || !p.category) return "Uncategorized";
  if (typeof p.category === "string") return p.category.toUpperCase();
  return (p.category?.name || "PASHMINA & SHAWLS").toUpperCase();
};

const getProductImage = (p) => {
  if (!p) return "";
  return p.img || (p.images && p.images[0]?.url) || "/storefront/prod-1.png";
};

const getGalleryImages = (prod) => {
  if (!prod) return ["/storefront/prod-1.png"];
  const mainImg =
    prod.img ||
    (prod.images && prod.images[0]?.url) ||
    "/storefront/prod-1.png";
  const hoverImg =
    prod.hoverImg || getHoverImage(prod) || "/storefront/prod-2.png";

  const list = [];
  if (hoverImg) list.push(hoverImg);

  if (Array.isArray(prod.images) && prod.images.length > 0) {
    prod.images.forEach((imgObj) => {
      const url = typeof imgObj === "string" ? imgObj : imgObj?.url;
      if (url && url !== hoverImg && url !== mainImg && !list.includes(url)) {
        list.push(url);
      }
    });
  }

  if (mainImg && !list.includes(mainImg)) {
    list.push(mainImg);
  }

  if (list.length === 0) list.push("/storefront/prod-1.png");
  return list;
};

export default function ProductDetailPage() {
  const { categorySlug, productSlug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColorObj, setSelectedColorObj] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const galleryImages = useMemo(() => {
    if (!product) return ["/storefront/prod-1.png"];
    if (selectedColorObj) {
      const list = [];
      if (selectedColorObj.mainImage) list.push(selectedColorObj.mainImage);
      if (Array.isArray(selectedColorObj.galleryImages)) {
        selectedColorObj.galleryImages.forEach((img) => {
          if (img && !list.includes(img)) list.push(img);
        });
      }
      if (list.length > 0) return list;
    }
    return getGalleryImages(product);
  }, [product, selectedColorObj]);

  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    totalCount: 0,
    avgRating: 5.0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    fitCounts: { "True to Size": 0, "Runs Small": 0, "Runs Large": 0 },
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useCustomerAuth();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
    fit: "True to Size",
    photos: [],
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const drawerRef = useRef(null);

  const handleOpenReviewModal = () => {
    if (!isAuthenticated || !user) {
      toast(
        "Only logged-in customers who received this product can write a review. Please log in.",
        "warning",
      );
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setReviewModalOpen(true);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = reviewForm.photos ? reviewForm.photos.length : 0;
    if (currentCount >= 3) {
      toast("Maximum limit of 3 photos reached per review.", "warning");
      return;
    }

    const availableSlots = 3 - currentCount;
    if (files.length > availableSlots) {
      toast(
        `You can only add ${availableSlots} more photo(s). Maximum 3 photos allowed per review.`,
        "warning",
      );
    }

    const selectedFiles = files.slice(0, availableSlots);
    setUploadingPhotos(true);
    let loaded = 0;
    const newPhotos = [];

    selectedFiles.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast(
          `${file.name} exceeds 5MB limit. Please upload images under 5MB.`,
          "warning",
        );
        loaded++;
        if (loaded === selectedFiles.length) setUploadingPhotos(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          newPhotos.push(reader.result);
        }
        loaded++;
        if (loaded === selectedFiles.length) {
          setReviewForm((prev) => ({
            ...prev,
            photos: [...(prev.photos || []), ...newPhotos].slice(0, 3),
          }));
          setUploadingPhotos(false);
        }
      };
      reader.onerror = () => {
        loaded++;
        if (loaded === selectedFiles.length) setUploadingPhotos(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index) => {
    setReviewForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const { addToCart, isInCart, setIsOpen: setCartOpen } = useCart();
  const { formatPrice } = useCurrency();
  const toast = useToast();
  const { isFavorite, toggleFavorites } = useFavorite();
  const { addRecentlyViewed, recentlyViewed } = usePersonalization();

  const inCart = product ? isInCart(product._id || product.id) : false;

  const [categoryInfo, setCategoryInfo] = useState(null);

  useEffect(() => {
    if (!product) return;
    addRecentlyViewed(product);
    const fetchReviews = async () => {
      try {
        const data = await api.reviews.get(product._id || product.id);
        if (data && data.success) {
          setReviewsData(data);
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
      }
    };
    const fetchCategoryDetails = async () => {
      if (!product || !product.category) return;
      try {
        const allCats = await api.categories.list();
        const catIdOrName =
          typeof product.category === "object"
            ? product.category._id ||
              product.category.id ||
              product.category.name
            : product.category;

        const matched = allCats.find(
          (c) =>
            c._id === catIdOrName ||
            c.id === catIdOrName ||
            c.slug === catIdOrName ||
            (c.name &&
              String(c.name).toLowerCase() ===
                String(catIdOrName).toLowerCase()),
        );

        if (matched) {
          setCategoryInfo(matched);
          return;
        }
      } catch (err) {
        console.warn("Could not load category size chart info:", err);
      }

      if (typeof product.category === "object") {
        setCategoryInfo(product.category);
      }
    };
    fetchReviews();
    fetchCategoryDetails();
  }, [product]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast("Please log in to submit a review.", "warning");
      return;
    }
    if (!reviewForm.comment) {
      toast("Please write your review comment", "warning");
      return;
    }
    setSubmittingReview(true);
    try {
      const payload = {
        name: user.name || user.email || "Verified Buyer",
        email: user.email || "",
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        fit: reviewForm.fit,
        photos: reviewForm.photos || [],
      };
      await api.reviews.create(product._id || product.id, payload);
      toast("Thank you! Your review has been published.", "success");
      setReviewModalOpen(false);
      setReviewForm({
        rating: 5,
        title: "",
        comment: "",
        fit: "True to Size",
        photos: [],
      });
      const data = await api.reviews.get(product._id || product.id);
      if (data && data.success) setReviewsData(data);
    } catch (err) {
      toast(err.message || "Failed to submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y, show: true });
  };

  const availableSizes = useMemo(() => {
    if (
      selectedColorObj &&
      selectedColorObj.sizes &&
      selectedColorObj.sizes.length > 0
    ) {
      return selectedColorObj.sizes;
    }
    if (product && product.sizes && product.sizes.length > 0) {
      return product.sizes;
    }
    return [];
  }, [selectedColorObj, product]);

  useEffect(() => {
    if (
      selectedColorObj &&
      selectedColorObj.sizes &&
      selectedColorObj.sizes.length > 0
    ) {
      const defaultSize =
        selectedColorObj.sizes.find((s) => s.quantity > 0) ||
        selectedColorObj.sizes[0];
      if (defaultSize) {
        setSelectedSize(defaultSize.size);
      }
    }
  }, [selectedColorObj]);

  const handleMouseLeave = () => {
    setZoomPos((prev) => ({ ...prev, show: false }));
  };

  const getProductPrice = (p) => {
    if (!p) return "";
    if (
      selectedColorObj &&
      selectedColorObj.sizes &&
      selectedColorObj.sizes.length > 0
    ) {
      const matchedSize =
        selectedColorObj.sizes.find((s) => s.size === selectedSize) ||
        selectedColorObj.sizes[0];
      if (matchedSize) {
        return formatPrice(matchedSize.discountPrice || matchedSize.price);
      }
    }
    if (p.sizes && p.sizes.length > 0) {
      const activeSizeObj =
        p.sizes.find((s) => s.size === selectedSize) || p.sizes[0];
      return formatPrice(activeSizeObj.discountPrice || activeSizeObj.price);
    }
    return formatPrice(p.discountPrice || p.basePrice);
  };

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const isScrollingRef = useRef(false);
  const accumulatedDeltaRef = useRef(0);
  const galleryRef = useRef(null);

  // CSS transition duration for the slide transform (ms). Keep this in
  // sync with the `duration-700` class on the sliding container below.
  const TRANSITION_MS = 700;
  // Minimum accumulated scroll (px) before we advance to the next image.
  // Lets gentle/high-res trackpad ticks build up instead of being ignored.
  const ADVANCE_THRESHOLD = 40;

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (galleryImages.length <= 1) return;

      const delta = e.deltaY;
      if (delta === 0) return;

      const atFirst = activeIndexRef.current === 0;
      const atLast = activeIndexRef.current === galleryImages.length - 1;

      // Boundary reached in the scroll direction: hand off to the page.
      // Do NOT preventDefault — let the browser scroll the document
      // normally, and reset any accumulated delta from the gallery.
      if (delta > 0 && atLast) {
        accumulatedDeltaRef.current = 0;
        return;
      }
      if (delta < 0 && atFirst) {
        accumulatedDeltaRef.current = 0;
        return;
      }

      // The gallery owns this event. Prevent the page from moving on
      // EVERY tick it owns — including small trackpad deltas — so no
      // partial scroll leaks through to the document.
      e.preventDefault();

      // Already mid-transition: swallow the event (page stays put,
      // gallery doesn't queue a second jump) and wait for it to finish.
      if (isScrollingRef.current) return;

      accumulatedDeltaRef.current += delta;

      if (Math.abs(accumulatedDeltaRef.current) < ADVANCE_THRESHOLD) return;

      const direction = accumulatedDeltaRef.current > 0 ? 1 : -1;
      accumulatedDeltaRef.current = 0;

      isScrollingRef.current = true;
      setActiveIndex((prev) => {
        const next = Math.min(
          Math.max(prev + direction, 0),
          galleryImages.length - 1,
        );
        activeIndexRef.current = next;
        return next;
      });

      setTimeout(() => {
        isScrollingRef.current = false;
      }, TRANSITION_MS);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [galleryImages.length]);

  const [accordions, setAccordions] = useState({
    details: true,
    shipping: false,
    care: false,
    artisan: false,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    return () => {
      resetSEO();
    };
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.products.getBySlug(productSlug);
        setProduct(data);
        if (data) {
          updateProductSEO(data);
        }
        if (data && data.colors && data.colors.length > 0) {
          setSelectedColorObj(data.colors[0]);
        } else {
          setSelectedColorObj(null);
        }
        if (data && data.sizes && data.sizes.length > 0) {
          const defaultSize =
            data.sizes.find((s) => s.quantity > 0) || data.sizes[0];
          setSelectedSize(defaultSize.size);
          if (defaultSize.quantity <= 0) {
            setQuantity(0);
          }
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    if (productSlug) {
      fetchProduct();
    }
  }, [productSlug]);

  const toggleAccordion = (section) => {
    setAccordions((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeSizeObj =
    availableSizes && availableSizes.length > 0
      ? availableSizes.find((s) => s.size === selectedSize) || availableSizes[0]
      : null;
  const stock = activeSizeObj
    ? activeSizeObj.quantity
    : product
      ? product.quantity
      : 0;

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrement = () => {
    let maxStock = 99;
    if (activeSizeObj) {
      maxStock = activeSizeObj.quantity;
    } else if (product && typeof product.quantity !== "undefined") {
      maxStock = product.quantity;
    }

    if (quantity < maxStock) {
      setQuantity(quantity + 1);
    } else {
      toast(
        `Only ${maxStock} items are available in stock for this size.`,
        "warning",
      );
    }
  };

  const handleAddToBag = () => {
    if (!product) return;
    let stock = 99;
    if (activeSizeObj) {
      stock = activeSizeObj.quantity;
    } else if (typeof product.quantity !== "undefined") {
      stock = product.quantity;
    }

    if (stock <= 0) {
      toast("This product size is currently out of stock", "error");
      return;
    }
    setAdding(true);
    setTimeout(() => {
      const finalColor = selectedColorObj
        ? selectedColorObj.name
        : product.color || "";
      addToCart(product, quantity, selectedSize, finalColor);
      setAdding(false);
    }, 600);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1916] font-sans flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#B58A5B] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-serif text-[18px] font-light text-[#6B6560] italic">
            Loading heritage...
          </p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1916] font-sans flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
          <h2 className="font-serif text-[24px] font-light text-[#1C1916] mb-3">
            Product Not Found
          </h2>
          <p className="text-[14px] text-[#6B6560] font-light mb-8 max-w-[360px]">
            The product you are looking for does not exist or may have been
            removed.
          </p>
          <Link
            to="/collections"
            className="bg-[#1C1916] hover:bg-[#B58A5B] text-white py-3.5 px-8 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] rounded-[1px] transition-colors duration-300"
          >
            EXPLORE COLLECTIONS
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const currentCategorySlug = categorySlug || getCategorySlug(product.category);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1916] font-sans selection:bg-[#B58A5B] selection:text-white">
      {/* 2. Navbar */}
      <Navbar />

      <main className="pt-20 pb-16 sm:pb-24">
        {/* 3. Breadcrumbs */}
        <div className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 w-full pt-6 pb-6 sm:pb-10">
          <nav className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A857E]">
            <Link to="/" className="hover:text-[#1C1916] transition-colors">
              HOME
            </Link>
            <span className="mx-2 text-[#E6DED4] sm:mx-3">/</span>
            <Link
              to="/collections"
              className="hover:text-[#1C1916] transition-colors"
            >
              COLLECTIONS
            </Link>
            <span className="mx-2 text-[#E6DED4] sm:mx-3">/</span>
            <Link
              to={`/collections/${currentCategorySlug}`}
              className="hover:text-[#1C1916] transition-colors"
            >
              {getProductCategory(product)}
            </Link>
            <span className="mx-2 text-[#E6DED4] sm:mx-3">/</span>
            <span className="text-[#1C1916]">{product.name}</span>
          </nav>
        </div>

        {/* 4. Product Gallery & Specs Block */}
        <section className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1.18fr_0.82fr] gap-10 lg:gap-16 xl:gap-24 items-start">
            {/* Left Side: TOTEME-Style Product Gallery (Full-size photography) */}
            <div>
              {/* Desktop Viewport (≥ lg): Clean Vertical Photography Gallery */}
              <div
                ref={galleryRef}
                onClick={() => {
                  setLightboxIndex(activeIndex);
                  setLightboxOpen(true);
                }}
                className="relative hidden lg:block w-full h-[calc(100vh-120px)] min-h-[620px] max-h-[920px] overflow-hidden rounded-[2px] bg-[#EFE9E1] cursor-pointer"
              >
                {/* Vertical Sliding Container */}
                <div
                  className="w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ transform: `translateY(-${activeIndex * 100}%)` }}
                >
                  {galleryImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="w-full h-full shrink-0 relative overflow-hidden bg-[#EFE9E1]"
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} - View ${idx + 1}`}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Viewport (< lg): Horizontal Touch Scroll Carousel */}
              <div className="block lg:hidden relative">
                <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3 pb-2 -mx-6 px-6 sm:-mx-10 sm:px-10">
                  {galleryImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setLightboxIndex(idx);
                        setLightboxOpen(true);
                      }}
                      className="snap-center shrink-0 w-[85vw] sm:w-[70vw] relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[#EFE9E1] cursor-pointer"
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} - View ${idx + 1}`}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute bottom-3 left-3 bg-[#1C1916]/70 text-white px-2.5 py-1 rounded-[2px] font-sans text-[10px] font-medium tracking-widest backdrop-blur-sm">
                        {idx + 1} / {galleryImages.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Product Configuration */}
            <div className="flex flex-col lg:sticky lg:top-24 self-start">
              {/* Category */}
              <span className="block font-sans text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase text-[#8A857E] mb-3">
                {getProductCategory(product)}
              </span>

              {/* Title */}
              <h1 className="font-serif text-[32px] sm:text-[38px] lg:text-[44px] font-light leading-[1.15] text-[#1C1916] mb-3">
                {product.name}
              </h1>

              {/* Price */}
              <span className="block font-sans text-[16px] sm:text-[18px] font-normal text-[#1C1916] mb-6">
                {getProductPrice(product)}
              </span>

              {/* Description */}
              <p className="font-sans text-[13px] sm:text-[14px] text-[#6B6560] font-light leading-relaxed mb-8 border-b border-[#ECE7E1] pb-8">
                {product.description}
              </p>

              {/* Color Swatch / Selector */}
              <div className="mb-6">
                <span className="block font-sans text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916] mb-3">
                  COLOR:{" "}
                  {selectedColorObj
                    ? selectedColorObj.name
                    : product.color || "IVORY"}
                </span>
                {product.colors && product.colors.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2.5">
                    {product.colors.map((c) => {
                      const isSelected = selectedColorObj?.name === c.name;
                      return (
                        <button
                          key={c.name}
                          onClick={() => {
                            setSelectedColorObj(c);
                            setActiveIndex(0);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 border font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] rounded-[1px] transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#1C1916] bg-[#1C1916] text-white shadow-xs"
                              : "border-[#ECE7E1] bg-white text-[#1C1916] hover:border-[#1C1916]"
                          }`}
                        >
                          {c.mainImage && (
                            <img
                              src={c.mainImage}
                              alt={c.name}
                              className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                            />
                          )}
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      aria-label={`Select color ${product.color || "Ivory"}`}
                      className="w-7 h-7 rounded-full bg-[#EFE9E1] border-2 border-[#1C1916] focus:outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Size Selector + Size Guide Button */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]">
                    SIZE: {selectedSize || product.size || "70 X 200 CM"}
                  </span>
                  {/* <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 font-sans text-[11px] font-medium text-[#B58A5B] hover:text-[#1C1916] transition-colors cursor-pointer"
                  >
                    <Ruler size={13} />
                    <span className="underline underline-offset-2">Size & Dimensions Guide</span>
                  </button> */}
                </div>
                {availableSizes && availableSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {availableSizes.map((s) => {
                      const isSelected = s.size === selectedSize;
                      const isOutOfStock = s.quantity <= 0;
                      return (
                        <button
                          key={s.size}
                          onClick={() => {
                            setSelectedSize(s.size);
                            setQuantity(isOutOfStock ? 0 : 1);
                          }}
                          className={`border font-sans text-[10px] font-semibold uppercase tracking-[0.1em] px-4 py-2.5 transition-all ${
                            isSelected
                              ? "border-[#1C1916] bg-[#1C1916] text-white"
                              : isOutOfStock
                                ? "border-[#E7DED3] text-[#8A857E]/40 cursor-not-allowed line-through bg-[#FAF8F5]/50"
                                : "border-[#ECE7E1] text-[#1C1916] bg-transparent hover:border-[#1C1916]"
                          }`}
                        >
                          {s.size} {isOutOfStock && "(Sold Out)"}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <button className="border border-[#1C1916] text-[#1C1916] font-sans text-[11px] font-semibold uppercase tracking-[0.1em] px-5 py-2.5 bg-transparent hover:bg-[#1C1916]/5 transition-colors">
                    {product.size || "70 x 200 cm"}
                  </button>
                )}
              </div>

              {/* Quantity counter */}
              <div className="mb-8 flex items-center justify-between border-t border-[#ECE7E1] pt-6">
                <span className="font-sans text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]">
                  QUANTITY
                </span>
                <div className="flex items-center border border-[#ECE7E1] bg-white">
                  <button
                    onClick={handleDecrement}
                    className="p-3 text-[#6B6560] hover:text-[#1C1916] transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-5 font-sans text-[13px] text-[#1C1916] select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="p-3 text-[#6B6560] hover:text-[#1C1916] transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Add to Bag and Wishlist Buttons */}
              <div className="flex flex-col gap-4 mb-10">
                <button
                  onClick={() => {
                    if (inCart) {
                      setCartOpen(true);
                    } else {
                      handleAddToBag();
                    }
                  }}
                  disabled={adding || (stock <= 0 && !inCart)}
                  className={`w-full py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] rounded-[1px] transition-colors duration-300 flex items-center justify-center gap-2 shadow-xs ${
                    inCart
                      ? "bg-[#1C1916] text-white hover:bg-[#2C2825] cursor-pointer"
                      : stock <= 0
                        ? "bg-[#8A857E] text-white cursor-not-allowed"
                        : "bg-[#1C1916] hover:bg-[#B58A5B] text-white cursor-pointer"
                  }`}
                >
                  {adding ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>ADDING...</span>
                    </>
                  ) : stock <= 0 ? (
                    "OUT OF STOCK"
                  ) : inCart ? (
                    <>
                      <Check size={14} strokeWidth={2.5} />
                      <span>ADDED TO BAG — VIEW CART</span>
                    </>
                  ) : (
                    "ADD TO BAG"
                  )}
                </button>
                <button
                  onClick={async () => {
                    const res = await toggleFavorites(
                      product._id || product.id,
                    );
                    if (res === "unauthenticated") {
                      toast("Please log in to add to wishlist", "info");
                    }
                  }}
                  className="w-full border border-[#1C1916] hover:bg-[#1C1916]/5 text-[#1C1916] py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] rounded-[1px] flex items-center justify-center gap-2.5 transition-colors duration-300"
                >
                  <Heart
                    size={14}
                    strokeWidth={1.5}
                    fill={
                      product && isFavorite(product._id || product.id)
                        ? "currentColor"
                        : "none"
                    }
                    className={
                      product && isFavorite(product._id || product.id)
                        ? "text-[#C94C4C]"
                        : ""
                    }
                  />
                  <span>
                    {product && isFavorite(product._id || product.id)
                      ? "REMOVE FROM WISHLIST"
                      : "ADD TO WISHLIST"}
                  </span>
                </button>
              </div>

              {/* Purchase Reassurance Badges */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#F5EFE7]/50 border border-[#E6DED4] rounded-[2px] mb-8">
                <div className="flex items-center gap-2 text-[11px] text-[#1C1916] font-medium">
                  <Check size={14} className="text-[#B58A5B] shrink-0" />
                  <span>100% Pure Pashmina</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#1C1916] font-medium">
                  <Check size={14} className="text-[#B58A5B] shrink-0" />
                  <span>Handcrafted in Kashmir</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#1C1916] font-medium">
                  <Check size={14} className="text-[#B58A5B] shrink-0" />
                  <span>Free Express Shipping</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#1C1916] font-medium">
                  <Check size={14} className="text-[#B58A5B] shrink-0" />
                  <span>Easy 7-Day Returns</span>
                </div>
              </div>

              {/* Accordion Menus */}
              <div className="divide-y divide-[#ECE7E1] border-t border-b border-[#ECE7E1]">
                {/* Accordion 1: Details */}
                <div className="py-4.5">
                  <button
                    onClick={() => toggleAccordion("details")}
                    className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                  >
                    <span>Product Details</span>
                    {accordions.details ? (
                      <ChevronUp size={14} strokeWidth={1.5} />
                    ) : (
                      <ChevronDown size={14} strokeWidth={1.5} />
                    )}
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      accordions.details
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-3.5 pl-0.5 text-[12.5px] sm:text-[13px] leading-relaxed text-[#6B6560] font-light pb-1">
                        {product.productDetails &&
                        product.productDetails.trim() ? (
                          product.productDetails
                            .split("\n")
                            .filter(Boolean)
                            .map((line, idx, arr) => (
                              <p
                                key={idx}
                                className={idx < arr.length - 1 ? "mb-2" : ""}
                              >
                                {line}
                              </p>
                            ))
                        ) : (
                          <>
                            <p className="mb-2">
                              100% pure premium Kashmiri (Pashmina).
                            </p>
                            <p className="mb-2">
                              Authentic hand-spun yarn and hand-loomed weave.
                            </p>
                            <p className="mb-2">
                              Features traditional Sozni fine needle embroidery
                              along the borders.
                            </p>
                            <p>
                              Dimensions: 70 x 200 cm (approximately 28 x 80
                              inches).
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accordion 2: Shipping */}
                <div className="py-4.5">
                  <button
                    onClick={() => toggleAccordion("shipping")}
                    className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                  >
                    <span>Shipping & Returns</span>
                    {accordions.shipping ? (
                      <ChevronUp size={14} strokeWidth={1.5} />
                    ) : (
                      <ChevronDown size={14} strokeWidth={1.5} />
                    )}
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      accordions.shipping
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-3.5 pl-0.5 text-[12.5px] sm:text-[13px] leading-relaxed text-[#6B6560] font-light pb-1">
                        <p className="mb-2">
                          Enjoy complimentary worldwide shipping on all orders.
                        </p>
                        <p className="mb-2">
                          Standard delivery takes 5-9 business days.
                        </p>
                        <p>
                          Handcrafted luxury items are eligible for exchange
                          within 14 days of delivery.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accordion 3: Care */}
                <div className="py-4.5">
                  <button
                    onClick={() => toggleAccordion("care")}
                    className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                  >
                    <span>Care Instructions</span>
                    {accordions.care ? (
                      <ChevronUp size={14} strokeWidth={1.5} />
                    ) : (
                      <ChevronDown size={14} strokeWidth={1.5} />
                    )}
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      accordions.care
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-3.5 pl-0.5 text-[12.5px] sm:text-[13px] leading-relaxed text-[#6B6560] font-light pb-1">
                        {product.careInstructions &&
                        product.careInstructions.trim() ? (
                          product.careInstructions
                            .split("\n")
                            .filter(Boolean)
                            .map((line, idx, arr) => (
                              <p
                                key={idx}
                                className={idx < arr.length - 1 ? "mb-2" : ""}
                              >
                                {line}
                              </p>
                            ))
                        ) : (
                          <>
                            <p className="mb-2">Dry clean only.</p>
                            <p className="mb-2">
                              Store in a cool, dry place wrapped in a muslin
                              cloth to protect from moths.
                            </p>
                            <p>
                              Iron on low heat under a protective cotton sheet
                              if necessary.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accordion 4: Artisan */}
                <div className="py-4.5">
                  <button
                    onClick={() => toggleAccordion("artisan")}
                    className="flex w-full items-center justify-between text-[10px] font-semibold tracking-[0.16em] uppercase text-[#1C1916]"
                  >
                    <span>Artisan Story</span>
                    {accordions.artisan ? (
                      <ChevronUp size={14} strokeWidth={1.5} />
                    ) : (
                      <ChevronDown size={14} strokeWidth={1.5} />
                    )}
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      accordions.artisan
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-3.5 pl-0.5 text-[12.5px] sm:text-[13px] leading-relaxed text-[#6B6560] font-light pb-1">
                        {product.artisanStory && product.artisanStory.trim() ? (
                          product.artisanStory
                            .split("\n")
                            .filter(Boolean)
                            .map((line, idx, arr) => (
                              <p
                                key={idx}
                                className={idx < arr.length - 1 ? "mb-2" : ""}
                              >
                                {line}
                              </p>
                            ))
                        ) : (
                          <>
                            <p className="mb-2">
                              Hand-spun by Kashmiri women and hand-woven by
                              local master weavers.
                            </p>
                            <p className="mb-2">
                              Embroidered by a skilled craftsman in Srinagar
                              over a span of 120 hours.
                            </p>
                            <p>
                              Supports sustainable fair-trade livelihoods in the
                              Kashmir valley.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Craft Highlight Component */}
      <CraftHighlight />

      {/* 6. Related Products Component */}
      <RelatedProducts />

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-[#1C1916]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-fadeIn select-none">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-10">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D9C2A7]">
              {product.name} — ({lightboxIndex + 1} / {galleryImages.length})
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Lightbox"
            >
              <X size={24} />
            </button>
          </div>

          {/* Center Viewer */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <button
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev > 0 ? prev - 1 : galleryImages.length - 1,
                )
              }
              className="absolute left-2 sm:left-6 z-10 bg-[#1C1916]/60 hover:bg-[#1C1916] text-white p-3 rounded-full transition-all border border-white/20 cursor-pointer"
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>

            <img
              src={galleryImages[lightboxIndex]}
              alt={`${product.name} High Res View ${lightboxIndex + 1}`}
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-[2px] shadow-2xl transition-all duration-300"
            />

            <button
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev < galleryImages.length - 1 ? prev + 1 : 0,
                )
              }
              className="absolute right-2 sm:right-6 z-10 bg-[#1C1916]/60 hover:bg-[#1C1916] text-white p-3 rounded-full transition-all border border-white/20 cursor-pointer"
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Bottom Thumbnail Strip */}
          <div className="flex justify-center items-center gap-3 overflow-x-auto py-2 z-10">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-[2px] overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  lightboxIndex === i
                    ? "border-[#B58A5B] scale-105"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumb ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. Customer Reviews & Social Proof Section */}
      <section className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 w-full py-16 border-t border-[#ECE7E1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B58A5B] block mb-2">
              Verified Social Proof
            </span>
            <h2 className="font-serif text-[28px] sm:text-[36px] font-light text-[#1C1916]">
              Customer Reviews & Feedback
            </h2>
          </div>
          <button
            onClick={handleOpenReviewModal}
            className="bg-[#1C1916] text-white px-7 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] rounded-[1px] hover:bg-[#B58A5B] transition-colors cursor-pointer w-fit"
          >
            Write a Review
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 items-start">
          {/* Summary Rating Box */}
          <div className="bg-[#F5EFE7]/70 p-6 sm:p-8 rounded-[2px] border border-[#E6DED4]">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-serif text-[48px] font-normal text-[#1C1916] leading-none">
                {reviewsData.avgRating || "5.0"}
              </span>
              <div className="flex items-center text-[#B58A5B] gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} fill="currentColor" />
                ))}
              </div>
            </div>
            <p className="font-sans text-[12px] text-[#6B6560] font-light mb-6">
              Based on {reviewsData.totalCount || 2} verified customer reviews
            </p>

            {/* Rating distribution */}
            <div className="space-y-2 pt-4 border-t border-[#E6DED4]">
              {[5, 4, 3, 2, 1].map((ratingNum) => {
                const count = reviewsData.ratingCounts?.[ratingNum] || 0;
                const pct =
                  reviewsData.totalCount > 0
                    ? (count / reviewsData.totalCount) * 100
                    : ratingNum === 5
                      ? 100
                      : 0;
                return (
                  <div
                    key={ratingNum}
                    className="flex items-center gap-3 font-sans text-[11px] text-[#6B6560]"
                  >
                    <span className="w-8">{ratingNum} star</span>
                    <div className="flex-1 h-1.5 bg-[#E6DED4] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B58A5B]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
              reviewsData.reviews.map((rev) => (
                <div
                  key={rev._id || rev.id}
                  className="p-6 bg-[#FAF8F5] border border-[#E6DED4] rounded-[2px]"
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-[#B58A5B] gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            fill={star <= rev.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <span className="font-sans text-[13px] font-semibold text-[#1C1916]">
                        {rev.name}
                      </span>
                      {rev.verified && (
                        <span className="font-sans text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#2E7D32] bg-[#EAF5EB] px-2 py-0.5 border border-[#C8E6C9] rounded-[2px]">
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="font-sans text-[11px] text-[#8A857E]">
                      {new Date(rev.createdAt || Date.now()).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </span>
                  </div>

                  {rev.title && (
                    <h4 className="font-serif text-[16px] font-medium text-[#1C1916] mb-2">
                      {rev.title}
                    </h4>
                  )}
                  <p className="font-sans text-[13px] text-[#6B6560] font-light leading-relaxed mb-3">
                    {rev.comment}
                  </p>

                  {rev.photos && rev.photos.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {rev.photos.map((photo, i) => (
                        <img
                          key={i}
                          src={photo}
                          alt="Customer Review"
                          className="w-16 h-16 object-cover rounded-[2px] border border-[#E6DED4]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center border border-dashed border-[#ECE7E1] p-6 rounded-[2px]">
                <p className="font-serif text-[16px] font-light text-[#6B6560]">
                  No reviews yet.
                </p>
                <p className="font-sans text-[12px] text-[#8A857E] mt-1">
                  Be the first to share your experience with this Kashmiri
                  piece.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Write a Review Modal / Mobile Framer Motion Bottom Sheet Drawer */}
      <AnimatePresence>
        {reviewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          >
            {/* Backdrop Overlay */}
            <motion.div
              onClick={() => setReviewModalOpen(false)}
              className="fixed inset-0 bg-[#1C1916]/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Draggable Drawer Sheet Container */}
            <motion.div
              ref={drawerRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 32,
                stiffness: 350,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.8 }}
              onDragEnd={(e, info) => {
                const drawerHeight = drawerRef.current
                  ? drawerRef.current.offsetHeight
                  : window.innerHeight * 0.9;
                const threshold = drawerHeight * 0.2; // 20% down threshold

                // 1. DIRECTION CHECK: If final velocity is moving UP (swiping upward), stay OPEN and snap back UP!
                if (info.velocity.y < -50) {
                  return;
                }

                // 2. DISMISSAL CHECK: If dragged past 20% threshold OR fast downward flick:
                if (info.offset.y > threshold || info.velocity.y > 250) {
                  setReviewModalOpen(false);
                }
              }}
              className="relative z-10 bg-[#FAF8F5] border border-[#E6DED4] rounded-t-[24px] sm:rounded-[2px] max-w-[540px] w-full h-[90vh] sm:h-auto sm:max-h-[90vh] p-6 sm:p-8 overflow-y-auto shadow-2xl touch-none"
              role="dialog"
              aria-modal="true"
              aria-label="Write a Review Drawer"
            >
              {/* Header Drag Handle Region */}
              <div
                className="w-full pt-2 pb-5 -mt-3 -mx-2 px-2 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center sm:hidden select-none"
                title="Drag down 20% to close"
              >
                <div className="w-14 h-1.5 bg-[#B58A5B]/60 hover:bg-[#B58A5B] rounded-full transition-colors pointer-events-none" />
              </div>

              <button
                onClick={() => setReviewModalOpen(false)}
                className="absolute top-5 right-5 text-[#1C1916]/60 hover:text-[#1C1916] p-1.5 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <h3 className="font-serif text-[24px] font-light text-[#1C1916] mb-1">
                Write a Review
              </h3>
              <p className="font-sans text-[12px] font-light text-[#B58A5B] mb-4">
                Only verified customers with a delivered order for "
                {product.name}" can post a review.
              </p>

              {/* Logged-in Customer info badge */}
              <div className="bg-[#F5EFE7] p-3.5 rounded-[2px] border border-[#E6DED4] flex items-center justify-between mb-5">
                <span className="font-sans text-[11px] text-[#6B6560]">
                  Reviewing as:
                </span>
                <span className="font-sans text-[12px] font-semibold text-[#1C1916]">
                  {user?.name || user?.email}
                </span>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1C1916] mb-2">
                    Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() =>
                          setReviewForm((prev) => ({ ...prev, rating: star }))
                        }
                        className="text-[#B58A5B] p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          size={22}
                          fill={
                            star <= reviewForm.rating ? "currentColor" : "none"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1C1916] mb-1">
                    Review Title
                  </label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g. Magnificent quality and touch"
                    className="w-full border border-[#ECE7E1] bg-white p-3 text-[13px] text-[#1C1916] rounded-[1px] focus:border-[#1C1916] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1C1916] mb-1">
                    Review Comment *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        comment: e.target.value,
                      }))
                    }
                    placeholder="Describe the fabric texture, weight, color accuracy, and overall experience..."
                    className="w-full border border-[#ECE7E1] bg-white p-3 text-[13px] text-[#1C1916] rounded-[1px] focus:border-[#1C1916] outline-none"
                  />
                </div>

                {/* Click / Drag Image Upload (Up to 3 images, 5MB max each) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1C1916]">
                      Upload Product Photos (Optional)
                    </label>
                    <span className="font-sans text-[10px] font-semibold text-[#B58A5B]">
                      {reviewForm.photos?.length || 0} / 3 photos
                    </span>
                  </div>

                  {(reviewForm.photos?.length || 0) < 3 ? (
                    <label className="border border-dashed border-[#B58A5B]/60 bg-white hover:bg-[#FAF8F5] p-5 rounded-[2px] flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
                      <Upload
                        size={22}
                        className="text-[#B58A5B] mb-1.5 group-hover:scale-110 transition-transform"
                      />
                      <span className="font-sans text-[12px] font-medium text-[#1C1916]">
                        Click or drag photos here to upload
                      </span>
                      <span className="font-sans text-[10px] text-[#8A857E] mt-0.5">
                        Up to 3 images allowed (Max 5MB each)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="bg-[#F5EFE7] p-3 rounded-[2px] border border-[#E6DED4] text-center">
                      <p className="font-sans text-[11px] text-[#B58A5B] font-medium">
                        Maximum limit of 3 photos reached. Remove a photo below
                        to upload a different one.
                      </p>
                    </div>
                  )}

                  {uploadingPhotos && (
                    <div className="flex items-center gap-2 mt-2 font-sans text-[11px] text-[#B58A5B]">
                      <div className="w-3.5 h-3.5 border-2 border-[#B58A5B] border-t-transparent rounded-full animate-spin" />
                      Uploading photos...
                    </div>
                  )}

                  {/* Uploaded Thumbnails Preview */}
                  {reviewForm.photos && reviewForm.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-3">
                      {reviewForm.photos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative w-16 h-16 rounded-[2px] overflow-hidden border border-[#E6DED4] group"
                        >
                          <img
                            src={photo}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1 right-1 bg-[#1C1916]/80 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors"
                            title="Remove photo"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[#ECE7E1] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-5 py-2.5 border border-[#1C1916]/30 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1C1916] rounded-[1px] hover:bg-[#1C1916]/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview || uploadingPhotos}
                    className="bg-[#1C1916] text-white px-7 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] rounded-[1px] hover:bg-[#B58A5B] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size & Dimensions Right-Side Drawer */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-[visibility] duration-[350ms] ${
          sizeGuideOpen
            ? "visible pointer-events-auto"
            : "invisible pointer-events-none"
        }`}
      >
        {/* Backdrop Overlay */}
        <div
          className={`fixed inset-0 bg-[#1C1916]/40 backdrop-blur-[2px] transition-opacity duration-[350ms] ease-in-out ${
            sizeGuideOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSizeGuideOpen(false)}
          aria-hidden="true"
        />

        {/* Sliding Drawer Panel from Right */}
        <div
          className={`relative z-10 flex h-full w-full flex-col bg-[#FAF8F5] border-l border-[#ECE7E1] shadow-2xl transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] sm:max-w-[460px] ${
            sizeGuideOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Size & Dimensions Guide Drawer"
        >
          {/* Drawer Header */}
          <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-[#ECE7E1] bg-[#FAF8F5] px-6 sm:px-8">
            <div className="flex items-center gap-2 text-[#1C1916]">
              <Ruler size={18} strokeWidth={1.5} />
              <h2 className="font-serif text-[16px] sm:text-[18px] uppercase tracking-[0.15em] text-[#1C1916]">
                {categoryInfo?.name
                  ? `${categoryInfo.name} Size Guide`
                  : "Size & Dimensions Guide"}
              </h2>
            </div>
            <button
              onClick={() => setSizeGuideOpen(false)}
              aria-label="Close size guide"
              className="text-[#1C1916]/70 transition-colors hover:text-[#1C1916] p-1 -mr-1 cursor-pointer"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </header>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
            <div className="bg-[#F5EFE7] p-4 border border-[#E6DED4] rounded-[2px]">
              <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B58A5B] block mb-1">
                {categoryInfo?.name
                  ? `${categoryInfo.name} Dimensions`
                  : "Handwoven Kashmiri Heritage"}
              </span>
              <p className="font-sans text-[12px] text-[#6B6560] font-light leading-relaxed">
                Every Zaevyul piece is handcrafted by master artisans. Minor
                dimension variances (± 2 cm) reflect authentic handloom
                craftsmanship.
              </p>
            </div>

            {/* Custom Category Size Chart Image if uploaded */}
            {categoryInfo?.sizeChartImage ? (
              <div className="space-y-3">
                <div className="border border-[#E6DED4] bg-white p-3 rounded-[2px] shadow-xs overflow-hidden">
                  <img
                    src={categoryInfo.sizeChartImage}
                    alt={`${categoryInfo.name} Size Chart`}
                    className="w-full h-auto object-contain rounded-[1px] hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                    onClick={() =>
                      window.open(categoryInfo.sizeChartImage, "_blank")
                    }
                    title="Click to view full resolution size chart image"
                  />
                </div>
                <p className="text-center text-[11px] text-[#8A857E] font-light italic">
                  Click chart to view full resolution in a new window
                </p>
              </div>
            ) : (
              /* Fallback Dimension Cards */
              <div className="space-y-4">
                {/* Stole */}
                <div className="border border-[#ECE7E1] bg-white p-5 rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-[16px] font-normal text-[#1C1916]">
                      Pashmina Stole
                    </h4>
                    <span className="font-sans text-[11px] font-semibold text-[#B58A5B]">
                      70 × 200 cm (28 × 78 in)
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-[#6B6560] font-light leading-relaxed">
                    Lightweight, versatile drape ideal for evening wear, neck
                    wraps, and transitional seasons.
                  </p>
                </div>

                {/* Classic Shawl */}
                <div className="border border-[#ECE7E1] bg-white p-5 rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-[16px] font-normal text-[#1C1916]">
                      Classic Shawl
                    </h4>
                    <span className="font-sans text-[11px] font-semibold text-[#B58A5B]">
                      100 × 200 cm (40 × 78 in)
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-[#6B6560] font-light leading-relaxed">
                    Generous shoulder wrap coverage. The quintessential
                    traditional Kashmiri size for weddings and formal elegance.
                  </p>
                </div>

                {/* Grand Wrap */}
                <div className="border border-[#ECE7E1] bg-white p-5 rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-[16px] font-normal text-[#1C1916]">
                      Grand Wrap / Blanket
                    </h4>
                    <span className="font-sans text-[11px] font-semibold text-[#B58A5B]">
                      135 × 240 cm (54 × 94 in)
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-[#6B6560] font-light leading-relaxed">
                    Sublime full-body cocoon wrap providing ultimate warmth,
                    luxury travel comfort, and heirloom presence.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Mobile Add to Bag Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5] border-t border-[#E6DED4] p-3 px-5 flex items-center justify-between shadow-lg">
        <div className="min-w-0 pr-3">
          <p className="font-serif text-[13px] font-normal text-[#1C1916] truncate">
            {product.name}
          </p>
          <span className="font-sans text-[12px] font-semibold text-[#B58A5B]">
            {getProductPrice(product)}
          </span>
        </div>
        <button
          onClick={() => {
            if (inCart) setCartOpen(true);
            else handleAddToBag();
          }}
          className="bg-[#1C1916] text-white px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] rounded-[1px] hover:bg-[#B58A5B] transition-colors cursor-pointer shrink-0"
        >
          {inCart ? "VIEW BAG" : "ADD TO BAG"}
        </button>
      </div>

      {/* 7. Footer */}
      <SiteFooter />
    </div>
  );
}
