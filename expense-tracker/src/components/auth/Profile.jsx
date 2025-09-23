import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalTransactions: 0,
    categoriesCount: 0
  });
  const [membershipDays, setMembershipDays] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      Promise.all([
        fetchUserProfile(token),
        fetchUserStats(token),
        fetchCategoriesCount(token)
      ]).then(() => {
        setLoading(false);
      }).catch((error) => {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      });
    }
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('/api/user_details', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        
        // Calculate membership days
        if (data.created_at) {
          const createdDate = new Date(data.created_at);
          const today = new Date();
          const daysSinceJoin = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
          setMembershipDays(daysSinceJoin);
        }
        
        return true;
      } else {
        localStorage.removeItem('token');
        navigate('/login');
        return false;
      }
    } catch (error) {
      setError('Failed to fetch user profile');
      localStorage.removeItem('token');
      navigate('/login');
      return false;
    }
  };

  const fetchUserStats = async (token) => {
    try {
      // Fetch total expense amount
      const totalAmountResponse = await fetch('/api/total_amount', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (totalAmountResponse.ok) {
        const totalAmountData = await totalAmountResponse.json();
        console.log('Total amount data:', totalAmountData);
        setStats(prev => ({
          ...prev,
          totalExpenses: typeof totalAmountData === 'number' ? totalAmountData : totalAmountData.total_amount || 0
        }));
      } else {
        console.error('Failed to fetch total amount:', totalAmountResponse.status);
      }

      // Fetch total transactions
      const totalTransactionsResponse = await fetch('/api/total_transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (totalTransactionsResponse.ok) {
        const totalTransactionsData = await totalTransactionsResponse.json();
        console.log('Total transactions data:', totalTransactionsData);
        setStats(prev => ({
          ...prev,
          totalTransactions: totalTransactionsData.total_transactions || 0
        }));
      } else {
        console.error('Failed to fetch total transactions:', totalTransactionsResponse.status);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return false;
    }
  };

  const fetchCategoriesCount = async (token) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const categoriesData = await response.json();
        console.log('Categories data:', categoriesData);
        setStats(prev => ({
          ...prev,
          categoriesCount: categoriesData.length || 0
        }));
      } else {
        console.error('Failed to fetch categories:', response.status);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to fetch categories count:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
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
    <div className="dashboard-container">
      <main className="dashboard-main">
        <div className="profile-container">          
          <div className="profile-content">
            {/* Profile Card */
}
            <div className="modern-card profile-card">
              <div className="profile-header-section">
                <div className="avatar-container">
                  <div className="user-avatar-large">
                    <span className="avatar-initials-large">
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  {user && (
                    <div className="user-status-badge">
                      <div className="status-indicator online"></div>
                      <span className="status-text">Online</span>
                    </div>
                  )}
                </div>
                
                <div className="user-info">
                  <h2 className="user-name">{user?.fullname || user?.username || 'User'}</h2>
                  <p className="user-email">{user?.email || 'user@example.com'}</p>
                  
                 
                  
                  <div className="user-stats">
                    <div className="stat-item">
                      <span className="stat-value">PKR {stats.totalExpenses.toFixed(2)}</span>
                      <span className="stat-label">Spent Amount</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{stats.categoriesCount}</span>
                      <span className="stat-label">Categories</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{stats.totalTransactions}</span>
                      <span className="stat-label">Transactions</span>
                    </div>
                    
                     {/* Membership Card */
}
                    <div className="membership-icon">🎉</div>
                    <div className="membership-details">
                      <h3>Membership</h3>
                      <div className="membership-days">{membershipDays}</div>
                      <p>Days with us</p>
                  </div>

                  </div>
                </div>
              </div>
              
              <div className="profile-details-grid">
                <div className="detail-card">
                  <div className="detail-icon">👤</div>
                  <div className="detail-content">
                    <h3>Personal Information</h3>
                    <p><strong>Full Name:</strong> {user?.fullname || 'Not provided'}</p>
                    <p><strong>Username:</strong> {user?.username || 'Not provided'}</p>
                    <p><strong>Join Date:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}</p>
                  </div>
                </div>
                
                <div className="detail-card">
                  <div className="detail-icon">📧</div>
                  <div className="detail-content">
                    <h3>Contact Information</h3>
                    <p><strong>Email:</strong> {user?.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="detail-card">
                  <div className="detail-icon">🔒</div>
                  <div className="detail-content">
                    <h3>Security</h3>
                    <p>
                      <strong>2FA Status:</strong>
                      <span className={`status-badge ${user?.status_2fa ? 'enabled' : 'disabled'}`}>
                        {user?.status_2fa ? 'Enabled' : 'Disabled'}
                      </span>
                    </p>
                    <p><strong>Last Login:</strong> Today</p>
                  </div>
                </div>
                
                <div className="detail-card">
                  <div className="detail-icon">⚙️</div>
                  <div className="detail-content">
                    <h3>Account Settings</h3>
                    <p>Manage your account preferences and security settings</p>
                    <button 
                      className="btn btn-outline btn-small"
                      onClick={() => navigate('/account-settings')}
                    >
                      Manage Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;