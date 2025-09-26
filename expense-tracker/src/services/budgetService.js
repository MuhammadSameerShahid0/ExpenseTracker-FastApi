// Determine the API base URL based on the environment
const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:8000'  // Local development backend
  : 'https://expense-tracker-fast-api.vercel.app'; // Production backend

export const budgetService = {
  // Add a new budget
  async addBudget(limit, categoryId) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/add-budget`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: limit,
        category_id: categoryId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add budget');
    }

    return await response.json();
  },

  // Get all budgets for the user
  async getBudgets() {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/budgets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch budgets');
    }

    return await response.json();
  },

  // Get categories for budget creation
  async getCategories() {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch categories');
    }

    return await response.json();
  },

  // Get total set budget amount according to month
  async getTotalBudgetAmountForMonth(month) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/total-set-budget-amount-according-to-month?month=${month}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch total budget amount');
    }

    return await response.json();
  },

  // Edit budget amount
  async editBudgetAmount(categoryId, amount) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/Edit_budget_amount`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category_id: categoryId,
        amount: amount
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to edit budget amount');
    }

    return await response.json();
  },

  // Delete budget
  async deleteBudget(categoryId) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/delete_set_budget?category_id=${categoryId}`, {        
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete budget');
    }

    return await response.json();
  }
};