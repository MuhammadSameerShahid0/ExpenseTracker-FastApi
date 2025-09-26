// GoogleAuth.js - Utility functions for Google OAuth operations

// Function to determine the API base URL based on the environment
const getApiBaseUrl = () => {
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isDevelopment 
    ? 'http://localhost:8000'  // Local development backend
    : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
};

// Function to initialize Google registration
export const initiateGoogleRegistration = () => {
  return new Promise((resolve, reject) => {
    try {
      // Get the current window location without the path for the frontend redirect URI
      const frontendRedirectUri = window.location.origin;
      const googleRegisterUrl = `${getApiBaseUrl()}/api/register_via_google?frontend_redirect_uri=${encodeURIComponent(frontendRedirectUri)}`;
      
      // Redirect to the backend Google registration endpoint
      window.location.href = googleRegisterUrl;
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Function to initiate Google login
export const initiateGoogleLogin = () => {
  return new Promise((resolve, reject) => {
    try {
      // Get the current window location without the path for the frontend redirect URI
      const frontendRedirectUri = window.location.origin;
      const googleRegisterUrl = `${getApiBaseUrl()}/api/register_via_google?frontend_redirect_uri=${encodeURIComponent(frontendRedirectUri)}`;
      
      // Redirect to the backend Google registration endpoint
      // For login, we'll use the same endpoint since Google OAuth handles both
      window.location.href = googleRegisterUrl;
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Function to handle the callback after Google authentication
// This would normally be handled by the backend redirecting back to frontend with token
export const handleGoogleCallback = (location) => {
  // Extract parameters from URL query
  const urlParams = new URLSearchParams(location.search);
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  
  // Prioritize error detection - if there's an error parameter, return it immediately
  if (error) {
    return {
      error: error,
      error_description: errorDescription || 'An error occurred during Google authentication'
    };
  }
  
  // Only check for token if there's no error
  const accessToken = urlParams.get('access_token');
  const tokenType = urlParams.get('token_type');
  
  if (accessToken && tokenType) {
    // Store the token in localStorage (or however your AuthContext handles it)
    localStorage.setItem('token', accessToken);
    
    // Return the token info
    return {
      access_token: accessToken,
      token_type: tokenType
    };
  }
  
  return null;
};