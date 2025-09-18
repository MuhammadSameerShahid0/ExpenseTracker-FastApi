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
  const [step, setStep] = useState(1); // 1: login form, 2: verification
  const [verificationData, setVerificationData] = useState({
    emailCode: '',
    totp: ''
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
        setStep(2); // Move to verification step
      } else {
        setError(data.detail || 'Login failed');
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
        // Use the auth context to set the user and token
        login({ email: data.email, username: data.username }, data.access_token);
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

  return (
    <div className="auth-container">
      <Navbar />
      <div className="auth-card">
        <div className="auth-header">
          <h2>{step === 1 ? 'Welcome Back' : 'Two-Factor Authentication'}</h2>
          <p>{step === 1 ? 'Sign in to your account' : 'Enter verification codes'}</p>
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
            </div>
          </form>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Login;