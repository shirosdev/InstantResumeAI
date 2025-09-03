// frontend/src/pages/AdminDashboard.jsx

import React from 'react';
import { NavLink, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';
import UserManagement from './admin/UserManagement';
import AdminOverview from './admin/AdminOverview';
import UsageTracking from './admin/UsageTracking';

// A placeholder for other sections
const AdminPlaceholder = ({ title }) => (
  <div>
    <div className="dashboard-header" style={{textAlign: 'left', maxWidth: 'none', marginLeft: 0}}>
        <h1>{title}</h1>
    </div>
    <p>Content for the {title.toLowerCase()} section will be implemented here.</p>
  </div>
);

const adminNavLinks = [
    // NEW: Added "Overview" as a visible link
    { title: 'Overview', path: '/admin', end: true },
    { title: 'User Management', path: '/admin/user-management' },
    { title: 'Subscription & Billing', path: '/admin/billing' },
    { title: 'Resume Usage Tracking', path: '/admin/usage-tracking' },
    { title: 'Security & Compliance', path: '/admin/security' },
    { title: 'System Monitoring', path: '/admin/monitoring' },
    { title: 'Support', path: '/admin/support' },
    { title: 'Admin Actions', path: '/admin/actions' },
];

const AdminDashboard = () => {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-section">
          <ul className="sidebar-links">
            {adminNavLinks.map((link) => (
              <li key={link.title}>
                <NavLink to={link.path} end={link.end}>
                  <span>{link.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AdminDashboard />}>
                {/* Default route remains the AdminOverview */}
                <Route index element={<AdminOverview />} />

                {/* Other admin routes */}
                <Route path="user-management" element={<UserManagement />} />
                <Route path="billing" element={<AdminPlaceholder title="Subscription & Billing" />} />
                <Route path="usage-tracking" element={<UsageTracking />} />
                <Route path="security" element={<AdminPlaceholder title="Security & Compliance" />} />
                <Route path="monitoring" element={<AdminPlaceholder title="System Monitoring" />} />
                <Route path="support" element={<AdminPlaceholder title="Support" />} />
                <Route path="actions" element={<AdminPlaceholder title="Admin Actions" />} />
            </Route>
        </Routes>
    )
}

export default AdminRoutes;