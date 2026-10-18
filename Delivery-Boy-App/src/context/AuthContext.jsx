import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter, AppState } from 'react-native';
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
  syncOnlineStatus: () => {},
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

          // Fetch fresh authoritative profile from backend in background
          try {
            const fresh = await deliveryService.getProfile();
            if (fresh) {
              setPartner(fresh);
              setIsOnline(Boolean(fresh.isOnline));
              await authStorage.setPartner(fresh);
            }
          } catch (e) {
            console.log('[AuthContext] Background profile sync failed, using cached partner');
          }
          // Refresh push notification token on app launch
          notificationService.registerForPushNotificationsAsync().catch(() => {});
        }
      } catch (err) {
        console.warn('[AuthContext] Bootstrap error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();

    const sub = DeviceEventEmitter.addListener('auth_unauthorized', () => {
      notificationService.unregisterDeviceTokenAsync().catch(() => {});
      setToken(null);
      setPartner(null);
      setIsOnline(false);
    });

    return () => sub.remove();
  }, []);

  // Sync profile & online status whenever app returns to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && token) {
        refreshProfile().catch(() => {});
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [token]);

  const login = async (email, password) => {
    const data = await deliveryService.login(email, password);
    const userToken = data.token;

    await authStorage.setToken(userToken);
    setToken(userToken);

    let userProfile = {
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      isOnline: typeof data.isOnline === 'boolean' ? data.isOnline : false
    };

    // Immediately fetch authoritative server profile to guarantee exact isOnline status
    try {
      const fresh = await deliveryService.getProfile();
      if (fresh) {
        userProfile = fresh;
      }
    } catch {
      // Fallback to login endpoint payload
    }

    await authStorage.setPartner(userProfile);
    setPartner(userProfile);
    setIsOnline(Boolean(userProfile.isOnline));

    // Register push notification token on login
    notificationService.registerForPushNotificationsAsync().catch(() => {});

    hapticFeedback.success();
    return userProfile;
  };

  const logout = async () => {
    hapticFeedback.light();
    try {
      // 1. Unregister device push token for this specific device only
      try {
        await notificationService.unregisterDeviceTokenAsync();
      } catch (notifErr) {
        console.log('[AuthContext] Push unregister failed on logout:', notifErr?.message);
      }

      // CRITICAL ARCHITECTURE RULE:
      // Availability belongs to the rider account, NOT the authentication session.
      // Logging out NEVER automatically turns the rider offline on the backend.
      // Status persists until explicitly changed by the rider or an admin.
    } finally {
      await authStorage.clearAuth();
      setToken(null);
      setPartner(null);
      setIsOnline(false);
    }
  };

  const toggleOnline = async (desiredState) => {
    hapticFeedback.medium();
    const targetState = typeof desiredState === 'boolean' ? desiredState : !isOnline;
    try {
      const res = await deliveryService.toggleOnline(targetState);
      const updated = Boolean(res.isOnline);
      setIsOnline(updated);
      setPartner((prev) => {
        const next = prev ? { ...prev, isOnline: updated } : { isOnline: updated };
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

  const syncOnlineStatus = (status) => {
    if (typeof status === 'boolean') {
      setIsOnline(status);
      setPartner((prev) => {
        if (!prev || prev.isOnline === status) return prev;
        const next = { ...prev, isOnline: status };
        authStorage.setPartner(next);
        return next;
      });
    }
  };

  const refreshProfile = async () => {
    try {
      const fresh = await deliveryService.getProfile();
      if (fresh) {
        setPartner(fresh);
        setIsOnline(Boolean(fresh.isOnline));
        await authStorage.setPartner(fresh);
        return fresh;
      }
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
        syncOnlineStatus,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
