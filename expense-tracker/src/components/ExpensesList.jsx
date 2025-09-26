import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './ExpensesList.css';

const ExpensesList = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedChartCategory, setSelectedChartCategory] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null); // Changed to single selection
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [messageModal, setMessageModal] = useState({ show: false, type: '', text: '' });
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchExpenses(token);
      fetchCategories(token);
    }
  }, [navigate]);

  const fetchExpenses = async (token) => {
    try {
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/expenses`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
        setFilteredExpenses(data);
        
        // Calculate total amount
        const total = data.reduce((sum, expense) => sum + expense.amount, 0);
        setTotalAmount(total);
      } else {
        setError('Failed to fetch expenses');
      }
    } catch (err) {
      setError('An error occurred while fetching expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (token) => {
    try {
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Toggle selection of an expense (single selection)
  const toggleExpenseSelection = (expenseId) => {
    if (selectedExpense === expenseId) {
      // Deselect if already selected
      setSelectedExpense(null);
    } else {
      // Select this expense and deselect any previous selection
      setSelectedExpense(expenseId);
    }
  };

  // Check if an expense is selected
  const isExpenseSelected = (expenseId) => {
    return selectedExpense === expenseId;
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (!isSelectMode) {
      setSelectedExpense(null); // Clear selection when entering select mode
    } else {
      setSelectedExpense(null); // Clear selection when exiting select mode
    }
  };

  // Edit selected expense - opens modal
  const handleEditSelected = () => {
    if (!selectedExpense) return;
    
    // Find the selected expense details to pass to the modal
    const expenseDetails = expenses.find(expense => expense.id === selectedExpense);
    if (expenseDetails) {
      setExpenseToEdit(expenseDetails);
      setShowEditModal(true);
    }
  };

  // Delete selected expense
  const handleDeleteSelected = async () => {
    if (!selectedExpense) return;
    
    try {
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/delete_expense_list_item?transaction_id=${selectedExpense}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
          const responseData = await response.json().catch(() => ({ detail: 'Expense deleted successfully!' }));
          
          // Remove the deleted expense from local state
          setExpenses(prevExpenses => 
            prevExpenses.filter(expense => expense.id !== selectedExpense)
          );
          setFilteredExpenses(prevFiltered => 
            prevFiltered.filter(expense => expense.id !== selectedExpense)
          );
          
          // Update total amount
          const deletedExpense = expenses.find(expense => expense.id === selectedExpense);
          if (deletedExpense) {
            setTotalAmount(prevTotal => prevTotal - deletedExpense.amount);
          }
          
          // Clear selection and exit select mode
          setSelectedExpense(null);
          setIsSelectMode(false);
          
          // Show the backend's return message
          const successMessage = typeof responseData === 'string' ? responseData : (responseData.detail || 'Expense deleted successfully!');
          showMessageModal('success', successMessage);
        } else {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
          const errorMessage = typeof errorData === 'object' ? errorData.detail || JSON.stringify(errorData) : errorData;
          showMessageModal('error', `Failed to delete expense: ${errorMessage || 'Unknown error'}`);
        }
    } catch (error) {
      console.error('Error deleting expense:', error);
      showMessageModal('error', 'An error occurred while deleting the expense.');
    }
  };

  // Close the edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setExpenseToEdit(null);
  };

  // Show message in modal
  const showMessageModal = (type, text) => {
    setMessageModal({ show: true, type, text });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setMessageModal({ show: false, type: '', text: '' });
    }, 5000);
  };

  // Hide message modal
  const hideMessageModal = () => {
    setMessageModal({ show: false, type: '', text: '' });
  };

  // Update the expense via the API
  const updateExpense = async (updatedExpense) => {
    // Check for validation error flag
    if (updatedExpense.validationError) {
      showMessageModal('error', 'All fields are required');
      return false;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Find the category ID based on the name
      const category = categories.find(cat => cat.name === updatedExpense.category_name);
      const categoryId = category ? category.id : null;
      
      // Prepare the request body in the format expected by the backend
      const requestBody = {
        transaction_id: updatedExpense.id,
        amount: parseFloat(updatedExpense.amount),
        category_id: categoryId,
        description: updatedExpense.description,
        payment_method: updatedExpense.payment_method,
        datetime: updatedExpense.date // This should be in ISO format for datetime
      };
      
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/edit_expense_list`, {
        method: 'POST',  // Changed from PUT to POST to match backend
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const responseData = await response.json().catch(() => ({ detail: 'Expense updated successfully!' }));
        
        // Update the local state to reflect the changes
        setExpenses(prevExpenses => 
          prevExpenses.map(exp => 
            exp.id === updatedExpense.id ? updatedExpense : exp
          )
        );
        // Also update filtered expenses to immediately show changes
        setFilteredExpenses(prevFiltered => 
          prevFiltered.map(exp => 
            exp.id === updatedExpense.id ? updatedExpense : exp
          )
        );
        closeEditModal();
        
        // Show the backend's return message
        const successMessage = typeof responseData === 'string' ? responseData : (responseData.detail || 'Expense updated successfully!');
        showMessageModal('success', successMessage);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        const errorMessage = typeof errorData === 'object' ? errorData.detail || JSON.stringify(errorData) : errorData;
        showMessageModal('error', `Failed to update expense: ${errorMessage || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      showMessageModal('error', 'An error occurred while updating the expense.');
      return false;
    }
  };

  // Filter expenses based on search term and category
  useEffect(() => {
    let filtered = expenses;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense =>
        expense.category_name === categoryFilter
      );
    }

    setFilteredExpenses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, categoryFilter, expenses]);

  // Calculate category totals
  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category_name || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount;
    return acc;
  }, {});

  // Calculate filtered total amount
  const filteredTotalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Get current expenses for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Prepare data for pie chart
  const pieChartData = Object.entries(categoryTotals).map(([name, value], index) => {
    const percentage = (value / totalAmount) * 100;
    const color = `hsl(${(index * 137) % 360}, 70%, 60%)`;
    return { name, value, percentage, color };
  });

  // Calculate pie chart angles
  let cumulativeAngle = 0;
  const pieChartSlices = pieChartData.map(item => {
    const angle = (item.value / totalAmount) * 360;
    const slice = {
      ...item,
      startAngle: cumulativeAngle,
      endAngle: cumulativeAngle + angle
    };
    cumulativeAngle += angle;
    return slice;
  });

  const handleChartCategoryClick = (category) => {
    if (selectedChartCategory === category) {
      setSelectedChartCategory(null);
      setCategoryFilter('all');
    } else {
      setSelectedChartCategory(category);
      setCategoryFilter(category);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="expenses-container">
      <main className="expenses-main">
        <div className="expenses-layout">
          {/* Sidebar with totals and categories */}
          <div className="expenses-sidebar">
            <div className="sidebar-card">
              <h3>Total Expenses</h3>
              <div className="total-amount">
                PKR {totalAmount.toFixed(2)}
              </div>
            </div>

            <div className="sidebar-card">
              <h3>Filter by Category</h3>
              <select 
                className="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {Object.keys(categoryTotals).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="sidebar-card">
              <div className="chart-header">
                <h3>Expenses by Category</h3>
                {selectedChartCategory && (
                  <button 
                    className="clear-chart-filter"
                    onClick={() => {
                      setSelectedChartCategory(null);
                      setCategoryFilter('all');
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className="pie-chart-container">
                <div className="pie-chart">
                  {pieChartSlices.map((slice, index) => (
                    <div
                      key={slice.name}
                      className={`chart-slice ${selectedChartCategory === slice.name ? 'selected' : ''}`}
                      style={{
                        '--start': slice.startAngle,
                        '--value': slice.endAngle - slice.startAngle,
                        '--color': slice.color,
                        '--hover-color': `${slice.color.replace('60%)', '70%)')}`
                      }}
                      onClick={() => handleChartCategoryClick(slice.name)}
                      title={`${slice.name}: PKR ${slice.value.toFixed(2)} (${slice.percentage.toFixed(1)}%)`}
                    >
                      <div className="slice-inner"></div>
                    </div>
                  ))}
                  <div className="chart-center">
                    <span className="chart-total">{pieChartSlices.length}</span>
                    <span className="chart-label">Categories</span>
                  </div>
                </div>
              </div>

              <div className="chart-legend">
                {pieChartData.map((item) => (
                  <div 
                    key={item.name}
                    className={`legend-item ${selectedChartCategory === item.name ? 'selected' : ''}`}
                    onClick={() => handleChartCategoryClick(item.name)}
                  >
                    <div className="color-dot" style={{ backgroundColor: item.color }}></div>
                    <span className="legend-label">{item.name}</span>
                    <span className="legend-percentage">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content with expenses list */}
          <div className="expenses-content">
            <div className="content-header">
              <h2>All Expenses</h2>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
            </div>

            <div className="expenses-summary">
              <div className="summary-item">
                <span className="summary-label">Total Expenses:</span>
                <span className="summary-value">PKR <span style={{ color: "red" }}>{totalAmount.toFixed(2)}</span></span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Showing:</span>
                <span className="summary-value">{filteredExpenses.length} of {expenses.length} expenses</span>
              </div>
              {(searchTerm || categoryFilter !== 'all') && (
                <div className="summary-item">
                  <span className="summary-label">Filtered Total:</span>
                  <span className="summary-value filtered-total">PKR {filteredTotalAmount.toFixed(2)}</span>
                </div>
              )}
              {currentExpenses.length > 0 && (
                <div className="summary-item summary-controls">
                  <div className="expenses-list-controls">
                    {isSelectMode && selectedExpense && (
                      <button 
                        className="edit-selected-btn"
                        onClick={handleEditSelected}
                      >
                        Edit
                      </button>
                    )}
                    
                    {isSelectMode && selectedExpense && (
                      <button 
                        className="delete-selected-btn"
                        onClick={handleDeleteSelected}
                      >
                        Delete
                      </button>
                    )}
                    
                    <button 
                      className={`select-mode-btn ${isSelectMode ? 'active' : ''}`}
                      onClick={toggleSelectMode}
                    >
                      {isSelectMode ? 'Exit' : 'Select Items'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {currentExpenses.length > 0 ? (
              <>
                <div className="modern-transactions-list">
                  {currentExpenses.map((expense) => (
                    <div key={expense.id} className={`modern-transaction-card ${isExpenseSelected(expense.id) ? 'selected' : ''}`}>
                      {isSelectMode && (
                        <div className="transaction-select">
                          <input
                            type="checkbox"
                            checked={isExpenseSelected(expense.id)}
                            onChange={() => toggleExpenseSelection(expense.id)}
                          />
                        </div>
                      )}
                      
                      <div className="transaction-icon">
                        <span>💰</span>
                      </div>
                      
                      <div className="transaction-details">
                        <div className="transaction-main">
                          <div className="transaction-description">
                            {expense.description || 'No description'}
                          </div>
                          <div className="transaction-amount">
                            PKR {expense.amount.toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="transaction-meta">
                          <span className="transaction-category">
                            {expense.category_name}
                          </span>
                          <span className="transaction-payment">
                            {expense.payment_method}
                          </span>
                          <span className="transaction-date">
                            {new Date(expense.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                        <button
                          key={number}
                          className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                          onClick={() => paginate(number)}
                        >
                          {number}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      className="pagination-btn"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-data-container">
                <div className="no-data-icon">📝</div>
                <p className="no-data-text">No expenses found matching your criteria</p>
                {(searchTerm || categoryFilter !== 'all') && (
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Edit Expense Modal */}
      {showEditModal && expenseToEdit && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Expense</h3>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>
            <EditExpenseModal 
              expense={expenseToEdit}
              onUpdate={updateExpense}
              onClose={closeEditModal}
              categories={categories}
            />
          </div>
        </div>
      )}
      
      {/* Message Modal (for success/error messages) */}
      {messageModal.show && (
        <div className="message-modal-overlay" onClick={hideMessageModal}>
          <div className="message-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="message-modal-header">
              <h3>{messageModal.type === 'success' ? 'Success' : 'Error'}</h3>
              <button className="message-modal-close" onClick={hideMessageModal}>×</button>
            </div>
            <div className={`message-modal-body ${messageModal.type}`}>
              {messageModal.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Edit Expense Modal Component
const EditExpenseModal = ({ expense, onUpdate, onClose, categories }) => {
  const [formData, setFormData] = useState({
    description: expense.description || '',
    amount: expense.amount || '',
    category_name: expense.category_name || '',
    payment_method: expense.payment_method || '',
    date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomPayment, setShowCustomPayment] = useState(false);
  const [customPaymentMethod, setCustomPaymentMethod] = useState('');
  const [customPaymentOptions, setCustomPaymentOptions] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'payment_method' && value === 'custom') {
      // If user selects 'custom', don't update the form data yet
      setShowCustomPayment(true);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomPaymentSubmit = () => {
    if (customPaymentMethod.trim()) {
      // Add to custom options if not already there
      if (!customPaymentOptions.includes(customPaymentMethod.trim())) {
        setCustomPaymentOptions(prev => [...prev, customPaymentMethod.trim()]);
      }
      
      setFormData(prev => ({
        ...prev,
        payment_method: customPaymentMethod.trim()
      }));
      setShowCustomPayment(false);
      setCustomPaymentMethod('');
    }
  };

  const handleCustomPaymentCancel = () => {
    setShowCustomPayment(false);
    setCustomPaymentMethod('');
    // Reset to original value or default
    setFormData(prev => ({
      ...prev,
      payment_method: expense.payment_method || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate form data
      if (!formData.description || !formData.amount || !formData.category_name || !formData.payment_method || !formData.date) {
        // Call onUpdate with error to trigger message modal
        await onUpdate({ ...expense, ...formData, validationError: true });
        return;
      }
      
      // Format the date to ISO string if not already in the correct format
      const dateValue = formData.date.includes('T') ? formData.date : `${formData.date}T00:00:00`;
      
      const updatedExpense = {
        ...expense,
        ...formData,
        amount: parseFloat(formData.amount),
        id: expense.id,  // Ensure we keep the ID
        date: dateValue  // Ensure proper date format
      };
      
      await onUpdate(updatedExpense);
    } catch (err) {
      console.error('Error updating expense:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="edit-expense-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="category_name">Category:</label>
        <select
          id="category_name"
          name="category_name"
          value={formData.category_name}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category.id || category.name} value={category.name || category}>
              {category.name || category}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="payment_method">Payment Method:</label>
        {showCustomPayment ? (
          <div className="custom-payment-input">
            <input
              type="text"
              id="custom-payment-input"
              value={customPaymentMethod}
              onChange={(e) => setCustomPaymentMethod(e.target.value)}
              placeholder="Enter custom payment method"
              autoFocus
            />
            <div className="custom-payment-buttons">
              <button 
                type="button" 
                className="btn btn-primary custom-payment-btn"
                onClick={handleCustomPaymentSubmit}
              >
                Add
              </button>
              <button 
                type="button" 
                className="btn btn-secondary custom-payment-btn"
                onClick={handleCustomPaymentCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <select
            id="payment_method"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            required
          >
            <option value="">Select Payment Method</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Mobile Payment">Mobile Payment</option>
            {customPaymentOptions.map((method, index) => (
              <option key={`custom-${index}`} value={method}>
                {method}
              </option>
            ))}
            <option value="custom">+ Add Custom</option>
          </select>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpensesList;