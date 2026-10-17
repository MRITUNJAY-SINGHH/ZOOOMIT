import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'zooomit_delivery_jwt';
const PARTNER_KEY = 'zooomit_delivery_partner';

const isWeb = Platform.OS === 'web';

export const authStorage = {
  async getToken() {
    try {
      if (isWeb) {
        return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('[AuthStorage] Failed to read token:', e);
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
      console.warn('[AuthStorage] Failed to save token:', e);
    }
  },

  async getPartner() {
    try {
      const data = isWeb
        ? (typeof window !== 'undefined' ? window.localStorage.getItem(PARTNER_KEY) : null)
        : await SecureStore.getItemAsync(PARTNER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async setPartner(partner) {
    try {
      const str = JSON.stringify(partner);
      if (isWeb) {
        if (typeof window !== 'undefined') window.localStorage.setItem(PARTNER_KEY, str);
        return;
      }
      await SecureStore.setItemAsync(PARTNER_KEY, str);
    } catch (e) {
      console.warn('[AuthStorage] Failed to save partner info:', e);
    }
  },

  async clearAuth() {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(TOKEN_KEY);
          window.localStorage.removeItem(PARTNER_KEY);
        }
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(PARTNER_KEY);
    } catch (e) {
      console.warn('[AuthStorage] Failed to clear auth:', e);
    }
  }
};
