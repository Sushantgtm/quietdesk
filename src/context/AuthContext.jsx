import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentAdmin, loginAdmin as loginService, logoutAdmin as logoutService, subscribeAuthState } from '../services/firebase/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(getCurrentAdmin());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuthState((user) => {
      setAdmin(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const user = await loginService(email, password);
      setAdmin(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutService();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
