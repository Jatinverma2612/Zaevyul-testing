import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useCustomerAuth } from "./CustomerAuthContext";

const PersonalizationContext = createContext(null);

export function PersonalizationProvider({ children }) {
  const { isAuthenticated, user } = useCustomerAuth();

  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const stored = localStorage.getItem("zae_recently_viewed");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("zae_recently_viewed", JSON.stringify(recentlyViewed));
    } catch {
      /* ignore */
    }
  }, [recentlyViewed]);

  const addRecentlyViewed = useCallback((product) => {
    if (!product || (!product._id && !product.id)) return;
    const productId = String(product._id || product.id);

    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => String(p._id || p.id) !== productId);
      const itemToStore = {
        _id: product._id || product.id,
        id: product.id || product._id,
        name: product.name,
        slug: product.slug || "",
        category: product.category,
        price: product.discountPrice || product.basePrice || 30000,
        image: product.img || (product.images && product.images[0]?.url) || "/storefront/prod-1.png",
        viewedAt: Date.now()
      };
      return [itemToStore, ...filtered].slice(0, 10);
    });
  }, []);

  // Determine subtle visitor segment
  const visitorSegment = (() => {
    if (isAuthenticated && user) return "existing_customer";
    if (recentlyViewed.length > 3) return "returning_visitor";
    if (recentlyViewed.length > 0) return "browsing_visitor";
    return "new_visitor";
  })();

  // Smart recommendation helper (same collection, color/material match, or price range)
  const getRecommendedProducts = useCallback((allProducts = [], currentProduct = null, limit = 4) => {
    if (!Array.isArray(allProducts) || allProducts.length === 0) return [];

    let currentId = currentProduct ? String(currentProduct._id || currentProduct.id) : null;
    let currentCategory = currentProduct?.category || null;

    // Filter out current product
    const pool = allProducts.filter((p) => String(p._id || p.id) !== currentId);

    if (pool.length === 0) return [];

    // Score products based on category match, material/color match, and recent views
    const scored = pool.map((prod) => {
      let score = 0;
      if (currentCategory && prod.category === currentCategory) score += 10;
      if (currentProduct?.color && prod.color === currentProduct.color) score += 5;
      if (currentProduct?.gender && prod.gender === currentProduct.gender) score += 5;
      if (recentlyViewed.some((rv) => String(rv._id || rv.id) === String(prod._id || prod.id))) score += 2;
      return { prod, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.prod);
  }, [recentlyViewed]);

  return (
    <PersonalizationContext.Provider
      value={{
        recentlyViewed,
        addRecentlyViewed,
        visitorSegment,
        getRecommendedProducts
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
}

export const usePersonalization = () => {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) throw new Error("usePersonalization must be used within PersonalizationProvider");
  return ctx;
};
