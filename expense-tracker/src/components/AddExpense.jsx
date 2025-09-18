import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './AddExpense.css';

const AddExpense = () => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([
    'Cash', 'Credit Card', 'Debit Card', 'Jazzcash', 'Easypaisa', 'Sadapay', 'Nayapay'
  ]); // default options

  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/categories', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    const token = localStorage.getItem('token');
    if (token) fetchCategories();
  }, []);

  // Add expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          category_name: category,
          date: new Date(date).toISOString(),
          payment_method: paymentMethod
        }),
      });

      if (res.ok) {
        setSuccess('✅ Expense added successfully!');
        setAmount('');
        setDescription('');
        setCategory('');
        setDate(new Date().toISOString().split('T')[0]);

        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to add expense');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategory, type: 'expense' }),
      });

      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setCategory(newCat.name);
        setNewCategory('');
        setShowAddCategory(false);
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to add category');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <main className="dashboard-main">
        <div className="form-page-layout">
          {/* Left side: Blog / Tips Section */}
          <aside className="blog-panel">
            <h3>💡 Expense Tracking Tips</h3>
            <div className="blog-card">
              <h4>📊 Track Every Penny</h4>
              <p>
                Small expenses add up quickly. Recording even coffee runs helps
                you see the bigger picture.
              </p>
            </div>
            <div className="blog-card">
              <h4>🎯 Set Monthly Goals</h4>
              <p>
                Allocate budgets per category (food, travel, shopping) and stick
                to them for better control.
              </p>
            </div>
            <div className="blog-card">
              <h4>📈 Analyze Your Reports</h4>
              <p>
                Check your spending patterns weekly to adjust your financial
                habits effectively.
              </p>
            </div>
            <div className="blog-card">
              <h4>🕒 Review Weekly</h4>
              <p>
                Spend 10 minutes every week reviewing expenses to spot bad
                habits early.
              </p>
            </div>
            <div className="blog-card">
              <h4>💡 Review Monthly Budget</h4>
              <p>
                Change the month and view the spent amount according to the selected month
              </p>
            </div>
          </aside>

          {/* Right side: Add Expense form */}
          <div className="form-wrapper">
            <div className="form-card">
              <h2 className="form-title">➕ Add New Expense</h2>

              {error && <div className="alert error">{error}</div>}
              {success && <div className="alert success">{success}</div>}

              <form onSubmit={handleAddExpense} className="expense-form">
                <div className="form-group">
                  <label htmlFor="amount">💲 Amount *</label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">📝 Description</label>
                  <input
                    type="text"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you spend on?"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date">📅 Date *</label>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">📂 Category *</label>
                  <div className="category-row">
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories
                        .filter((cat) => cat.type === 'expense')
                        .map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowAddCategory(!showAddCategory)}
                    >
                      + Category
                    </button>
                  </div>

                  {showAddCategory && (
                    <div className="new-category-row">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New category name"
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAddCategory}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                <label htmlFor="paymentMethod">💳 Payment Method *</label>
                <div className="category-row">
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="">Select a payment method</option>
                    {paymentMethods.map((method, idx) => (
                      <option key={idx} value={method}>{method}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowAddPaymentMethod(!showAddPaymentMethod)}
                  >
                    + Payment
                  </button>
                </div>
                  
                {showAddPaymentMethod && (
                  <div className="new-category-row">
                    <input
                      type="text"
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value)}
                      placeholder="New payment method"
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        if(newPaymentMethod.trim()) {
                          setPaymentMethods([...paymentMethods, newPaymentMethod.trim()]);
                          setPaymentMethod(newPaymentMethod.trim());
                          setNewPaymentMethod('');
                          setShowAddPaymentMethod(false);
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Expense'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddExpense;
