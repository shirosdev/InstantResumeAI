// src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import adminService from '../services/adminService';
import '../styles/AdminDashboard.css';
import SystemMonitoring from './admin/SystemMonitoring';

// Import all child components
import UserManagement from './admin/UserManagement';
import AdminOverview from './admin/AdminOverview';
import UsageTracking from './admin/UsageTracking';
import SecurityCompliance from './admin/SecurityCompliance';
import Support from './admin/Support';
import AdminActions from './admin/AdminActions';
import SubscriptionBilling from './admin/SubscriptionBilling';
import VisitorAnalytics from './admin/VisitorAnalytics';

const adminNavLinks = [
  { title: 'Overview', path: '/admin', end: true },
  { title: 'User Management', path: '/admin/user-management' },
  { title: 'Security & Compliance', path: '/admin/security' },
  { title: 'Resume Usage Tracking', path: '/admin/usage-tracking' },
  { title: 'Subscription & Billing', path: '/admin/billing' },
  { title: 'System Monitoring', path: '/admin/monitoring' },
  { title: 'Support', path: '/admin/support' },
  { title: 'Admin Actions', path: '/admin/actions' },
  { title: 'Visitor Analytics', path: '/admin/analytics' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  
  // State for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar automatically when route changes (mobile UX)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Fetch Data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [statsRes, countRes] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getUnresolvedTicketCount()
        ]);
        
        setStats(statsRes.data);
        setUnresolvedCount(countRes.data.unresolved_count); 

      } catch (err) {
        console.error("Failed to load admin data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  return (
    <div className="admin-layout">
      {/* FIXED: Updated class name to 'admin-mobile-toggle' to match CSS.
        This ensures it is hidden on desktop (display: none) and visible on mobile.
      */}
      <button 
        className="admin-mobile-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle Admin Menu"
      >
        {/* Hamburger Icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isSidebarOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </>
          )}
        </svg>
      </button>

      {/* FIXED: Updated class name to 'admin-sidebar-overlay' to match CSS.
      */}
      <div 
        className={`admin-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-section">
          {/* Mobile Header (Optional, visible only on mobile via CSS) */}
          <div className="sidebar-header-mobile">
             <h3>Admin Panel</h3>
          </div>
          
          <ul className="sidebar-links">
            {adminNavLinks.map((link) => (
              <li key={link.path}>
                <NavLink to={link.path} end={link.end}>
                  <span>{link.title}</span>
                  {link.title === 'Support' && unresolvedCount > 0 && (
                    <span className="notification-badge">{unresolvedCount}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet context={{ stats, loading }} />
      </main>
    </div>
  );
};

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AdminDashboard />}>
                <Route index element={<AdminOverview />} />
                <Route path="user-management" element={<UserManagement />} />
                <Route path="security" element={<SecurityCompliance />} />
                <Route path="billing" element={<SubscriptionBilling />} />
                <Route path="usage-tracking" element={<UsageTracking />} />
                <Route path="monitoring" element={<SystemMonitoring />} />
                <Route path="support" element={<Support />} />
                <Route path="actions" element={<AdminActions />} />
                <Route path="analytics" element={<VisitorAnalytics />} />
            </Route>
        </Routes>
    )
}

export default AdminRoutes;