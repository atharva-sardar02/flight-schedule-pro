import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Dashboard } from './components/dashboard/Dashboard';
import BookingList from './components/booking/BookingList';
import CreateBooking from './components/booking/CreateBooking';
import BookingDetails from './components/booking/BookingDetails';
import { AvailabilityCalendar } from './components/calendar/AvailabilityCalendar';
import { Settings } from './components/settings/Settings';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes with Layout */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="p-6">
                        <div className="max-w-7xl mx-auto">
                          <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
                          <BookingList />
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookings/new"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="p-6">
                        <div className="max-w-4xl mx-auto">
                          <h1 className="text-2xl font-bold mb-6">Schedule New Flight</h1>
                          <CreateBooking />
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookings/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="p-6">
                        <div className="max-w-4xl mx-auto">
                          <BookingDetails />
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/availability"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="p-6">
                        <div className="max-w-7xl mx-auto">
                          <h1 className="text-2xl font-bold mb-6">Manage Availability</h1>
                          <AvailabilityCalendar />
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Home page - redirect to dashboard if authenticated, otherwise to login */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

