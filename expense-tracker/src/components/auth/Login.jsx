import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Navbar from '../Navbar';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: login form, 2: verification, 3: reactivation
  const [verificationData, setVerificationData] = useState({
    emailCode: '',
    totp: ''
  });
  const [reactivationData, setReactivationData] = useState({
    email: '',
    code: ''
  });
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleVerificationChange = (e) => {
    setVerificationData({
      ...verificationData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleReactivationChange = (e) => {
    setReactivationData({
      ...reactivationData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        // Check if we received a token directly (2FA disabled) or a message (2FA enabled)
        if (data.access_token) {
          // 2FA is disabled, we received a token directly
          login({ email: formData.email, username: data.username }, data.access_token);
          navigate('/dashboard'); // Redirect to dashboard
        } else {
          // 2FA is enabled, move to verification step
          setStep(2); // Move to verification step
        }
      } else {
        // Check if the error is related to an inactive account
        if (data.detail && data.detail.includes('Account not active')) {
          // Set the email for reactivation and move to reactivation step
          setReactivationData(prev => ({ ...prev, email: formData.email }));
          setStep(3);
        } else {
          setError(data.detail || 'Login failed');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/LoginVerificationEmailCodeAnd2FAOtp?code=${verificationData.emailCode}&otp=${verificationData.totp}`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        // Extract user info from session or use email from login form
        const user = {
          email: formData.email,
          username: data.username || 'User'
        };
        
        // Use the auth context to set the user and token
        login(user, data.access_token);
        navigate('/dashboard'); // Redirect to dashboard
      } else {
        setError(data.detail || 'Verification failed');
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivationRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate email is present
    if (!reactivationData.email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/re-active-account?email=${encodeURIComponent(reactivationData.email)}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        // Successfully requested reactivation, keep user on this step to enter code
        setError('Reactivation code sent to your email. Please check your inbox.');
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

    // Validate code is present
    if (!reactivationData.code) {
      setError('Please enter the verification code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/re-active-account-verification-email-code?code=${reactivationData.code}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        // Account successfully reactivated, move back to login
        setError('Account successfully reactivated! Please log in again.');
        setStep(1);
        // Clear form data
        setFormData({ email: reactivationData.email, password: '' });
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
          <h2>
            {step === 1 ? 'Welcome Back' : 
             step === 2 ? 'Two-Factor Authentication' : 
             'Account Reactivation'}
          </h2>
          <p>
            {step === 1 ? 'Sign in to your account' : 
             step === 2 ? 'Enter verification codes' : 
             'Reactivate your account to continue'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="auth-footer">
              <p>
                Don't have an account? <Link to="/register">Sign up</Link>
              </p>
              <p>
                <Link to="/reactivate-account">Reactivate your account</Link>
              </p>
            </div>
          </form>
        ) : step === 2 ? (
          <div className="auth-form-container">
            <form onSubmit={handleVerificationSubmit} className="auth-form verification-form">
           
              <div className="form-group">
                <label htmlFor="emailCode">Email Verification Code</label>
                <input
                  type="text"
                  id="emailCode"
                  name="emailCode"
                  value={verificationData.emailCode}
                  onChange={handleVerificationChange}
                  required
                  maxLength="6"
                  disabled={isLoading}
                  placeholder="Enter 6-digit code"
                />
              </div>

              <div className="form-group">
                <label htmlFor="totp">Authenticator App Code</label>
                <input
                  type="text"
                  id="totp"
                  name="totp"
                  value={verificationData.totp}
                  onChange={handleVerificationChange}
                  required
                  maxLength="6"
                  disabled={isLoading}
                  placeholder="Enter 6-digit code"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify and Sign In'}
              </button>

              <div className="auth-footer">
                <button 
                  type="button" 
                  className="btn btn-link"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        ) : (
          // Reactivation form
          <div className="auth-form-container">
            <form onSubmit={handleReactivationSubmit} className="auth-form verification-form">
              <div className="reactivation-info">
                <p>Your account has been deactivated. To reactivate it, we'll send a verification code to your email.</p>
              </div>

              <div className="form-group">
                <label htmlFor="reactivationEmail">Email Address</label>
                <input
                  type="email"
                  id="reactivationEmail"
                  name="email"
                  value={reactivationData.email}
                  onChange={handleReactivationChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <button 
                type="button" 
                className="btn btn-secondary btn-block"
                onClick={handleReactivationRequest}
                disabled={isLoading}
              >
                {isLoading ? 'Sending Code...' : 'Send Reactivation Code'}
              </button>

              <div className="form-group">
                <label htmlFor="reactivationCode">Verification Code</label>
                <input
                  type="text"
                  id="reactivationCode"
                  name="code"
                  value={reactivationData.code}
                  onChange={handleReactivationChange}
                  required
                  maxLength="6"
                  disabled={isLoading}
                  placeholder="Enter 6-digit code"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={isLoading}
              >
                {isLoading ? 'Reactivating...' : 'Reactivate Account'}
              </button>

              <div className="auth-footer">
                <button 
                  type="button" 
                  className="btn btn-link"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;