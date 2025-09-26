// API Configuration
// Function to get API base URL based on environment
export const getApiBaseUrl = () => {
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isDevelopment 
    ? 'http://localhost:8000'  // Local development backend
    : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
};

// Get the base URL
const API_BASE_URL = getApiBaseUrl();

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  VERIFY_TOKEN: `${API_BASE_URL}/api/verify-token`,
  LOGIN: `${API_BASE_URL}/api/login`,
  REGISTER: `${API_BASE_URL}/api/register`,
  LOGOUT: `${API_BASE_URL}/api/logout`,
  
  // User
  USER_DETAILS: `${API_BASE_URL}/api/user_details`,
  UPDATE_USER: `${API_BASE_URL}/api/update_user`,
  DELETE_USER: `${API_BASE_URL}/api/delete_user`,
  
  // Expenses
  EXPENSES: `${API_BASE_URL}/api/expenses`,
  ADD_EXPENSE: `${API_BASE_URL}/api/expenses`,
  EDIT_EXPENSE: `${API_BASE_URL}/api/edit_expense_list`,
  DELETE_EXPENSE: (transactionId) => `${API_BASE_URL}/api/delete_expense_list_item?transaction_id=${transactionId}`,
  
  // Categories
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  
  // Statistics
  TOTAL_AMOUNT: `${API_BASE_URL}/api/total_amount`,
  TOTAL_TRANSACTIONS: `${API_BASE_URL}/api/total_transactions`,
  RECENT_TRANSACTIONS: `${API_BASE_URL}/api/recent_transactions`,
  
  // Budgets
  BUDGETS: `${API_BASE_URL}/api/budgets`,
  ADD_BUDGET: `${API_BASE_URL}/api/add-budget`,
  EDIT_BUDGET_AMOUNT: `${API_BASE_URL}/api/Edit_budget_amount`,
  DELETE_BUDGET: (categoryId) => `${API_BASE_URL}/api/delete_set_budget?category_id=${categoryId}`,
  TOTAL_BUDGET_AMOUNT: (month) => `${API_BASE_URL}/api/total-set-budget-amount-according-to-month?month=${month}`,
  
  // Reports
  EXPENSES_BY_CATEGORY: `${API_BASE_URL}/api/expenses-by-category`,
  EXPENSES_BY_MONTH: `${API_BASE_URL}/api/expenses-by-month`,
  
  // Account Reactivation
  REACTIVATE_ACCOUNT_REQUEST: `${API_BASE_URL}/api/re-active-account`,
  REACTIVATE_ACCOUNT_VERIFY: `${API_BASE_URL}/api/re-active-account-verification-email-code`,
};

// Common headers for API requests
export const API_HEADERS = {
  'Content-Type': 'application/json',
};

// Function to get auth headers with token
export const getAuthHeaders = (token = localStorage.getItem('token'), additionalHeaders = {}) => {
  return {
    ...API_HEADERS,
    'Authorization': `Bearer ${token}`,
    ...additionalHeaders,
  };
};

// API utility functions
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error(`API request failed for URL: ${url}`, error);
    // Check if this is a CORS/preflight error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('CORS error or network error occurred. Check your backend configuration.');
    }
    throw error;
  }
};

export const apiGet = async (url, headers = {}) => {
  const options = {
    method: 'GET',
    headers: { ...getAuthHeaders(undefined, headers) },
  };
  return apiRequest(url, options);
};

export const apiPost = async (url, body, headers = {}) => {
  const options = {
    method: 'POST',
    headers: { ...getAuthHeaders(undefined, headers) },
    body: JSON.stringify(body),
  };
  return apiRequest(url, options);
};

export const apiPut = async (url, body, headers = {}) => {
  const options = {
    method: 'PUT',
    headers: { ...getAuthHeaders(undefined, headers) },
    body: JSON.stringify(body),
  };
  return apiRequest(url, options);
};

export const apiDelete = async (url, headers = {}) => {
  const options = {
    method: 'DELETE',
    headers: { ...getAuthHeaders(undefined, headers) },
  };
  return apiRequest(url, options);
};