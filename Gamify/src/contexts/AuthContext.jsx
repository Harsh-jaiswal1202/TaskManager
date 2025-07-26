import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { apiService } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token
    const token = Cookies.get('authToken');
    const userId = Cookies.get('id');
    const designation = Cookies.get('designation');
    
    if (token && userId && designation) {
      // Verify token with backend
      apiService.verifyUser()
      .then(response => {
        setUser({ 
          id: userId, 
          role: designation, 
          token,
          ...response.data.user 
        });
      })
      .catch(() => {
        // Token invalid, clear cookies
        Cookies.remove('authToken');
        Cookies.remove('id');
        Cookies.remove('designation');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      
      const { token, userId, designation, user: userData } = response.data;
      
      Cookies.set('authToken', token, { expires: 7 });
      Cookies.set('id', userId, { expires: 7 });
      Cookies.set('designation', designation, { expires: 7 });
      
      setUser({ 
        id: userId, 
        role: designation, 
        token,
        ...userData 
      });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    Cookies.remove('authToken');
    Cookies.remove('id');
    Cookies.remove('designation');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  const isAuthenticated = () => !!user;

  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      isAuthenticated, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 