import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import './Auth.css';

const AccountSettings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
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
            setFormData({
              fullname: data.fullname || '',
              email: data.email || '',
              currentPassword: '',
              newPassword: '',
              confirmNewPassword: ''
            });
          } else {
            localStorage.removeItem('token');
            navigate('/login');
          }
        } catch (error) {
          setError('Failed to fetch user profile');
          localStorage.removeItem('token');
          navigate('/login');
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserProfile(token);
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
        setFormData({
          fullname: data.fullname || '',
          email: data.email || '',
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      } else {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (error) {
      setError('Failed to fetch user profile');
      localStorage.removeItem('token');
      navigate('/login');
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Basic validation
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        fullname: formData.fullname,
        email: formData.email
      };
      
      const response = await fetch('/api/user_profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        setSuccess('Profile updated successfully');
        setIsEditing(false);
        // Refresh user data
        fetchUserProfile(token);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update profile');
      }
    } catch (error) {
      setError('An error occurred while updating profile');
    }
  };

  const handle2FASetup = () => {
    // This would integrate with your 2FA system
    alert('2FA setup would be implemented here');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Implement account deletion logic
      alert('Account deletion would be implemented here');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Navbar />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading account settings...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="dashboard-container">
        <Navbar />
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
      <Navbar />
      <main className="dashboard-main">
        <div className="settings-container">
          <div className="settings-header">
            <h1>Account Settings</h1>
            <button 
              className="btn btn-outline"
              onClick={() => navigate('/profile')}
              style={{ marginLeft: '1rem' }}
            >
              ← Back to Profile
            </button>
          </div>
          
          <div className="settings-content">
            {/* Profile Information Card */}
            <div className="modern-card">
              <div className="card-header">
                <h2>Profile Information</h2>
                <button 
                  className="btn btn-outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
              
              {error && <div className="alert error">{error}</div>}
              {success && <div className="alert success">{success}</div>}
              
              <form onSubmit={handleUpdateProfile} className="settings-form">
                <div className="form-group">
                  <label htmlFor="fullname">Full Name</label>
                  <input
                    type="text"
                    id="fullname"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                  />
                </div>
                
                {isEditing && (
                  <>
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        placeholder="Required to make changes"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirmNewPassword">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        value={formData.confirmNewPassword}
                        onChange={handleInputChange}
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
            
            {/* Security Settings Card */}
            <div className="modern-card">
              <div className="card-header">
                <h2>Security</h2>
              </div>
              
              <div className="security-settings">
                <div className="security-item">
                  <div className="security-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button 
                    className="btn btn-outline"
                    onClick={handle2FASetup}
                  >
                    {user?.status_2fa ? 'Manage' : 'Enable'} 2FA
                  </button>
                </div>
                
                <div className="security-item">
                  <div className="security-info">
                    <h3>Login History</h3>
                    <p>View your recent login activity</p>
                  </div>
                  <button className="btn btn-outline">
                    View History
                  </button>
                </div>
              </div>
            </div>
            
            {/* Account Management Card */}
            <div className="modern-card">
              <div className="card-header">
                <h2>Account Management</h2>
              </div>
              
              <div className="account-actions">
                <div className="action-item">
                  <div className="action-info">
                    <h3>Export Data</h3>
                    <p>Download a copy of your expense data</p>
                  </div>
                  <button className="btn btn-outline">
                    Export
                  </button>
                </div>
                
                <div className="action-item danger">
                  <div className="action-info">
                    <h3>Delete Account</h3>
                    <p>Permanently delete your account and all data</p>
                  </div>
                  <button 
                    className="btn btn-danger"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;