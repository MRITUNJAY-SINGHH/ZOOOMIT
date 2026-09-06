import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const hasPermission = (permissionPath) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    
    if (!user.permissions) return false;

    const parts = permissionPath.split('.');
    let current = user.permissions;
    
    for (const part of parts) {
      if (current[part] === undefined) return false;
      current = current[part];
    }
    
    if (typeof current === 'object') {
      return current.view === true;
    }
    
    return current === true;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasPermission, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
