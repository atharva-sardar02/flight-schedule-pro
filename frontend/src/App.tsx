import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const BookingList = lazy(() => import('./components/booking/BookingList'));
const CreateBooking = lazy(() => import('./components/booking/CreateBooking'));
const BookingDetails = lazy(() => import('./components/booking/BookingDetails'));
const ReschedulePage = lazy(() => import('./components/rescheduling/ReschedulePage'));
const AvailabilityCalendar = lazy(() => import('./components/calendar/AvailabilityCalendar').then(module => ({ default: module.AvailabilityCalendar })));
const Settings = lazy(() => import('./components/settings/Settings').then(module => ({ default: module.Settings })));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

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
                      <Suspense fallback={<LoadingSpinner />}>
                        <Dashboard />
                      </Suspense>
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
                          <Suspense fallback={<LoadingSpinner />}>
                            <BookingList />
                          </Suspense>
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
                          <Suspense fallback={<LoadingSpinner />}>
                            <CreateBooking />
                          </Suspense>
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
                          <Suspense fallback={<LoadingSpinner />}>
                            <BookingDetails />
                          </Suspense>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookings/:bookingId/reschedule"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="p-6">
                        <div className="max-w-4xl mx-auto">
                          <Suspense fallback={<LoadingSpinner />}>
                            <ReschedulePage />
                          </Suspense>
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
                          <Suspense fallback={<LoadingSpinner />}>
                            <AvailabilityCalendar />
                          </Suspense>
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
                      <Suspense fallback={<LoadingSpinner />}>
                        <Settings />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Home page - redirect to login (will redirect to dashboard if authenticated via ProtectedRoute) */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Catch-all route - redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

