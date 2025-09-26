import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import './Auth.css';
import './AccountReactivation.css';

const AccountReactivation = () => {
  const [formData, setFormData] = useState({
    email: '',
    code: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleReactivationRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate email is present
    if (!formData.email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend

      const response = await fetch(`${apiBaseUrl}/api/re-active-account?email=${encodeURIComponent(formData.email)}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setCodeSent(true);
        setSuccess('Reactivation code sent to your email. Please check your inbox.');
      } else {
        setError(data.detail || 'Failed to request account reactivation');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate code is present
    if (!formData.code) {
      setError('Please enter the verification code');
      setIsLoading(false);
      return;
    }

    try {
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend

      const response = await fetch(`${apiBaseUrl}/api/re-active-account-verification-email-code?code=${formData.code}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Account successfully reactivated! You can now log in.');
        // Clear form after success
        setFormData({ email: '', code: '' });
        setCodeSent(false);
      } else {
        setError(data.detail || 'Failed to reactivate account');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Navbar />
      <div className="auth-card">
        <div className="auth-header">
          <h2>Account Reactivation</h2>
          <p>Reactivate your account to continue using ExpenseTracker</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <form onSubmit={codeSent ? handleReactivationSubmit : handleReactivationRequest} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading || codeSent}
              placeholder="Enter your email address"
            />
          </div>

          {codeSent && (
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                maxLength="6"
                disabled={isLoading}
                placeholder="Enter 6-digit code"
              />
              <div className="resend-code">
                Didn't receive the code?{' '}
                <button 
                  type="button" 
                  className="btn-link"
                  onClick={handleReactivationRequest}
                  disabled={isLoading}
                >
                  Resend
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? (codeSent ? 'Reactivating...' : 'Sending Code...') : 
             codeSent ? 'Reactivate Account' : 'Send Reactivation Code'}
          </button>

          <div className="auth-footer">
            <p>
              Remember your password? <Link to="/login">Login</Link>
            </p>
            <p>
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountReactivation;