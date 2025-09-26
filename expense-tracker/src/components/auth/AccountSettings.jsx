import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AccountSettings.css';

const AccountSettings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(3);
  const [qrCode, setQrCode] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
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
      fetchUserProfile(token);
    }
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/user_details`, {
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
    
    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Check if password fields are being updated
      if (formData.currentPassword || formData.newPassword) {
        // For password changes, send to change-password endpoint
        const updateData = {
          fullname: formData.fullname,
          email: formData.email,
          current_password: formData.currentPassword || "",
          new_password: formData.newPassword || ""
        };
        
        // Determine the API base URL based on the environment
        const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBaseUrl = isDevelopment 
          ? 'http://localhost:8000'  // Local development backend
          : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
        
        const response = await fetch(`${apiBaseUrl}/api/change-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          setSuccess('Profile and password updated successfully');
          setIsEditing(false);
          fetchUserProfile(token);
        } else {
          const data = await response.json();
          setError(data.detail || 'Failed to update profile and password');
        }
      } else {
        // For profile-only updates (no password change), we need to call a different endpoint
        // Since there might not be a separate endpoint, let's send password fields as empty strings
        // This might not work if the backend requires these fields, so we may need a backend change
        const updateData = {
          fullname: formData.fullname,
          email: formData.email,
          current_password: "",  // Empty for profile-only updates
          new_password: ""      // Empty for profile-only updates
        };
        
        // Determine the API base URL based on the environment
        const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBaseUrl = isDevelopment 
          ? 'http://localhost:8000'  // Local development backend
          : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
        
        const response = await fetch(`${apiBaseUrl}/api/change-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          setSuccess('Profile updated successfully');
          setIsEditing(false);
          fetchUserProfile(token);
        } else {
          const data = await response.json();
          setError(data.detail || 'Failed to update profile');
        }
      }
    } catch (error) {
      setError('An error occurred while updating profile');
    }
  };

  const handleEnable2FA = async () => {
    try {
      const token = localStorage.getItem('token');
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/2fa_enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setQrCode(data.qr_code_2fa);
        setSecretKey(data.secret_key_2fa);
        setShow2FAModal(true);
        setError('');
      } else {
        setError(data.detail || 'Failed to enable 2FA');
      }
    } catch (err) {
      setError('An error occurred while enabling 2FA');
    }
  };

  const handleDisable2FA = async () => {
    try {
      const token = localStorage.getItem('token');
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/2fa_disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        fetchUserProfile(token);
        setShowDisable2FAModal(false);
        setSuccess('2FA has been disabled successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.detail || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError('An error occurred while disabling 2FA');
    }
  };

  const handle2FASetup = () => {
    if (user?.status_2fa) {
      setShowDisable2FAModal(true);
    } else {
      handleEnable2FA();
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setIsVerifying(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/verify_2fa?code=${verificationCode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        fetchUserProfile(token);
        setShow2FAModal(false);
        setVerificationCode('');
        setSuccess('2FA has been enabled successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.detail || 'Failed to verify 2FA code');
      }
    } catch (err) {
      setError('An error occurred while verifying 2FA code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('token');
        // Determine the API base URL based on the environment
        const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBaseUrl = isDevelopment 
          ? 'http://localhost:8000'  // Local development backend
          : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
        
        const response = await fetch(`${apiBaseUrl}/api/delete-account`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Successfully deleted account
          // Clear local storage and redirect to home page
          localStorage.removeItem('token');
          navigate('/');
          window.location.reload(); // Reload to reset app state
        } else {
          setError(data.detail || 'Failed to delete account');
        }
      } catch (err) {
        setError('An error occurred while deleting your account');
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchLoginHistory = async () => {
    try {
      setIsFetchingHistory(true);
      setError('');
      
      const token = localStorage.getItem('token');
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/auth_logging`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Sort logs by datetime in descending order (latest first)
        const sortedLogs = data.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
        setLoginHistory(sortedLogs);
        setCurrentPage(1); // Reset to first page
        setShowLoginHistoryModal(true);
      } else {
        setError(data.detail || 'Failed to fetch login history');
      }
    } catch (err) {
      setError('An error occurred while fetching login history');
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const fetchSelectedLogging = async () => {
    try {
      setIsExporting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      // Determine the API base URL based on the environment
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isDevelopment 
        ? 'http://localhost:8000'  // Local development backend
        : 'https://expense-tracker-fast-api.vercel.app'; // Production backend
      
      const response = await fetch(`${apiBaseUrl}/api/return_selected_logging`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setExportData(data);
        setShowExportModal(true);
      } else {
        setError(data.detail || 'Failed to fetch logging data');
      }
    } catch (err) {
      setError('An error occurred while fetching logging data');
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDF = async () => {
    if (!exportData || exportData.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Account History Data', 14, 20);
      
      // Add user info with styling
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(66, 66, 66); // Gray color
      
      // Draw a styled box for user info
      doc.setDrawColor(59, 130, 246); // Blue border
      doc.setFillColor(239, 246, 255); // Light blue background
      doc.rect(12, 26, 186, 18, 'FD'); // Filled rectangle with border
      
      // Add user info text inside the box
      doc.setTextColor(25, 25, 25); // Dark color for text
      doc.text(`User: ${user?.fullname || user?.email || 'N/A'}`, 18, 34);
      doc.text(`Email: ${user?.email || 'N/A'}`, 100, 34);
      
      // Reset font and color
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 48);
      
      // Prepare data for table
      const tableColumn = ['Source', 'Email', 'Message', 'IP Address', 'Date & Time'];
      const tableRows = exportData.map(log => [
        log.source || '',
        log.email || '',
        log.message || '',
        log.ip_address || '',
        new Date(log.datetime).toLocaleString()
      ]);
      
      // Add table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 54,
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [59, 130, 246], // blue-500
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246] // gray-100
        }
      });
      
      // Open PDF in new tab for preview
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      setSuccess('PDF preview opened in new tab!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  const downloadPDF = async () => {
    if (!exportData || exportData.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Account History Data', 14, 20);
      
      // Add user info with styling
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(66, 66, 66); // Gray color
      
      // Draw a styled box for user info
      doc.setDrawColor(59, 130, 246); // Blue border
      doc.setFillColor(239, 246, 255); // Light blue background
      doc.rect(12, 26, 186, 18, 'FD'); // Filled rectangle with border
      
      // Add user info text inside the box
      doc.setTextColor(25, 25, 25); // Dark color for text
      doc.text(`User: ${user?.fullname || user?.email || 'N/A'}`, 18, 34);
      doc.text(`Email: ${user?.email || 'N/A'}`, 100, 34);
      
      // Reset font and color
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 48);
      
      // Prepare data for table
      const tableColumn = ['Source', 'Email', 'Message', 'IP Address', 'Date & Time'];
      const tableRows = exportData.map(log => [
        log.source || '',
        log.email || '',
        log.message || '',
        log.ip_address || '',
        new Date(log.datetime).toLocaleString()
      ]);
      
      // Add table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 54,
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [59, 130, 246], // blue-500
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246] // gray-100
        }
      });
      
      // Save the PDF
      doc.save('ExpenseTracker-history-data.pdf');
      setSuccess('PDF downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
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
        <div className="settings-container">
          <div className="settings-header">
            <div className="header-content">
              <button 
               className="back-button"
                onClick={() => navigate('/profile')}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M19 12H5M5 12L12 19M5 12L12 5" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="back-text">Back To Profile</span>
              </button>

              <h1>Account Settings</h1>
            </div>
            <div className="header-actions">
              {isEditing ? (
                <button 
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          
          {show2FAModal && (
            <div className="modal-overlay" onClick={() => setShow2FAModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Set Up Two-Factor Authentication</h3>
                  <button 
                    className="modal-close" 
                    onClick={() => setShow2FAModal(false)}
                  >
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <div className="qr-code-section">
                    <p>Scan this QR code with your authenticator app:</p>
                    <div className="qr-container">
                      {qrCode ? (
                        <img
                          src={`data:image/png;base64,${qrCode}`}
                          alt="QR Code"
                        />
                      ) : (
                        <div className="qr-placeholder">
                          <div className="spinner-small"></div>
                        </div>
                      )}
                    </div>
                    <p className="qr-note">
                      Can't scan the code? Use this secret key instead:
                    </p>
                    <div className="secret-key-box">
                      <div className="secret-key">{secretKey}</div>
                      <button 
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(secretKey);
                          setSuccess('Secret key copied to clipboard');
                          setTimeout(() => setSuccess(''), 2000);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <form onSubmit={handleVerify2FA} className="verification-form">
                    <div className="form-group">
                      <label htmlFor="verificationCode">Enter 6-digit code from your authenticator app:</label>
                      <input
                        type="text"
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setVerificationCode(value.slice(0, 6));
                        }}
                        maxLength="6"
                        className="verification-input"
                        placeholder="000000"
                        required
                      />
                    </div>
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => setShow2FAModal(false)}
                        disabled={isVerifying}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isVerifying || verificationCode.length !== 6}
                      >
                        {isVerifying ? (
                          <>
                            <div className="spinner-small white"></div>
                            Verifying...
                          </>
                        ) : 'Verify & Enable'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          
          {showDisable2FAModal && (
            <div className="modal-overlay" onClick={() => setShowDisable2FAModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Disable Two-Factor Authentication</h3>
                  <button 
                    className="modal-close" 
                    onClick={() => setShowDisable2FAModal(false)}
                  >
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <div className="warning-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p>Are you sure you want to disable two-factor authentication? This will reduce the security of your account.</p>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setShowDisable2FAModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDisable2FA}
                  >
                    Disable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="settings-content">
            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}
            
            <div className="modern-card">
              <div className="card-header">
                <h2>Profile Information</h2>
                <div className="card-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 21C20 19.1435 19.2625 17.363 17.9497 16.0503C16.637 14.7375 14.8565 14 13 14H11C9.14348 14 7.36301 14.7375 6.05025 16.0503C4.7375 17.363 4 19.1435 4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Personal Details
                </div>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="settings-form">
                <div className="form-grid">
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
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                      readOnly
                    />
                  </div>
                </div>
                
                {isEditing && (
                  <>
                    <div className="form-divider">
                      <span>Change Password (optional)</span>
                    </div>
                    
                    <div className="form-grid">
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
            
            <div className="modern-card">
              <div className="card-header">
                <h2>Security Settings</h2>
                <div className="card-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Account Protection
                </div>
              </div>
              
              <div className="security-settings">
                <div className="security-item">
                  <div className="security-info">
                    <div className="security-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3>Two-Factor Authentication</h3>
                      <p>Add an extra layer of security to your account</p>
                      {user?.status_2fa ? (
                        <div className="status-badge enabled">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Enabled
                        </div>
                      ) : (
                        <div className="status-badge disabled">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Disabled
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    className={`btn ${user?.status_2fa ? 'btn-outline' : 'btn-primary'}`}
                    onClick={handle2FASetup}
                  >
                    {user?.status_2fa ? 'Manage' : 'Enable 2FA'}
                  </button>
                </div>
                
                <div className="security-item">
                  <div className="security-info">
                    <div className="security-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 15V17M12 7V13M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3>Login History</h3>
                      <p>View your recent login activity</p>
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline"
                    onClick={fetchLoginHistory}
                    disabled={isFetchingHistory}
                  >
                    {isFetchingHistory ? (
                      <>
                        <div className="spinner-small"></div>
                        Loading...
                      </>
                    ) : (
                      'View History'
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="modern-card">
              <div className="card-header">
                <h2>Account Management</h2>
                <div className="card-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15V17M12 7V13M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Data & Privacy
                </div>
              </div>
              
              <div className="account-actions">
                <div className="action-item">
                  <div className="action-info">
                    <div className="action-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 16V20H20V16M12 4V16M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3>Export Data</h3>
                      <p>Download a copy of your account history data</p>
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline"
                    onClick={fetchSelectedLogging}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <div className="spinner-small"></div>
                        Exporting...
                      </>
                    ) : (
                      'Export'
                    )}
                  </button>
                </div>
                
                <div className="action-item danger">
                  <div className="action-info">
                    <div className="action-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 5L5 19M5 5L19 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3>Delete Account</h3>
                      <p>Permanently delete your account and all data</p>
                    </div>
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
      {showLoginHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowLoginHistoryModal(false)}>
          <div className="modal-content login-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Login History</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowLoginHistoryModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {loginHistory.length > 0 ? (
                <>
                  <div className="history-list">
                    {loginHistory
                      .slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage)
                      .map((log, index) => (
                        <div key={index} className="history-item">
                          <div className="history-content">
                            <div className="history-message">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="history-icon">
                                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              {log.message}
                            </div>
                            <div className="history-details">
                              <div className="history-detail-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="detail-icon">
                                  <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="history-ip">IP: {log.ip_address}</span>
                              </div>
                              <div className="history-detail-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="detail-icon">
                                  <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="history-date">
                                  {new Date(log.datetime).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {/* Pagination */}
                  {loginHistory.length > logsPerPage && (
                    <div className="pagination">
                      <button 
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      <span className="pagination-info">
                        Page {currentPage} of {Math.ceil(loginHistory.length / logsPerPage)}
                      </span>
                      <button 
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(loginHistory.length / logsPerPage)))}
                        disabled={currentPage === Math.ceil(loginHistory.length / logsPerPage)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-history">
                  <div className="no-history-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p>No login history found</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={() => setShowLoginHistoryModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showExportModal && (
        <div className="modal-overlay blurred" onClick={() => setShowExportModal(false)}>
          <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Data</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowExportModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="export-options">
                <div className="export-option">
                  <div className="export-icon">
                     <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4>Preview as PDF</h4>
                  <p>Preview your data in PDF format</p>
                  <button 
                    className="btn btn-primary"
                    onClick={generatePDF}
                  >
                    Preview PDF
                  </button>
                </div>
                <div className="export-option">
                  <div className="export-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M16 8L12 12M12 12L8 8M12 12V3" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4>Download as PDF</h4>
                  <p>Save your data as a PDF file</p>
                  <button 
                    className="btn btn-primary"
                    onClick={downloadPDF}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowExportModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;