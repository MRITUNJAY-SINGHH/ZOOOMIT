import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'kuiklo_customer_jwt';
const CUSTOMER_KEY = 'kuiklo_customer_profile';

const isWeb = Platform.OS === 'web';

export const authStorage = {
  async getToken() {
    try {
      if (isWeb) {
        return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to get token from SecureStore:', e);
      return null;
    }
  },

  async setToken(token) {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Failed to save token to SecureStore:', e);
    }
  },

  async getCustomer() {
    try {
      const data = isWeb 
        ? (typeof window !== 'undefined' ? window.localStorage.getItem(CUSTOMER_KEY) : null)
        : await SecureStore.getItemAsync(CUSTOMER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async setCustomer(customer) {
    try {
      const str = JSON.stringify(customer);
      if (isWeb) {
        if (typeof window !== 'undefined') window.localStorage.setItem(CUSTOMER_KEY, str);
        return;
      }
      await SecureStore.setItemAsync(CUSTOMER_KEY, str);
    } catch (e) {
      console.warn('Failed to save customer to SecureStore:', e);
    }
  },

  async clearAuth() {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(TOKEN_KEY);
          window.localStorage.removeItem(CUSTOMER_KEY);
        }
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(CUSTOMER_KEY);
    } catch (e) {
      console.warn('Failed to clear auth from SecureStore:', e);
    }
  }
};
