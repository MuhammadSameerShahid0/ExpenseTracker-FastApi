import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Navbar from "../Navbar";
import "./Auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        if (data.qr_code_2fa) {
          setQrCode(data.qr_code_2fa);
          setSecretKey(data.secret_key_2fa);
          setShowQrModal(true); // Show modal with QR code
        }
        setStep(2);
      } else {
        setError(data.detail || "❌ Registration failed");
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

  return (
    <div className="auth-container">
      <Navbar />
      {/* QR Code Modal */}
      {showQrModal && (
        <div className="modal-overlay">
          <div className="modal-content">
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

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
              {isLoading ? <div className="spinner"></div> : "Create Account"}
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
      </div>
    </div>
  );
};

export default Register;