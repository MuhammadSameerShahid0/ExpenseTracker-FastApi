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

  // Update activeTab when the modal opens with a new initialTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Form state for adding budget
  const [formData, setFormData] = useState({
    categoryId: '',
    limit: ''
  });

  // State for budget filtering
  const [filterTerm, setFilterTerm] = useState('');
  const [showFilterInput, setShowFilterInput] = useState(false);
  
  // State for editing budget
  const [editingBudget, setEditingBudget] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Additional state for edit modal loading and errors
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

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
      const expenseCategories = data;
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

  // Filter budgets based on search term
  const filteredBudgets = budgets.filter(budget => 
    budget.category_name.toLowerCase().includes(filterTerm.toLowerCase())
  );
  
  // Get current filtered budgets for pagination
  const indexOfLastBudget = currentPage * budgetsPerPage;
  const indexOfFirstBudget = indexOfLastBudget - budgetsPerPage;
  const currentFilteredBudgets = filteredBudgets.slice(indexOfFirstBudget, indexOfLastBudget);
  const filteredTotalPages = Math.ceil(filteredBudgets.length / budgetsPerPage);
  
  // Calculate total amount for filtered budgets
  const filteredTotalAmount = filteredBudgets.reduce((sum, budget) => sum + budget.amount, 0);

  // Function to toggle filter input visibility
  const toggleFilterInput = () => {
    const newValue = !showFilterInput;
    setShowFilterInput(newValue);
    
    // Focus the input when showing it
    if (newValue && filterInputRef.current) {
      setTimeout(() => {
        filterInputRef.current.focus();
      }, 100);
    }
  };

  // Function to handle editing a budget
  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setEditAmount(budget.amount.toString());
    setShowEditModal(true);
  };

  // Function to save edited budget
  const handleSaveEdit = async () => {
    if (!editAmount || parseFloat(editAmount) <= 0) {
      setEditError('Please enter a valid amount');
      return;
    }

    try {
      setEditLoading(true);
      setEditError('');
      const response = await budgetService.editBudgetAmount(
        editingBudget.category_id,
        parseFloat(editAmount)
      );
      
      setEditSuccess(response);
      setEditingBudget(null);
      setEditAmount('');
      setShowEditModal(false);
      
      // Refresh budgets list
      loadBudgets();
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Function to handle cancelling edit
  const handleCancelEdit = () => {
    setEditingBudget(null);
    setEditAmount('');
    setEditError('');
    setEditSuccess('');
    setShowEditModal(false);
  };

  // Function to handle deleting a budget
  const handleDeleteBudget = (budget) => {
    setBudgetToDelete(budget);
    setShowDeleteModal(true);
  };

  // Function to confirm delete
  const handleConfirmDelete = async () => {
    if (!budgetToDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError('');
      const response = await budgetService.deleteBudget(budgetToDelete.category_id);
      
      setDeleteSuccess(response);
      setBudgetToDelete(null);
      setShowDeleteModal(false);
      
      // Refresh budgets list
      loadBudgets();
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setDeleteSuccess(''), 3000);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Function to handle cancelling delete
  const handleCancelDelete = () => {
    setBudgetToDelete(null);
    setDeleteError('');
    setDeleteSuccess('');
    setShowDeleteModal(false);
  };

  // Function to paginate with filtered budgets
  const paginateFiltered = (pageNumber) => {
    const newStartIndex = (pageNumber - 1) * budgetsPerPage;
    if (newStartIndex < filteredBudgets.length || pageNumber === 1) {
      setCurrentPage(pageNumber);
    } else if (filteredBudgets.length > 0) {
      // If the page would be empty, go to the last valid page
      const lastValidPage = Math.max(1, Math.ceil(filteredBudgets.length / budgetsPerPage));
      setCurrentPage(lastValidPage);
    }
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay blurred" onClick={onClose}>
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
              {/* Filter input */}
              <div className="filter-section">
                <span className="filter-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Filter by category..."
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  className="filter-input"
                />
              </div>
              
              {loading ? (
                <div className="loading">Loading budgets...</div>
              ) : filteredBudgets.length > 0 ? (
                <>
                  <div className="budgets-grid">
                    {currentFilteredBudgets.map(budget => (
                      <div key={budget.id} className="budget-card">
                        <div className="budget-icon">💰</div>
                        <div className="budget-info">
                          <div className="budget-amount">PKR {budget.amount.toFixed(2)}</div>
                          <span> {budget.category_name}</span>
                            &nbsp; &nbsp;
                          <div className="budget-month">
                            {new Date(2023, budget.month - 1).toLocaleString('default', { month: 'long' })}
                          </div>
                        </div>
                        <button className="edit-budget-btn" title="Edit Budget" onClick={() => handleEditBudget(budget)}>
                          Edit
                        </button>
                        <button 
                          className="delete-budget-btn" 
                          title="Delete Budget" 
                          onClick={() => handleDeleteBudget(budget)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total amount display */}
                  <div className="total-amount-section">
                    <div className="total-amount-label">Total Amount:</div>
                    <div className="total-amount-value">PKR {filteredTotalAmount.toFixed(2)}</div>
                  </div>
                  
                  {/* Pagination controls */}
                  {filteredTotalPages > 1 && (
                      <div className="pagination">
                        <button 
                          onClick={() => paginateFiltered(currentPage - 1)} 
                          disabled={currentPage === 1}
                          className="pagination-btn"
                        >
                          Prev
                        </button>
                        <span className="page-info">
                          {currentPage} of {filteredTotalPages}
                        </span>
                        <button 
                          onClick={() => paginateFiltered(currentPage + 1)} 
                          disabled={currentPage === filteredTotalPages}
                          className="pagination-btn"
                        >
                          Next
                        </button>
                      </div>
                  )}
                </>
              ) : (
                <div className="no-budgets">
                  <p>No budgets found.</p>
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      setFilterTerm('');
                      setActiveTab('add');
                    }}
                  >
                    Add Your First Budget
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Budget Modal */}
      {showEditModal && editingBudget && (
        <div className="edit-budget-modal-overlay blurred" onClick={handleCancelEdit}>
          <div className="edit-budget-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-budget-header">
              <h3>Edit Budget</h3>
              <button className="modal-close" onClick={handleCancelEdit}>&times;</button>
            </div>
            
            {editError && (
              <div className="alert error">
                <div className="alert-content">{editError}</div>
                <button className="alert-close" onClick={() => setEditError('')}>×</button>
              </div>
            )}
            
            {editSuccess && (
              <div className="alert success">
                <div className="alert-content">{editSuccess}</div>
              </div>
            )}
            
            <div className="edit-budget-form">
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={editingBudget.category_name || ''}
                  readOnly
                  className="readonly-input"
                />
              </div>
              
              <div className="form-group">
                <label>Month</label>
                <input
                  type="text"
                  value={new Date(2023, editingBudget.month - 1).toLocaleString('default', { month: 'long' })}
                  readOnly
                  className="readonly-input"
                />
              </div>
              
              <div className="form-group">
                <label>Amount (PKR)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="editable-input"
                  disabled={editLoading}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={handleCancelEdit}
                  disabled={editLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Budget Confirmation Modal */}
      {showDeleteModal && budgetToDelete && (
        <div className="delete-budget-modal-overlay blurred" onClick={handleCancelDelete}>
          <div className="delete-budget-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-budget-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={handleCancelDelete}>&times;</button>
            </div>
            
            {deleteError && (
              <div className="alert error">
                <div className="alert-content">{deleteError}</div>
                <button className="alert-close" onClick={() => setDeleteError('')}>×</button>
              </div>
            )}
            
            {deleteSuccess && (
              <div className="alert success">
                <div className="alert-content">{deleteSuccess}</div>
              </div>
            )}
            
            <div className="delete-budget-content">
              <p>Are you sure you want to delete the budget for <strong>{budgetToDelete.category_name}</strong>?</p>
              <p>This action cannot be undone.</p>
            </div>
            
            <div className="form-actions">
              <button 
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button 
                className="btn btn-outline"
                onClick={handleCancelDelete}
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetModal;