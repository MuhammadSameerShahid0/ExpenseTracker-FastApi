import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

  const handleLogoClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleUserMenu = () => {
  setIsUserMenuOpen(!isUserMenuOpen);
};

const handleAccountSettings = () => {
  navigate('/account-settings'); // or your account settings page
  setIsUserMenuOpen(false);
};

const handleLogoutClick = () => {
  logout();
  navigate('/');
  setIsUserMenuOpen(false);
};


  return (
    <header className="header">
      <div className="container">
        {/* Left Section - Logo + Links */}
        <div className="nav-left">
          <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <h1>ExpenseTracker</h1>
          </div>

          {user && (
            <nav className="nav-links">
              &nbsp;
              &nbsp;
              <Link to="/expenses-list" className="btn btn-outline">Expenses List</Link>
              <Link to="/add-expense" className="btn btn-outline">Add Expense</Link>
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
              
              <div className="user-logo" onClick={toggleUserMenu} title={user.username} style={{ cursor: 'pointer' }}>
                {/* Avatar or initials */}
                <span role="img" aria-label="User">👤</span>
              </div>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-item" onClick={() => alert('Another option')}>
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
    </header>
  );
};

export default Navbar;
