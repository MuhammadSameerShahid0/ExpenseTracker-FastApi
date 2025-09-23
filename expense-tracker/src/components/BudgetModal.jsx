import React, { useState, useEffect } from 'react';
import { budgetService } from '../services/budgetService';
import './BudgetModal.css';

const BudgetModal = ({ isOpen, onClose, initialTab = 'add' }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'add' or 'view'
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for adding budget
  const [formData, setFormData] = useState({
    categoryId: '',
    limit: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const budgetsPerPage = 2;

  // Auto-hide alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);

      // Cleanup function to clear the timer if alert changes
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Load categories and budgets when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadBudgets();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await budgetService.getCategories();
      // Filter only expense categories
      const expenseCategories = data.filter(cat => cat.type === 'expense');
      setCategories(expenseCategories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await budgetService.getBudgets();
      setBudgets(data);
      // Reset to first page when loading new budgets
      setCurrentPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.categoryId || !formData.limit) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await budgetService.addBudget(
        parseFloat(formData.limit),
        parseInt(formData.categoryId)
      );
      setSuccess(response);
      setFormData({ categoryId: '', limit: '' });
      // Refresh budgets list
      loadBudgets();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get current budgets for pagination
  const indexOfLastBudget = currentPage * budgetsPerPage;
  const indexOfFirstBudget = indexOfLastBudget - budgetsPerPage;
  const currentBudgets = budgets.slice(indexOfFirstBudget, indexOfLastBudget);
  const totalPages = Math.ceil(budgets.length / budgetsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="budget-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Budget Management</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Set Budget
          </button>
          <button 
            className={`tab ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}
          >
            View Budgets
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert error">
              <div className="alert-content">{error}</div>
              <button className="alert-close" onClick={() => setError('')}>×</button>
            </div>
          )}
          {success && (
            <div className="alert success">
              <div className="alert-content">{success}</div>
              <button className="alert-close" onClick={() => setSuccess('')}>×</button>
            </div>
          )}

          {activeTab === 'add' ? (
            <form onSubmit={handleAddBudget} className="budget-form">
              <div className="form-group">
                <label htmlFor="categoryId">Category</label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="limit">Budget Limit (PKR)</label>
                <input
                  type="number"
                  id="limit"
                  name="limit"
                  value={formData.limit}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter budget limit"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Set Budget'}
              </button>
            </form>
          ) : (
            <div className="budgets-list">
              {loading ? (
                <div className="loading">Loading budgets...</div>
              ) : currentBudgets.length > 0 ? (
                <>
                  <div className="budgets-grid">
                    {currentBudgets.map(budget => (
                      <div key={budget.id} className="budget-card">
                        <div className="budget-category">{budget.category_name}</div>
                        <div className="budget-amount">PKR {budget.amount.toFixed(2)}</div>
                        <div className="budget-month">
                          {new Date(2023, budget.month - 1).toLocaleString('default', { month: 'long' })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="pagination-controls">
                      <div className="pagination-info">
                        Showing {indexOfFirstBudget + 1}-{Math.min(indexOfLastBudget, budgets.length)} of {budgets.length} budgets
                      </div>
                      <div className="pagination">
                        <button 
                          onClick={() => paginate(currentPage - 1)} 
                          disabled={currentPage === 1}
                          className="pagination-btn"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                          >
                            {number}
                          </button>
                        ))}
                        <button 
                          onClick={() => paginate(currentPage + 1)} 
                          disabled={currentPage === totalPages}
                          className="pagination-btn"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-budgets">
                  <p>No budgets set yet.</p>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setActiveTab('add')}
                  >
                    Add Your First Budget
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetModal;