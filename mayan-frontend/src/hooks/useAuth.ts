// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const storedToken = localStorage.getItem('mayan_token');
    setToken(storedToken);
    setIsAuthenticated(!!storedToken);
    setLoading(false);
    return !!storedToken;
  };

  const login = (newToken: string) => {
    localStorage.setItem('mayan_token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('mayan_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    loading,
    token,
    login,
    logout,
    checkAuth
  };
};