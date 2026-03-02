/**
 * Main App Component with React Router
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, StockProvider } from './states/store';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Risk } from './pages/Risk';
import { StockDetail } from './pages/StockDetail';

// Styles
import './App.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StockProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/risk"
              element={
                <ProtectedRoute>
                  <Risk />
                </ProtectedRoute>
              }
            />

            <Route
              path="/stocks/:id"
              element={
                <ProtectedRoute>
                  <StockDetail />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </StockProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
