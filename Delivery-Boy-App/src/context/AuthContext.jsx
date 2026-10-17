import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { authStorage } from '../services/authStorage';
import { deliveryService } from '../services/deliveryService';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/haptics';

const AuthContext = createContext({
  partner: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isOnline: false,
  login: async () => {},
  logout: async () => {},
  toggleOnline: async () => {},
  refreshProfile: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [partner, setPartner] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Load session on startup
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedToken = await authStorage.getToken();
        const savedPartner = await authStorage.getPartner();

        if (savedToken && savedPartner) {
          setToken(savedToken);
          setPartner(savedPartner);
          setIsOnline(Boolean(savedPartner.isOnline));

          // Fetch fresh profile in background
          try {
            const fresh = await deliveryService.getProfile();
            setPartner(fresh);
            setIsOnline(Boolean(fresh.isOnline));
            await authStorage.setPartner(fresh);
          } catch (e) {
            console.log('[AuthContext] Background profile sync failed, using cached partner');
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Bootstrap error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();

    const sub = DeviceEventEmitter.addListener('auth_unauthorized', () => {
      setToken(null);
      setPartner(null);
      setIsOnline(false);
    });

    return () => sub.remove();
  }, []);

  const login = async (email, password) => {
    const data = await deliveryService.login(email, password);
    const userToken = data.token;
    const userProfile = {
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      isOnline: data.isOnline || false
    };

    await authStorage.setToken(userToken);
    await authStorage.setPartner(userProfile);

    setToken(userToken);
    setPartner(userProfile);
    setIsOnline(Boolean(userProfile.isOnline));

    // Register push notification token on login
    notificationService.registerForPushNotificationsAsync().catch(() => {});

    hapticFeedback.success();
    return userProfile;
  };

  const logout = async () => {
    hapticFeedback.light();
    await authStorage.clearAuth();
    setToken(null);
    setPartner(null);
    setIsOnline(false);
  };

  const toggleOnline = async () => {
    hapticFeedback.medium();
    const targetState = !isOnline;
    try {
      const res = await deliveryService.toggleOnline(targetState);
      const updated = res.isOnline;
      setIsOnline(updated);
      setPartner((prev) => {
        const next = { ...prev, isOnline: updated };
        authStorage.setPartner(next);
        return next;
      });
      hapticFeedback.success();
      return updated;
    } catch (err) {
      hapticFeedback.error();
      throw err;
    }
  };

  const refreshProfile = async () => {
    try {
      const fresh = await deliveryService.getProfile();
      setPartner(fresh);
      setIsOnline(Boolean(fresh.isOnline));
      await authStorage.setPartner(fresh);
      return fresh;
    } catch (e) {
      console.warn('[AuthContext] Refresh profile error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        partner,
        token,
        isAuthenticated: Boolean(token && partner),
        isLoading,
        isOnline,
        login,
        logout,
        toggleOnline,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
