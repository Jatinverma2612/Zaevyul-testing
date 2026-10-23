import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCustomerAuth } from './CustomerAuthContext';
import { customerApi } from '../lib/customerApi';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const { user, isAuthenticated } = useCustomerAuth();
  const [favorites, setFavorites] = useState([]); // array of product ID strings
  const [items, setItems] = useState([]); // array of populated product objects
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch favorites from backend whenever auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      setItems([]);
      return;
    }

    let cancelled = false;
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const res = await customerApi.favorites.getAll();
        if (!cancelled) {
          setFavorites(res.favoriteIds || []);
          setItems(res.favorites || []);
        }
      } catch {
        // Silently fail — favorites are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFavorites();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  const isFavorite = useCallback(
    (productId) => favorites.includes(String(productId)),
    [favorites]
  );

  /**
   * Add a product to favorites.
   * @returns {boolean} true if successful, false if not authenticated
   */
  const addFavorite = useCallback(async (productOrId) => {
    if (!isAuthenticated) return false;
    const id = typeof productOrId === 'object' ? String(productOrId._id || productOrId.id) : String(productOrId);
    
    // Optimistic update for favorites IDs
    setFavorites((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (typeof productOrId === 'object') {
      setItems((prev) => (prev.some(item => String(item._id || item.id) === id) ? prev : [...prev, productOrId]));
    }

    try {
      await customerApi.favorites.add(id);
      const res = await customerApi.favorites.getAll();
      setFavorites(res.favoriteIds || []);
      setItems(res.favorites || []);
    } catch {
      // Rollback on failure
      setFavorites((prev) => prev.filter((f) => f !== id));
      setItems((prev) => prev.filter((item) => String(item._id || item.id) !== id));
    }
    return true;
  }, [isAuthenticated]);

  /**
   * Remove a product from favorites.
   * @returns {boolean} true if successful, false if not authenticated
   */
  const removeFavorites = useCallback(async (productId) => {
    if (!isAuthenticated) return false;
    const id = String(productId);
    // Optimistic update
    setFavorites((prev) => prev.filter((f) => f !== id));
    setItems((prev) => prev.filter((item) => String(item._id || item.id) !== id));
    try {
      const res = await customerApi.favorites.remove(id);
      if (res && Array.isArray(res.favoriteIds)) {
        setFavorites(res.favoriteIds);
        setItems((prev) => prev.filter((item) => res.favoriteIds.includes(String(item._id || item.id))));
      }
    } catch {
      // Rollback on failure
      const res = await customerApi.favorites.getAll();
      setFavorites(res.favoriteIds || []);
      setItems(res.favorites || []);
    }
    return true;
  }, [isAuthenticated]);

  /**
   * Toggle a product's favorite status.
   */
  const toggleFavorites = useCallback(async (productOrId) => {
    if (!isAuthenticated) return 'unauthenticated';
    const id = typeof productOrId === 'object' ? String(productOrId._id || productOrId.id) : String(productOrId);
    if (favorites.includes(id)) {
      await removeFavorites(id);
    } else {
      await addFavorite(productOrId);
    }
    return true;
  }, [isAuthenticated, favorites, addFavorite, removeFavorites]);

  /** Clear favorites state (called on logout) */
  const clearFavorite = useCallback(() => {
    setFavorites([]);
    setItems([]);
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        items,
        loading,
        isOpen,
        setIsOpen,
        isFavorite,
        addFavorite,
        removeFavorites,
        toggleFavorites,
        clearFavorite,
        isAuthenticated,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorite = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorite must be inside FavoritesProvider');
  return context;
};
