import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import BudgetModal from './BudgetModal';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, toggleSidebar, isMobile = false }) => {
  const [theme, setTheme] = useState('light');
  const { user, logout } = useAuth();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isBudgetMenuOpen, setIsBudgetMenuOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetModalInitialTab, setBudgetModalInitialTab] = useState('add');
  const location = useLocation();
  const budgetDropdownRef = useRef(null);
  const settingsDropdownRef = useRef(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
        setIsSettingsMenuOpen(false);
      }
      if (budgetDropdownRef.current && !budgetDropdownRef.current.contains(event.target)) {
        setIsBudgetMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleAddBudget = () => {
    setBudgetModalInitialTab('add');
    setIsBudgetModalOpen(true);
    setIsBudgetMenuOpen(false);
  };

  const handleViewBudgets = () => {
    setBudgetModalInitialTab('view');
    setIsBudgetModalOpen(true);
    setIsBudgetMenuOpen(false);
  };

  const toggleBudgetMenu = () => {
    setIsBudgetMenuOpen(!isBudgetMenuOpen);
    // Close settings menu if open
    if (isSettingsMenuOpen) {
      setIsSettingsMenuOpen(false);
    }
  };

  const toggleSettingsMenu = () => {
    setIsSettingsMenuOpen(!isSettingsMenuOpen);
    // Close budget menu if open
    if (isBudgetMenuOpen) {
      setIsBudgetMenuOpen(false);
    }
  };

  // Check if current route is active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {isCollapsed ? '☰' : '«'}
          </button>
          <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <h1>{isCollapsed ? '' : 'ExpenseTracker'}</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          {user && (
            <>
              <Link 
                to="/dashboard" 
                className={`nav-link ${isActiveRoute('/dashboard') ? 'active' : ''}`}
                onClick={() => isMobile && toggleSidebar()} // Close sidebar on mobile after click
              >
                <span className="nav-icon">📊</span>
                {!isCollapsed && <span className="nav-text">Dashboard</span>}
              </Link>
              <Link 
                to="/add-expense" 
                className={`nav-link ${isActiveRoute('/add-expense') ? 'active' : ''}`}
                onClick={() => isMobile && toggleSidebar()} // Close sidebar on mobile after click
              >
                <span className="nav-icon">➕</span>
                {!isCollapsed && <span className="nav-text">Add Expense</span>}
              </Link>
              <Link 
                to="/expenses-list" 
                className={`nav-link ${isActiveRoute('/expenses-list') ? 'active' : ''}`}
                onClick={() => isMobile && toggleSidebar()} // Close sidebar on mobile after click
              >
                <span className="nav-icon">📋</span>
                {!isCollapsed && <span className="nav-text">Expenses List</span>}
              </Link>
              <Link 
                to="/reports" 
                className={`nav-link ${isActiveRoute('/reports') ? 'active' : ''}`}
                onClick={() => isMobile && toggleSidebar()} // Close sidebar on mobile after click
              >
                <span className="nav-icon">📈</span>
                {!isCollapsed && <span className="nav-text">Reports</span>}
              </Link>
              
              {/* Budget Dropdown Menu */}
              <div className="budget-menu-container" ref={budgetDropdownRef}>
                <div 
                  className={`nav-link budget-trigger ${isBudgetMenuOpen ? 'active' : ''}`}
                  onClick={toggleBudgetMenu}
                >
                  <span className="nav-icon">💰</span>
                  {!isCollapsed && (
                    <>
                      <span className="nav-text">Budget</span>
                      <span className={`dropdown-arrow ${isBudgetMenuOpen ? 'open' : ''}`}>
                        ▼
                      </span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <div className="settings-menu-container" ref={settingsDropdownRef}>
              <div 
                className={`settings-trigger ${isSettingsMenuOpen ? 'active' : ''}`}
                onClick={toggleSettingsMenu}
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

      {/* Budget Dropdown rendered outside sidebar */}
      {isBudgetMenuOpen && user && (
        <div className="budget-dropdown" ref={budgetDropdownRef}>
          <div className="dropdown-item" onClick={() => {
            handleAddBudget();
            isMobile && toggleSidebar(); // Close sidebar on mobile after click
          }}>
            <span className="item-icon">➕</span>
            <span className="item-text">Set Budget</span>
          </div>
          <div className="dropdown-item" onClick={() => {
            handleViewBudgets();
            isMobile && toggleSidebar(); // Close sidebar on mobile after click
          }}>
            <span className="item-icon">📋</span>
            <span className="item-text">View Budgets</span>
          </div>
        </div>
      )}

      {/* Settings Dropdown rendered outside sidebar */}
      {isSettingsMenuOpen && user && (
        <div className="settings-dropdown" ref={settingsDropdownRef}>
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
            <div className="dropdown-item" onClick={() => {
              handleProfile();
              isMobile && toggleSidebar(); // Close sidebar on mobile after click
            }}>
              <span className="item-icon">👤</span>
              <span className="item-text">Profile</span>
            </div>
            <div className="dropdown-item" onClick={() => {
              handleAccountSettings();
              isMobile && toggleSidebar(); // Close sidebar on mobile after click
            }}>
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

          <div className="dropdown-item logout-item" onClick={() => {
            handleLogoutClick();
            isMobile && toggleSidebar(); // Close sidebar on mobile after click
          }}>
            <span className="item-icon">🚪</span>
            <span className="item-text">Logout</span>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal 
        isOpen={isBudgetModalOpen} 
        onClose={() => setIsBudgetModalOpen(false)} 
        initialTab={budgetModalInitialTab}
      />
    </>
  );
};

export default Sidebar;