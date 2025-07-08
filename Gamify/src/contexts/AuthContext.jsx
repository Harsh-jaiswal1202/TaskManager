import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token
    const token = Cookies.get('authToken');
    const userRole = Cookies.get('userRole');
    
    if (token && userRole) {
      setUser({ role: userRole, token });
    }
    
    setLoading(false);
  }, []);

  const login = (role) => {
    // In a real app, this would be a proper JWT token from the server
    const token = `mock-jwt-token-${role}-${Date.now()}`;
    
    Cookies.set('authToken', token, { expires: 7 });
    Cookies.set('userRole', role, { expires: 7 });
    
    setUser({ role, token });
  };

  const logout = () => {
    Cookies.remove('authToken');
    Cookies.remove('userRole');
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