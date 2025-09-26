import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token parameters in the URL first
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const tokenType = urlParams.get('token_type');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    // If there's an error, we could handle it here or just continue to check for token
    if (error) {
      console.error(`Google Auth Error: ${error}`, errorDescription);
    }
    
    // If there's a token in the URL parameters, process it first
    if (accessToken && tokenType) {
      // Store the token in localStorage
      localStorage.setItem('token', accessToken);
      
      // Verify the token and set the user
      verifyToken(accessToken);
      
      // Clean up the URL by removing the token parameters
      const url = new URL(window.location);
      url.searchParams.delete('access_token');
      url.searchParams.delete('token_type');
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      
      // Replace the URL without the token parameters to keep the URL clean
      window.history.replaceState({}, document.title, url.toString());
    } else {
      // Check if user is logged in on app start from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        // Verify token and set user
        verifyToken(token);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      // If token verification fails, remove the token
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    sessionStorage.removeItem('theme'); // Clear theme from session storage on logout
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};