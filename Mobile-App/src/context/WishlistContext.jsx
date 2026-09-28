import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { StorefrontAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { haptics } from '../services/haptics';

const WISHLIST_STORAGE_KEY = 'kuiklo_saved_items_v1';

const WishlistContext = createContext(undefined);

export const WishlistProvider = ({ children }) => {
  const { token } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const [savedProducts, setSavedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocalWishlist();
  }, []);

  useEffect(() => {
    if (token) {
      syncWithBackend();
    }
  }, [token]);

  const loadLocalWishlist = async () => {
    try {
      let raw = null;
      if (Platform.OS === 'web') {
        raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      } else {
        raw = await SecureStore.getItemAsync(WISHLIST_STORAGE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedIds(new Set(parsed));
        }
      }
    } catch (e) {
      // Silently fallback
    } finally {
      setIsLoading(false);
    }
  };

  const persistLocally = async (idsArray) => {
    try {
      const serialized = JSON.stringify(idsArray);
      if (Platform.OS === 'web') {
        localStorage.setItem(WISHLIST_STORAGE_KEY, serialized);
      } else {
        await SecureStore.setItemAsync(WISHLIST_STORAGE_KEY, serialized);
      }
    } catch (e) {
      // Ignore write errors
    }
  };

  const syncWithBackend = async () => {
    if (!token) return;
    try {
      const res = await StorefrontAPI.getWishlist();
      if (res.data?.ids) {
        setSavedIds(new Set(res.data.ids));
        setSavedProducts(res.data.data || []);
        persistLocally(res.data.ids);
      }
    } catch (e) {
      // Offline fallback
    }
  };

  const isSaved = (productId) => {
    if (!productId) return false;
    return savedIds.has(productId.toString());
  };

  const toggleSave = async (product) => {
    const productId = typeof product === 'object' && product !== null ? product._id : product;
    if (!productId) return false;
    const strId = productId.toString();
    const currentlySaved = savedIds.has(strId);
    const newSaved = !currentlySaved;

    // Optimistic UI update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (newSaved) {
        next.add(strId);
      } else {
        next.delete(strId);
      }
      persistLocally(Array.from(next));
      return next;
    });

    if (newSaved) {
      haptics.notificationSuccess();
      if (typeof product === 'object' && product !== null) {
        setSavedProducts((prev) => [product, ...prev.filter(p => p._id !== strId)]);
      }
    } else {
      haptics.impactLight();
      setSavedProducts((prev) => prev.filter(p => p._id !== strId));
    }

    if (token) {
      try {
        await StorefrontAPI.toggleWishlist(strId);
      } catch (e) {
        // Optimistic state retained locally
      }
    }

    return newSaved;
  };

  return (
    <WishlistContext.Provider
      value={{
        isSaved,
        toggleSave,
        savedIds,
        savedProducts,
        isLoading,
        refreshWishlist: syncWithBackend
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
