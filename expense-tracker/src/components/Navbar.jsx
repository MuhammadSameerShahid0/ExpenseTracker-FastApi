import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [theme, setTheme] = useState('light');
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = sessionStorage.getItem('theme') || localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }

    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    sessionStorage.setItem('theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (user) {
      navigate('/dashboard');
      closeMobileMenu(); // Close mobile menu when logo is clicked
    } else {
      navigate('/');
      closeMobileMenu(); // Close mobile menu when logo is clicked
    }
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsUserMenuOpen(false);
    closeMobileMenu(); // Close mobile menu when navigating
  };

  const handleAccountSettings = () => {
    navigate('/account-settings');
    setIsUserMenuOpen(false);
    closeMobileMenu(); // Close mobile menu when navigating
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
    closeMobileMenu(); // Close mobile menu when logging out
  };

  const handleMobileLinkClick = () => {
    closeMobileMenu();
  };

  return (
    <header className="header">
      <div className="container">
        {/* Left Section - Logo + Hamburger */}
        <div className="nav-left">
          <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <h1>ExpenseTracker</h1>
          </div>

          {/* Hamburger menu for mobile */}
          <button 
            className="mobile-menu-button" 
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <span className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}></span>
          </button>

          {user && (
            <nav className="nav-links">
              &nbsp;
              &nbsp;
              <Link to="/add-expense" className="btn btn-outline">Add Expense</Link>
              <Link to="/expenses-list" className="btn btn-outline">Expenses List</Link>
              <Link to="/reports" className="btn btn-outline">Reports</Link>
            </nav>
          )}
        </div>

        {/* Right Section - User Info + Theme + Logout */}
        <div className="nav-right">
          {user ? (
            <div className="user-menu-container">
              <span className="welcome-msg">Welcome, {user.username}</span>
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              
              <div className="user-logo" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} title={user.username} style={{ cursor: 'pointer' }}>
                {/* Avatar or initials */}
                <span role="img" aria-label="User">👤</span>
              </div>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-item" onClick={handleProfile}>
                    Profile
                  </div>
                  <div className="dropdown-item" onClick={handleAccountSettings}>
                    Account Settings
                  </div>
                  <div className="dropdown-item" onClick={handleLogoutClick}>
                    Logout
                  </div>
                </div>
              )}
            </div>
          ) : (
            <nav className="nav">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-outline mobile-menu-item" onClick={handleMobileLinkClick}>Dashboard</Link>
              <Link to="/add-expense" className="btn btn-outline mobile-menu-item" onClick={handleMobileLinkClick}>Add Expense</Link>
              <Link to="/expenses-list" className="btn btn-outline mobile-menu-item" onClick={handleMobileLinkClick}>Expenses List</Link>
              <Link to="/reports" className="btn btn-outline mobile-menu-item" onClick={handleMobileLinkClick}>Reports</Link>
              <Link to="/profile" className="btn btn-outline mobile-menu-item" onClick={handleMobileLinkClick}>Profile</Link>
              <Link to="/account-settings" className="btn btn-outline mobile-menu-item" onClick={handleMobileLinkClick}>Account Settings</Link>
              <button 
                className="btn btn-outline mobile-menu-item" 
                onClick={handleLogoutClick}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline mobile-menu-item" onClick={handleMobileLinkClick}>Login</Link>
              <Link to="/register" className="btn btn-primary mobile-menu-item" onClick={handleMobileLinkClick}>Register</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
