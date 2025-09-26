import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { AuthProvider } from './components/auth/AuthContext';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const toggleSidebar = () => {
    if (isMobile) {
      // On mobile, toggle the mobile sidebar state
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      // On desktop, toggle the collapsed state
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Home page doesn't use sidebar */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reactivate-account" element={<AccountReactivation />} />
            
            {/* Protected routes with sidebar */}
            <Route path="/dashboard" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isMobile ? !isMobileSidebarOpen : isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isMobileSidebarOpen && isMobile ? 'sidebar-open' : ''} ${isSidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
                  <Dashboard />
                </main>
              </div>
            } />
            <Route path="/add-expense" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isMobile ? !isMobileSidebarOpen : isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isMobileSidebarOpen && isMobile ? 'sidebar-open' : ''} ${isSidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
                  <AddExpense />
                </main>
              </div>
            } />
            <Route path="/expenses-list" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isMobile ? !isMobileSidebarOpen : isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isMobileSidebarOpen && isMobile ? 'sidebar-open' : ''} ${isSidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
                  <ExpensesList />
                </main>
              </div>
            } />
            <Route path="/reports" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isMobile ? !isMobileSidebarOpen : isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isMobileSidebarOpen && isMobile ? 'sidebar-open' : ''} ${isSidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
                  <Reports />
                </main>
              </div>
            } />
            <Route path="/profile" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isMobile ? !isMobileSidebarOpen : isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isMobileSidebarOpen && isMobile ? 'sidebar-open' : ''} ${isSidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
                  <Profile />
                </main>
              </div>
            } />
            <Route path="/account-settings" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isMobile ? !isMobileSidebarOpen : isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isMobileSidebarOpen && isMobile ? 'sidebar-open' : ''} ${isSidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
                  <AccountSettings />
                </main>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;