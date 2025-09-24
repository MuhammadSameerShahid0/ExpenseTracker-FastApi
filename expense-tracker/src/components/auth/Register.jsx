import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { handleGoogleCallback } from '../utils/GoogleAuth';
import Navbar from "../Navbar";
import "./Auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    status_2fa: false, // Add 2FA status field
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [verificationData, setVerificationData] = useState({
    emailCode: "",
    totp: "",
  });
  const [qrCode, setQrCode] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false); // For security info modal
  const [reactivationCode, setReactivationCode] = useState(""); // For account reactivation

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
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
            // Navigate to dashboard after successful Google registration
            navigate('/dashboard');
          } else {
            // Fallback user object if we can't get user info from token
            const fallbackUser = {
              email: 'google_user@example.com', // This would come from the token
              username: 'Google User' // This would come from the token
            };
            login(fallbackUser, token);
            // Navigate to dashboard after successful Google registration
            navigate('/dashboard');
          }
        } catch (error) {
          setError('An error occurred during Google registration. Please try again.');
        }
      };
      
      verifyTokenAndLogin();
    }
  }, [location, login, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === "checkbox" ? checked : value 
    });
    setError("");
  };

  const handleVerificationChange = (e) => {
    setVerificationData({ ...verificationData, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("⚠ Passwords do not match");
      return false;
    }
    if (formData.password.length < 8) {
      setError("⚠ Password must be at least 8 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError("");

    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        // Check if we received a token directly (2FA disabled) or need verification (2FA enabled)
        if (data.access_token) {
          // 2FA is disabled, user is registered and logged in directly
          login(
            { email: data.email, username: data.username, fullname: data.fullname },
            data.access_token
          );
          navigate("/dashboard"); // Redirect to dashboard directly
        } else {
          // 2FA is enabled, show verification step
          if (data.qr_code_2fa) {
            setQrCode(data.qr_code_2fa);
            setSecretKey(data.secret_key_2fa);
          }
          setStep(2);
        }
      } else {
        // Check if the error is related to an inactive account that can be reactivated
        if (data.detail && data.detail.includes("Account not active")) {
          // Show reactivation option
          setError(`This email belongs to a deactivated account. Would you like to reactivate it?`);
          // We'll add a state to track if we should show the reactivation UI
          setStep(4); // New step for reactivation
        } else {
          setError(data.detail || "❌ Registration failed");
        }
      }
    } catch (err) {
      setError("⚠ An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/RegistrationVerificationEmailCodeAnd2FAOtp?code=${verificationData.emailCode}&otp=${verificationData.totp}`,
        { method: "GET", credentials: "include" }
      );

      const data = await response.json();
      if (response.ok) {
        login(
          { email: data.email, username: data.username, fullname: data.fullname },
          data.access_token
        );
        setStep(3);
      } else {
        setError(data.detail || "❌ Verification failed");
      }
    } catch (err) {
      setError("⚠ Error during verification. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => navigate("/dashboard");

  // Handle reactivation request
  const handleReactivationRequest = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/re-active-account?email=${encodeURIComponent(formData.email)}`, {
        method: "POST"
      });

      const data = await response.json();

      if (response.ok) {
        setError("Reactivation code sent to your email. Please check your inbox.");
      } else {
        setError(data.detail || "Failed to request account reactivation");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reactivation submission
  const handleReactivationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/re-active-account-verification-email-code?code=${reactivationCode}`, {
        method: "POST"
      });

      const data = await response.json();

      if (response.ok) {
        // Account successfully reactivated, now we need to login the user
        // We'll redirect to login page with a success message
        navigate("/login", { 
          state: { 
            message: "Account successfully reactivated! Please log in with your existing credentials." 
          } 
        });
      } else {
        setError(data.detail || "Failed to reactivate account");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle security info visibility
  const toggleSecurityInfo = () => {
    setShowSecurityInfo(!showSecurityInfo);
  };

  return (
    <div className="auth-container">
      <Navbar />
      
      {/* Security Info Modal */}
      {showSecurityInfo && (
        <div className="modal-overlay" onClick={() => setShowSecurityInfo(false)}>
          <div className="modal-content security-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔒 Account Security</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowSecurityInfo(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="security-info-content">
                <div className="security-feature">
                  <div className="security-icon">🛡️</div>
                  <h4>Two-Factor Authentication (2FA)</h4>
                  <p>Adds an extra layer of security by requiring a code from your phone in addition to your password.</p>
                </div>
                
                <div className="security-feature">
                  <div className="security-icon">📱</div>
                  <h4>Authenticator Apps</h4>
                  <p>Use apps like Google Authenticator, Authy, or Microsoft Authenticator to generate time-based codes.</p>
                </div>
                
                <div className="security-feature">
                  <div className="security-icon">📧</div>
                  <h4>Email Verification</h4>
                  <p>Receive verification codes via email during login to confirm it's really you.</p>
                </div>
                
                <div className="security-tip">
                  <h4>💡 Security Tips</h4>
                  <ul>
                    <li>Always enable 2FA for better protection</li>
                    <li>Use a strong, unique password</li>
                    <li>Save backup codes in a safe place</li>
                    <li>Never share your account credentials</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                onClick={() => setShowSecurityInfo(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Set Up Two-Factor Authentication</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowQrModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="qr-instructions">
                <h4>Instructions:</h4>
                <ol>
                  <li>Download an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator</li>
                  <li>Open the app and tap the '+' button to add a new account</li>
                  <li>Choose "Scan a QR code" and point your camera at the QR code</li>
                  <li>Once scanned, the app will generate a 6-digit code</li>
                  <li>Enter that code in the verification form to complete your registration</li>
                </ol>
                <div className="security-tips">
                  <h5>Security Tips:</h5>
                  <ul>
                    <li>Keep your authenticator app secure</li>
                    <li>Save backup codes in a safe place</li>
                    <li>Don't share your QR code with anyone</li>
                  </ul>
                </div>
              </div>
              <div className="qr-code-container">
                <h4>Scan This QR Code</h4>
                {qrCode ? (
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="QR Code"
                    className="qr-code-img"
                  />
                ) : (
                  <p>Loading QR Code...</p>
                )}
                <p className="qr-note">
                Can't scan the code?{" "}
                <button 
                  type="button" 
                  className="btn-link" 
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  Use setup key instead
                </button>
              </p>
              {showSecretKey && (
                  <div className="secret-key-box">
                    <p>Enter this secret key manually in your authenticator app:</p>
                    <div className="secret-key">{secretKey}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                onClick={() => setShowQrModal(false)}
              >
                I've Scanned the Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="auth-card modern">
        <div className="auth-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Account</span>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Verify</span>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Complete</span>
          </div>
        </div>

        <div className="auth-header">
          <h2>
            {step === 1
              ? "Create Your Account"
              : step === 2
              ? "Verify Your Identity"
              : "🎉 Success!"}
          </h2>
          <p>
            {step === 1
              ? "Sign up and get started today"
              : step === 2
              ? "Enter the codes to secure your account"
              : "Your account is verified and ready!"}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Step 1 - Registration */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength="3"
                  disabled={isLoading}
                  placeholder="Your username"
                />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                disabled={isLoading}
                placeholder="••••••••"
              />
              <div className="password-requirements">
                Must be at least 8 characters
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>

            {/* Security Options */}
            <div className="security-inline">
            <label className="security-toggle-inline">
              <input
                type="checkbox"
                id="status_2fa"
                name="status_2fa"
                checked={formData.status_2fa}
                onChange={handleChange}
              />
              <span className="security-icon-inline">🔒</span>
              Enable Security
            </label>
            <button 
              type="button" 
              className="security-info-inline"
              onClick={toggleSecurityInfo}
              title="Learn more about account security"
            >
              ⓘ
            </button>
            </div>
            <br />
            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
              {isLoading ? <div className="spinner"></div> : "Create Account"}
            </button>

            {/* Divider with "or" text */}
            <div className="divider-or">
              <span>or</span>
            </div>

            {/* Google Registration Button */}
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
                  setError('An error occurred during Google registration. Please try again.');
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
                Already registered? <Link to="/login">Login</Link>
              </p>
            </div>
          </form>
        )}

        {/* Step 2 - Verification */}
        {step === 2 && (
          <>
            <form onSubmit={handleVerificationSubmit} className="auth-form">
              <div className="verification-info">
                <div className="verification-icon">✉️</div>
                <p>
                  We've sent a verification code to your email. Enter both the{" "}
                  <strong>email code</strong> and <strong>authenticator app code</strong>.
                  <button 
                    type="button" 
                    className="btn-link"
                    onClick={() => setShowQrModal(true)}
                  >
                    Need to see the QR code again?
                  </button>
                </p>
              </div>

              <div className="form-group">
                <label>Email Verification Code</label>
                <input
                  type="text"
                  name="emailCode"
                  value={verificationData.emailCode}
                  onChange={handleVerificationChange}
                  required
                  maxLength="6"
                  disabled={isLoading}
                  placeholder="6-digit code"
                  className="code-input"
                />
              </div>

              <div className="form-group">
                <label>Authenticator App Code</label>
                <input
                  type="text"
                  name="totp"
                  value={verificationData.totp}
                  onChange={handleVerificationChange}
                  required
                  maxLength="6"
                  disabled={isLoading}
                  placeholder="6-digit code"
                  className="code-input"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                {isLoading ? <div className="spinner"></div> : "Verify & Continue"}
              </button>

              <div className="resend-code">
                Didn't receive the code? <button type="button" className="btn-link">Resend</button>
              </div>
            </form>
          </>
        )}

        {/* Step 3 - Success */}
        {step === 3 && (
          <div className="auth-success">
            <div className="success-animation">
              <div className="success-icon">✅</div>
            </div>
            <h3>Account Created Successfully!</h3>
            <p>Welcome aboard 🎉 Your account is ready to use.</p>

            <button onClick={handleFinish} className="btn btn-primary btn-block">
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Step 4 - Account Reactivation */}
        {step === 4 && (
          <div className="auth-form-container">
            <form onSubmit={handleReactivationSubmit} className="auth-form">
              <div className="reactivation-info">
                <div className="verification-icon">🔒</div>
                <p>
                  This email belongs to a deactivated account. To reactivate it, we'll send a verification code to your email.
                </p>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="readonly-input"
                />
              </div>

              <button 
                type="button" 
                className="btn btn-secondary btn-block"
                onClick={handleReactivationRequest}
                disabled={isLoading}
              >
                {isLoading ? "Sending Code..." : "Send Reactivation Code"}
              </button>

              <div className="form-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  value={reactivationCode}
                  onChange={(e) => setReactivationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength="6"
                  disabled={isLoading}
                  placeholder="Enter 6-digit code"
                  className="code-input"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={isLoading || reactivationCode.length !== 6}
              >
                {isLoading ? <div className="spinner"></div> : "Reactivate Account"}
              </button>

              <div className="auth-footer">
                <button 
                  type="button" 
                  className="btn btn-link"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Back to Registration
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;