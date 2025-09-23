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
      const response = await fetch('/api/expenses', {
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
      const response = await fetch('/api/categories', {
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
            </div>

            {currentExpenses.length > 0 ? (
              <>
                <div className="modern-transactions-list">
                  {currentExpenses.map((expense) => (
                    <div key={expense.id} className="modern-transaction-card">
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
    </div>
  );
};

export default ExpensesList;