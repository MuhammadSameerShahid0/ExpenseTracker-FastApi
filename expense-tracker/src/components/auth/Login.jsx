import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { handleGoogleCallback } from '../utils/GoogleAuth';
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
  const location = useLocation();
  const { login, logout } = useAuth();
  
  // Handle Google OAuth callback
  useEffect(() => {
    const googleAuthResult = handleGoogleCallback(location);
    if (googleAuthResult) {
      // Check if there's an error in the callback
      if (googleAuthResult.error) {
        setError(googleAuthResult.error_description || 'An error occurred during Google authentication. Please try again.');
        return;
      }
      
      // Extract user info from token
      const token = googleAuthResult.access_token;
      
      // Try to verify the token and get user info using the auth context
      const verifyTokenAndLogin = async () => {
        try {
          const response = await fetch('/api/verify-token', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            // Use the auth context to set the user and token
            login(data.user, token);
            // Navigate to dashboard after successful Google login
            navigate('/dashboard');
          } else {
            // Fallback user object if we can't get user info from token
            const fallbackUser = {
              email: 'google_user@example.com', // This would come from the token
              username: 'Google User' // This would come from the token
            };
            login(fallbackUser, token);
            // Navigate to dashboard after successful Google login
            navigate('/dashboard');
          }
        } catch (error) {
          setError('An error occurred during Google login. Please try again.');
        }
      };
      
      verifyTokenAndLogin();
    }
  }, [location, login, navigate]);

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

            {/* Divider with "or" text */}
            <div className="divider-or">
              <span>or</span>
            </div>

            {/* Google Login Button */}
            <button 
              type="button" 
              className="btn btn-google btn-block"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  setError('');
                  const frontendRedirectUri = window.location.origin;
                  const googleRegisterUrl = `/api/register_via_google?frontend_redirect_uri=${encodeURIComponent(frontendRedirectUri)}`;
                  window.location.href = googleRegisterUrl;
                } catch (err) {
                  setError('An error occurred during Google login. Please try again.');
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <svg className="google-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                    <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.64 12 18.64C9.14 18.64 6.71 16.69 5.84 14.09H2.18V16.91C3.99 20.5 7.7 23 12 23Z" fill="#34A853"/>
                    <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.09H2.18C1.43 8.55 1 10.19 1 12C1 13.81 1.43 15.45 2.18 16.91L5.84 14.09Z" fill="#FBBC05"/>
                    <path d="M12 5.36C13.62 5.36 15.06 5.93 16.21 7.03L19.36 3.88C17.45 2.07 14.97 1 12 1C7.7 1 3.99 3.5 2.18 7.09L5.84 9.91C6.71 7.31 9.14 5.36 12 5.36Z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
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