import React, { useState } from 'react';
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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
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
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                  <Dashboard />
                </main>
              </div>
            } />
            <Route path="/add-expense" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                  <AddExpense />
                </main>
              </div>
            } />
            <Route path="/expenses-list" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                  <ExpensesList />
                </main>
              </div>
            } />
            <Route path="/reports" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                  <Reports />
                </main>
              </div>
            } />
            <Route path="/profile" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                  <Profile />
                </main>
              </div>
            } />
            <Route path="/account-settings" element={
              <div className="app-layout">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
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