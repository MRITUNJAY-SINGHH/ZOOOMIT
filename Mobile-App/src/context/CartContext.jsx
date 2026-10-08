import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { StorefrontAPI } from '../services/api';
import { useAuth } from './AuthContext';

const emptySummary = {
  subTotal: 0,
  taxableAmount: 0,
  tax: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  discount: 0,
  deliveryFee: 0,
  grandTotal: 0,
  taxMode: 'INCLUSIVE'
};

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  const { token } = useAuth();
  const [cart, setCart] = useState({ items: [], summary: emptySummary });
  const [isLoading, setIsLoading] = useState(false);
  const [cartFeedback, setCartFeedback] = useState(null);
  const feedbackSequence = useRef(0);
  const announceAddition = (data, productId, variantId, source) => {
    if (!source) return;
    const item = data.items?.find(i => (i.product?._id || i.product) === productId && (i.variant?._id || i.variant || null) === (variantId || null));
    if (!item) return;
    setCartFeedback({ ...source, id: ++feedbackSequence.current, itemKey: String(item._id || `${productId}:${variantId || 'base'}`) });
  };
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingItems, setPendingItems] = useState({});
  const pendingRef = useRef({});
  const mutationQueue = useRef(Promise.resolve());
  const itemKey = (productId, variantId) => `${productId}:${variantId || 'base'}`;
  const getItemPending = (productId, variantId) => pendingItems[itemKey(productId, variantId)] || 0;
  // Lock only this product/variant synchronously, including duplicate cards.
  // Queue full-cart snapshots so a slower response cannot overwrite a newer cart.
  const mutateItem = async (productId, variantId, direction, request, source) => {
    const key = itemKey(productId, variantId);
    if (pendingRef.current[key]) return;
    pendingRef.current = { ...pendingRef.current, [key]: direction };
    setPendingItems(pendingRef.current);
    setIsUpdating(true);
    const work = mutationQueue.current.then(async () => {
      const [res, origin] = await Promise.all([request(), Promise.resolve(source)]);
      const data = res.data?.data;
      if (!data?.items) throw new Error('Cart not updated. Please try again.');
      setCart(data);
      if (direction > 0) announceAddition(data, productId, variantId, origin);
      return data;
    });
    mutationQueue.current = work.catch(() => {});
    try { return await work; }
    finally {
      const next = { ...pendingRef.current };
      delete next[key];
      pendingRef.current = next;
      setPendingItems(next);
      setIsUpdating(Object.keys(next).length > 0);
    }
  };

  useEffect(() => {
    if (token) {
      refreshCart();
    } else {
      setCart({ items: [], summary: emptySummary });
    }
  }, [token]);

  const refreshCart = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await StorefrontAPI.getCart();
      if (res.data?.data) {
        setCart(res.data.data);
      }
    } catch (e) {
      if (!e.response || e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED' || e.message?.includes('Network Error')) {
        // Offline / dev mode fallback: keep current cart or default empty cart
        setCart((prev) => (prev?.items?.length ? prev : { items: [], summary: emptySummary }));
      } else {
        console.warn('Failed to fetch cart:', e.message || e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (productId, qty, variantId, unit, source) => {
    if (!token) return;
    try {
      return await mutateItem(productId, variantId, 1,
        () => StorefrontAPI.addToCart({ productId, variantId, qty, unit }), source);
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message || 'Failed to add item to cart');
    }
  };

  const updateItem = async (itemId, qty, source) => {
    if (!token) return;
    const previous = cart.items.find(i => i._id === itemId);
    if (!previous) throw new Error('This cart item has changed. Please try again.');
    const productId = previous.product?._id || previous.product;
    const variantId = previous.variant?._id || previous.variant;
    try {
      return await mutateItem(productId, variantId, qty > Number(previous.qty || 0) ? 1 : -1,
        () => StorefrontAPI.updateCartItem(itemId, qty), source);
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message || 'Failed to update item');
    }
  };

  const removeItem = async (itemId) => {
    if (!token) return;
    setIsUpdating(true);
    try {
      const res = await StorefrontAPI.removeCartItem(itemId);
      if (res.data?.data) {
        setCart(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to remove item:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!token) return;
    setIsUpdating(true);
    try {
      await StorefrontAPI.clearCart();
      setCart({ items: [], summary: emptySummary });
    } catch (e) {
      console.warn('Failed to clear cart:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const applyCoupon = async (code) => {
    if (!token) return { success: false, message: 'Please login to apply coupons' };
    try {
      const res = await StorefrontAPI.applyCoupon(code);
      if (res.data?.data) {
        setCart(res.data.data);
      }
      return { success: true, message: res.data?.message || 'Coupon applied' };
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to apply coupon';
      return { success: false, message: msg };
    }
  };

  const removeCoupon = async () => {
    if (!token) return;
    try {
      const res = await StorefrontAPI.removeCoupon();
      if (res.data?.data) {
        setCart(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to remove coupon:', e);
    }
  };

  const getItemQuantity = (productId, variantId) => {
    const item = cart.items.find(
      i => i.product._id === productId && (variantId ? i.variant?._id === variantId : !i.variant)
    );
    return item ? item.qty : 0;
  };

  const itemCount = cart.items.reduce((acc, item) => acc + (item.qty > 0 ? 1 : 0), 0);

  return (
    <CartContext.Provider value={{
      cart,
      cartFeedback,
      isLoading,
      isUpdating,
      itemCount,
      getItemQuantity,
      getItemPending,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
