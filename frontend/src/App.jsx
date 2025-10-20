// frontend/src/App.jsx

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminRoutes from './pages/AdminDashboard';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import TopUpPage from './pages/TopUp';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import Contact from './pages/Contact';
import Investors from './pages/Investors';
import Blog from './pages/Blog';
import Usage from './pages/Usage';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyResetToken from './pages/VerifyResetToken';
import ChangePassword from './pages/ChangePassword';
import History from './pages/History';
import CheckoutPage from './pages/Checkout'; // <-- Import new page
import PaymentStatusPage from './pages/PaymentStatus'; // <-- Import new page

// Styles
import './App.css';
import './styles/Pages.css';
import './styles/Pricing.css';
import './styles/Production.css';
import './styles/Profile.css';
import './styles/Contact.css';
import './styles/History.css';
import './styles/AdminDashboard.css';
import './styles/AdminOverview.css';
import './styles/Modal.css';
import './styles/SupportThread.css';

const AppContent = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="App">
      <Navbar />
      <main id="main-content" className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/investors" element={<Investors />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/Usage" element={<Usage />} />

          {/* Password Reset Routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-token" element={<VerifyResetToken />} />
          <Route path="/reset-password/:token?" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

          {/* --- NEW STRIPE ROUTES --- */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } />
          <Route path="/payment-status" element={
            <ProtectedRoute>
              <PaymentStatusPage />
            </ProtectedRoute>
          } />
          {/* --- END NEW STRIPE ROUTES --- */}
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <AdminProtectedRoute>
              <AdminRoutes />
            </AdminProtectedRoute>
          } />

          {/* Top Up Routes */}
          <Route path="/top-up" element={
            <ProtectedRoute>
              <TopUpPage />
            </ProtectedRoute>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />

      {user && (
        <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
          <div className="network-indicator"></div>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;