import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { authStorage } from '../services/authStorage';
import { StorefrontAPI } from '../services/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadStoredAuth();

    const sub = DeviceEventEmitter.addListener('auth_unauthorized', () => {
      setToken(null);
      setCustomer(null);
      queryClient.clear();
    });

    return () => {
      sub.remove();
    };
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await authStorage.getToken();
      const storedCustomer = await authStorage.getCustomer();

      if (storedToken && storedCustomer) {
        setToken(storedToken);
        setCustomer(storedCustomer);
        try {
          const res = await StorefrontAPI.getProfile();
          if (res.data) {
            setCustomer(res.data);
            await authStorage.setCustomer(res.data);
          }
        } catch (e) {
        }
      }
    } catch (e) {
      console.warn('Error loading auth from SecureStore:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    const res = await StorefrontAPI.login(credentials);
    const { token: newToken, customer: customerData } = res.data;

    setToken(newToken);
    setCustomer(customerData);
    await authStorage.setToken(newToken);
    await authStorage.setCustomer(customerData);

    queryClient.invalidateQueries();
  };

  const loginWithOtp = async (phone, otp) => {
    const res = await StorefrontAPI.verifyOtp(phone, otp);
    const newToken = res.token || res.data?.token;
    const customerData = res.customer || res.data?.customer;

    if (!newToken) {
      throw new Error(res.message || 'Authentication failed');
    }

    setToken(newToken);
    setCustomer(customerData);
    await authStorage.setToken(newToken);
    if (customerData) {
      await authStorage.setCustomer(customerData);
    }

    queryClient.invalidateQueries();
    return res;
  };

  const register = async (data) => {
    const res = await StorefrontAPI.register(data);
    const { token: newToken, customer: customerData } = res.data;

    setToken(newToken);
    setCustomer(customerData);
    await authStorage.setToken(newToken);
    await authStorage.setCustomer(customerData);

    queryClient.invalidateQueries();
  };

  const logout = async () => {
    try {
      await authStorage.clearAuth();
      setToken(null);
      setCustomer(null);
      queryClient.clear();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await StorefrontAPI.getProfile();
      if (res.data) {
        setCustomer(res.data);
        await authStorage.setCustomer(res.data);
      }
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ customer, token, isLoading, login, register, loginWithOtp, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
