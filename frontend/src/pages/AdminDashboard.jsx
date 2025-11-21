// src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, Outlet } from 'react-router-dom';
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

const AdminPlaceholder = ({ title }) => (
  <div>
    <div className="dashboard-header" style={{textAlign: 'left', maxWidth: 'none', marginLeft: 0}}>
        <h1>{title}</h1>
    </div>
    <p>Content for the {title.toLowerCase()} section will be implemented here.</p>
  </div>
);

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

// This is the main layout component that fetches and holds the stats
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- RECTIFIED useEffect ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch user stats and ticket count at the same time
        const [statsRes, countRes] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getUnresolvedTicketCount() // <-- Call the new function
        ]);
        
        setStats(statsRes.data);
        setUnresolvedCount(countRes.data.unresolved_count); // <-- Set the count

      } catch (err) {
        console.error("Failed to load admin data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []); // Empty array, runs once on mount
  // --- END RECTIFICATION ---

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking overlay
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="admin-layout">
      {/* Mobile Menu Toggle Button */}
      <button 
        className="mobile-menu-toggle" 
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {isMobileMenuOpen ? (
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

      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      ></div>

      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-section">
          <ul className="sidebar-links">
            {adminNavLinks.map((link) => (
              <li key={link.path}>
                <NavLink 
                  to={link.path} 
                  end={link.end}
                  onClick={closeMobileMenu}
                >
                  <span>{link.title}</span>
                  {/* --- FIX: Check title, not key --- */}
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
        {/* Pass stats and loading state to the child routes via Outlet context */}
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
            </Route>
        </Routes>
    )
}

export default AdminRoutes;