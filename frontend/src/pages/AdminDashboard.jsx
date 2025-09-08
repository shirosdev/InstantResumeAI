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
];

// This is the main layout component that fetches and holds the stats
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboardStats();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-section">
          <ul className="sidebar-links">
            {adminNavLinks.map((link) => (
              <li key={link.path}> {/* FIX: Use the unique path as the key */}
                <NavLink to={link.path} end={link.end}>
                  <span>{link.title}</span>
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
                <Route path="billing" element={<AdminPlaceholder title="Subscription & Billing" />} />
                <Route path="usage-tracking" element={<UsageTracking />} />
                {/* FIX: Removed the duplicate route for "monitoring" */}
                <Route path="monitoring" element={<SystemMonitoring />} />
                <Route path="support" element={<AdminPlaceholder title="Support" />} />
                <Route path="actions" element={<AdminPlaceholder title="Admin Actions" />} />
            </Route>
        </Routes>
    )
}

export default AdminRoutes;