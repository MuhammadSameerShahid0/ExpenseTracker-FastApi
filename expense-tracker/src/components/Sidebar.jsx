import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const [theme, setTheme] = useState('light');
  const { user, logout } = useAuth();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const location = useLocation();

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

  const handleProfile = () => {
    navigate('/profile');
    setIsSettingsMenuOpen(false);
  };

  const handleAccountSettings = () => {
    navigate('/account-settings');
    setIsSettingsMenuOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
    setIsSettingsMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.settings-menu-container')) {
        setIsSettingsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Check if current route is active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <h1>{isCollapsed ? 'ET' : 'ExpenseTracker'}</h1>
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {user && (
          <>
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActiveRoute('/dashboard') ? 'active' : ''}`}
            >
              <span className="nav-icon">📊</span>
              {!isCollapsed && <span className="nav-text">Dashboard</span>}
            </Link>
            <Link 
              to="/add-expense" 
              className={`nav-link ${isActiveRoute('/add-expense') ? 'active' : ''}`}
            >
              <span className="nav-icon">➕</span>
              {!isCollapsed && <span className="nav-text">Add Expense</span>}
            </Link>
            <Link 
              to="/expenses-list" 
              className={`nav-link ${isActiveRoute('/expenses-list') ? 'active' : ''}`}
            >
              <span className="nav-icon">📋</span>
              {!isCollapsed && <span className="nav-text">Expenses List</span>}
            </Link>
            <Link 
              to="/reports" 
              className={`nav-link ${isActiveRoute('/reports') ? 'active' : ''}`}
            >
              <span className="nav-icon">📈</span>
              {!isCollapsed && <span className="nav-text">Reports</span>}
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="settings-menu-container">
            <div 
              className="settings-trigger"
              onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            >
              <div className="settings-icon">
                <span>⚙️</span>
              </div>
              {!isCollapsed && (
                <div className="settings-info">
                  <div className="user-greeting">Hello, {user.username}</div>
                  <div className="settings-text">Settings & Theme</div>
                </div>
              )}
              {!isCollapsed && (
                <div className={`dropdown-arrow ${isSettingsMenuOpen ? 'open' : ''}`}>
                  ▼
                </div>
              )}
            </div>

            {isSettingsMenuOpen && (
              <div className="settings-dropdown">
                <div className="dropdown-header">
                  <div className="user-avatar">
                    <span>{user.username?.charAt(0)?.toUpperCase() || 'U'}</span>
                  </div>
                  <div className="user-info">
                    <div className="username">{user.username}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>

                <div className="dropdown-section">
                  <div className="section-title">Account</div>
                  <div className="dropdown-item" onClick={handleProfile}>
                    <span className="item-icon">👤</span>
                    <span className="item-text">Profile</span>
                  </div>
                  <div className="dropdown-item" onClick={handleAccountSettings}>
                    <span className="item-icon">🔧</span>
                    <span className="item-text">Account Settings</span>
                  </div>
                </div>

                <div className="dropdown-section">
                  <div className="section-title">Preferences</div>
                  <div className="theme-toggle-item">
                    <span className="item-icon">
                      {theme === 'light' ? '🌙' : '☀️'}
                    </span>
                    <span className="item-text">Theme</span>
                    <div className="theme-switch">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={theme === 'dark'}
                          onChange={toggleTheme}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="theme-status">
                        {theme === 'light' ? 'Light' : 'Dark'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-item logout-item" onClick={handleLogoutClick}>
                  <span className="item-icon">🚪</span>
                  <span className="item-text">Logout</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="btn btn-outline">
              {!isCollapsed ? 'Login' : 'L'}
            </Link>
            <Link to="/register" className="btn btn-primary">
              {!isCollapsed ? 'Register' : 'R'}
            </Link>
            {!isCollapsed && (
              <button className="theme-toggle-simple" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;