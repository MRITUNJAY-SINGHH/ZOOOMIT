import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [isUpdating, setIsUpdating] = useState(false);

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

  const addItem = async (productId, qty, variantId, unit) => {
    if (!token) return;
    setIsUpdating(true);
    try {
      const res = await StorefrontAPI.addToCart({ productId, variantId, qty, unit });
      if (res.data?.data) {
        setCart(res.data.data);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to add item to cart';
      throw new Error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateItem = async (itemId, qty) => {
    if (!token) return;
    setIsUpdating(true);
    try {
      const res = await StorefrontAPI.updateCartItem(itemId, qty);
      if (res.data?.data) {
        setCart(res.data.data);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update item';
      throw new Error(msg);
    } finally {
      setIsUpdating(false);
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
      isLoading,
      isUpdating,
      itemCount,
      getItemQuantity,
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
