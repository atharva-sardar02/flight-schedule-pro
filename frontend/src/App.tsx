import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <header className="bg-blue-600 text-white p-4 shadow-lg">
                      <div className="container mx-auto">
                        <h1 className="text-2xl font-bold">Flight Schedule Pro</h1>
                        <p className="text-sm">Weather Monitoring & AI-Powered Rescheduling</p>
                      </div>
                    </header>
                    <main className="container mx-auto p-4">
                      <div className="text-center py-12">
                        <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
                        <p className="text-gray-600">Welcome to your flight scheduling dashboard.</p>
                      </div>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Home page - redirect to dashboard if authenticated, otherwise to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

