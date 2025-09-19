import React from 'react';
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
import { AuthProvider } from './components/auth/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/expenses-list" element={<ExpensesList />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/reactivate-account" element={<AccountReactivation />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;