import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import AddExpense from './components/AddExpense';
import ExpensesList from './components/ExpensesList';
import Reports from './components/Reports';
import Profile from './components/auth/Profile';
import AccountSettings from './components/auth/AccountSettings';
import AccountReactivation from './components/auth/AccountReactivation';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './components/auth/AuthContext';

// Layout component for protected routes that includes sidebar and mobile header
function ProtectedLayout({ children, isSidebarCollapsed, isMobile, isMobileSidebarOpen, toggleSidebar, pageTitle }) {
  return (
    <div className="app-layout">
      <Sidebar 
        isCollapsed={isMobile ? !isMobileSidebarOpen : isSidebarCollapsed} 
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
      />
      <main className={`main-content ${isMobileSidebarOpen && isMobile ? 'sidebar-open' : ''} ${isSidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
        {isMobile && (
          <div className="mobile-header">
            <button className="mobile-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
              ☰
            </button>
            <div className="mobile-header-title">{pageTitle}</div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

// Separate component for the protected routes that needs access to auth context
function AppContent() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();

  // Check if user is on mobile and set initial state accordingly
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const prevIsMobile = isMobile;
      setIsMobile(mobile);
      
      // Handle transition between mobile and desktop views
      if (prevIsMobile !== mobile) {
        if (mobile) {
          // Switching to mobile: close the mobile sidebar by default
          setIsMobileSidebarOpen(false);
        } else {
          // Switching to desktop: reset desktop sidebar state
          setIsSidebarCollapsed(false); // Expanded by default on desktop
        }
      } else {
        // Same device type: just update the isMobile state
        if (!mobile) {
          setIsSidebarCollapsed(false); // Expanded on desktop by default
        }
      }
    };

    // Set initial state based on current window size
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup event listener
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Add useEffect to handle sidebar initialization after authentication
  useEffect(() => {
    if (!loading && user) {
      // When user logs in, ensure sidebar is visible (not collapsed on desktop)
      // On mobile, the sidebar will be hidden by default and accessed via toggle
      setIsSidebarCollapsed(false);
    }
  }, [user, loading, location.pathname]); // Added location.pathname to re-evaluate when route changes

  const toggleSidebar = () => {
    if (isMobile) {
      // On mobile, toggle the mobile sidebar state
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      // On desktop, toggle the collapsed state
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  // Don't render anything until auth loading is complete
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Define routes that don't need the sidebar
  const noSidebarRoutes = ['/', '/login', '/register', '/reactivate-account'];

  // Check if current route is a protected route that needs sidebar
  const isProtectedRoute = user && !noSidebarRoutes.includes(location.pathname);

  // Get page title based on current route
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/add-expense':
        return 'Add Expense';
      case '/expenses-list':
        return 'Expenses List';
      case '/reports':
        return 'Reports';
      case '/profile':
        return 'Profile';
      case '/account-settings':
        return 'Account Settings';
      default:
        return 'Expense Tracker';
    }
  };

  return (
    <div className="App">
      <Routes>
        {/* Routes without sidebar */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reactivate-account" element={<AccountReactivation />} />
        
        {/* Protected routes with sidebar */}
        {isProtectedRoute && (
          <>
            <Route path="/dashboard" element={
              <ProtectedLayout 
                isSidebarCollapsed={isSidebarCollapsed}
                isMobile={isMobile}
                isMobileSidebarOpen={isMobileSidebarOpen}
                toggleSidebar={toggleSidebar}
                pageTitle="Dashboard"
              >
                <Dashboard />
              </ProtectedLayout>
            } />
            <Route path="/add-expense" element={
              <ProtectedLayout 
                isSidebarCollapsed={isSidebarCollapsed}
                isMobile={isMobile}
                isMobileSidebarOpen={isMobileSidebarOpen}
                toggleSidebar={toggleSidebar}
                pageTitle="Add Expense"
              >
                <AddExpense />
              </ProtectedLayout>
            } />
            <Route path="/expenses-list" element={
              <ProtectedLayout 
                isSidebarCollapsed={isSidebarCollapsed}
                isMobile={isMobile}
                isMobileSidebarOpen={isMobileSidebarOpen}
                toggleSidebar={toggleSidebar}
                pageTitle="Expenses List"
              >
                <ExpensesList />
              </ProtectedLayout>
            } />
            <Route path="/reports" element={
              <ProtectedLayout 
                isSidebarCollapsed={isSidebarCollapsed}
                isMobile={isMobile}
                isMobileSidebarOpen={isMobileSidebarOpen}
                toggleSidebar={toggleSidebar}
                pageTitle="Reports"
              >
                <Reports />
              </ProtectedLayout>
            } />
            <Route path="/profile" element={
              <ProtectedLayout 
                isSidebarCollapsed={isSidebarCollapsed}
                isMobile={isMobile}
                isMobileSidebarOpen={isMobileSidebarOpen}
                toggleSidebar={toggleSidebar}
                pageTitle="Profile"
              >
                <Profile />
              </ProtectedLayout>
            } />
            <Route path="/account-settings" element={
              <ProtectedLayout 
                isSidebarCollapsed={isSidebarCollapsed}
                isMobile={isMobile}
                isMobileSidebarOpen={isMobileSidebarOpen}
                toggleSidebar={toggleSidebar}
                pageTitle="Account Settings"
              >
                <AccountSettings />
              </ProtectedLayout>
            } />
          </>
        )}
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;