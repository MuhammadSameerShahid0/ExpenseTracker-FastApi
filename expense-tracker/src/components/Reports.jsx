import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Reports.css';

const Reports = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  
  const navigate = useNavigate();
  const reportRef = useRef();
  const { user } = useAuth();  

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
        
        // Extract unique payment methods
        const uniquePaymentMethods = [...new Set(data.map(expense => expense.payment_method).filter(Boolean))];
        setPaymentMethods(uniquePaymentMethods);
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

  // Apply filters
  useEffect(() => {
    let filtered = [...expenses];

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category_name === categoryFilter);
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(expense => expense.payment_method === paymentMethodFilter);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(expense => new Date(expense.date) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter(expense => new Date(expense.date) <= new Date(endDate));
    }

    // Amount range filter
    if (minAmount !== '') {
      filtered = filtered.filter(expense => expense.amount >= parseFloat(minAmount));
    }

    if (maxAmount !== '') {
      filtered = filtered.filter(expense => expense.amount <= parseFloat(maxAmount));
    }

    setFilteredExpenses(filtered);
  }, [categoryFilter, paymentMethodFilter, startDate, endDate, minAmount, maxAmount, expenses]);

  // Calculate total amount of filtered expenses
  const calculateTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const generatePDF = (download = false) => {
  setGeneratingPDF(true);

  try {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("ExpenseTracker Report", 105, 20, null, null, "center");

    // User info
    doc.setFontSize(12);
    if (user) {
      if (user.username) {
        doc.text(`Name: ${user.username}`, 105, 30, null, null, "center");
      }
      if (user.email) {
        doc.text(`Email: ${user.email}`, 105, 40, null, null, "center");
      }
    }

    // Date range
    const dateRange =
      startDate && endDate
        ? `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
        : "All Time";
    doc.text(`Period: ${dateRange}`, 105, 50, null, null, "center");

    // Summary
    doc.text(`Total Expenses: PKR ${calculateTotalAmount().toFixed(2)}`, 20, 60);
    doc.text(`Transactions: ${filteredExpenses.length}`, 20, 70);

    // Table
    const tableData = filteredExpenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.description || "No description",
      expense.category_name,
      expense.payment_method,
      `PKR ${expense.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [["Date", "Description", "Category", "Payment Method", "Amount"]],
      body: tableData,
      startY: 80,
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: [67, 97, 238],
        textColor: [255, 255, 255],
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 70 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, null, null, "center");
    }

    if (download) {
      // Direct download
      doc.save(`expense-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } else {
      // Open preview in new tab
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    }
  } catch (err) {
    console.error("Error generating PDF:", err);
    alert("Error generating PDF report. Please try again.");
  } finally {
    setGeneratingPDF(false);
  }
};


  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading reports...</p>
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
    <div className="reports-container">
      <main className="reports-main">
        <div className="reports-layout">
          {/* Sidebar with filters */}
          <div className="reports-sidebar">
            <div className="sidebar-card">
              <h3>Filters</h3>
              
              <div className="filter-group">
                <label htmlFor="categoryFilter">Category</label>
                <select 
                  id="categoryFilter"
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories
                    .map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="paymentMethodFilter">Payment Method</label>
                <select 
                  id="paymentMethodFilter"
                  className="filter-select"
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                >
                  <option value="all">All Payment Methods</option>
                  {paymentMethods.map((method, index) => (
                    <option key={index} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Date Range</label>
                <div className="date-range">
                  <input
                    type="date"
                    className="filter-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                  <center>
                  <span>to</span>
                  </center>
                  <input
                    type="date"
                    className="filter-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
              </div>
              
              <div className="filter-group">
                <label>Amount Range</label>
                <div className="amount-range">
                  <input
                    type="number"
                    className="filter-input"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="Min Amount"
                    step="0.01"
                  />
                   <center>
                  <span>to</span>
                  </center>
                  <input
                    type="number"
                    className="filter-input"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="Max Amount"
                    step="0.01"
                  />
                </div>
              </div>
              
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setCategoryFilter('all');
                  setPaymentMethodFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setMinAmount('');
                  setMaxAmount('');
                }}
              >
                Clear Filters
              </button>
            </div>
            
            <div className="sidebar-card">
  <h3>Report Summary</h3>
  <div className="summary-item">
    <span className="summary-label">Total Expenses:</span>
    <span className="summary-value">PKR {calculateTotalAmount().toFixed(2)}</span>
  </div>
  <div className="summary-item">
    <span className="summary-label">Transactions:</span>
    <span className="summary-value">{filteredExpenses.length}</span>
  </div>

  {/* ✅ Wrap buttons inside flex */}
  <div className="button-group">
    <button 
      className="btn btn-outline"
      onClick={() => generatePDF(false)}  // Preview in new tab
    >
      Preview PDF
    </button>

    <button 
      className="btn btn-primary"
      onClick={generatePDF}
      disabled={filteredExpenses.length === 0 || generatingPDF}
    >
      {generatingPDF ? 'Generating PDF...' : '📄 Download'}
    </button>
  </div>
</div>

          </div>
          
          {/* Main content with report preview */}
          <div className="reports-content">
            <div className="content-header">
              <h2>Expense Report</h2>
              <div className="report-info">
                <span>
                  {startDate && endDate 
                    ? `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` 
                    : 'All Time'}
                </span>
              </div>
            </div>
            
            {filteredExpenses.length > 0 ? (
              <div className="report-preview" ref={reportRef}>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Payment Method</th>
                      <th className="amount-column">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                        <td>{expense.description || 'No description'}</td>
                        <td>{expense.category_name}</td>
                        <td>{expense.payment_method}</td>
                        <td className="amount-column">PKR {expense.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" className="total-label">Total:</td>
                      <td className="total-amount">PKR {calculateTotalAmount().toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="no-data-container">
                <div className="no-data-icon">📊</div>
                <p className="no-data-text">No expenses found matching your criteria</p>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    setCategoryFilter('all');
                    setPaymentMethodFilter('all');
                    setStartDate('');
                    setEndDate('');
                    setMinAmount('');
                    setMaxAmount('');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;