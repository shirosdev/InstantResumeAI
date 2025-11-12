// src/pages/admin/SecurityCompliance.jsx

import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import '../../styles/AdminDashboard.css'; // Reusing some styles

// --- HELPER FUNCTION TO FIX DATES ---
const formatDate = (dateString) => {
  if (!dateString) {
    return 'N/A';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    // Using a clear, consistent format
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return 'Invalid Date';
  }
};
// --- END HELPER FUNCTION ---

const SecurityCompliance = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async (page = 1, query = '') => {
    try {
      setLoading(true);
      const res = await adminService.getUsers(page, 10, query);
      setUsers(res.data.users);
      setPagination({
        currentPage: res.data.current_page,
        totalPages: res.data.total_pages,
      });
    } catch (err) {
      setError('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1, searchQuery);
  }, [fetchData, searchQuery]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handlePageChange = (page) => fetchData(page, searchQuery);
  const handleViewDetails = (user) => setSelectedUser(user);
  const handleCloseModal = () => setSelectedUser(null);
  const handleUserUpdate = () => fetchData(pagination.currentPage, searchQuery);

  if (loading && users.length === 0) {
    return <LoadingSpinner message="Loading Security Data..." />;
  }

  return (
    <div>
      <div className="dashboard-header" style={{ textAlign: 'left', maxWidth: 'none', marginLeft: 0 }}>
        <h1>Security & Compliance</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}

      <div className="admin-table-container">
        <div className="table-header">
          <h3>User Security Overview</h3>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search by username or email..." 
              value={searchQuery} 
              onChange={handleSearchChange} 
            />
          </div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.user_id}>
                <td>
                  <div>{user.username}</div>
                  <div className="text-muted">{user.email}</div>
                </td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                {/* --- APPLYING DATE FIX HERE --- */}
                <td>{formatDate(user.last_login)}</td>
                <td>
                  <button className="action-button" onClick={() => handleViewDetails(user)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination {...pagination} onPageChange={handlePageChange} />
      </div>

      {selectedUser && (
        <SecurityDetailsModal 
          user={selectedUser} 
          onClose={handleCloseModal}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
};

// Modal component for displaying security details
const SecurityDetailsModal = ({ user, onClose, onUpdate }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await adminService.getUserSecurityActivity(user.user_id);
        setDetails(res.data);
      } catch (err) {
        setError('Failed to load activity details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [user.user_id]);

  const handleStatusChange = async (isActive) => {
    try {
      await adminService.updateUserStatus(user.user_id, isActive);
      onUpdate();
      onClose();
    } catch (err) {
      setError('Failed to update user status.');
    }
  };

  // Helper function to safely truncate text
  const truncate = (text, length = 40) => {
    if (text && typeof text === 'string') {
      return text.length > length ? text.substring(0, length) + '...' : text;
    }
    return 'N/A';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>Security Details for {user.username}</h3>

        <div className="modal-actions">
          {user.is_active ? (
            <button className="action-button danger" onClick={() => handleStatusChange(false)}>Suspend Account</button>
          ) : (
            <button className="action-button success" onClick={() => handleStatusChange(true)}>Re-activate Account</button>
          )}
        </div>

        {loading && <LoadingSpinner message="Loading Details..." />}
        {error && <div className="error-message">{error}</div>}

        {details && (
          <div className="security-details-grid">
            <div className="detail-section">
              <h4>Recent Login Activity</h4>
              <div className="table-wrapper">
                <table className="mini-table">
                  <thead><tr><th>Time</th><th>IP Address</th><th>Device</th></tr></thead>
                  <tbody>
                    {details.login_history.map(log => (
                      <tr key={log.id} className={log.is_suspicious ? 'suspicious' : ''}>
                        {/* --- APPLYING DATE FIX HERE --- */}
                        <td>{formatDate(log.time)}</td>
                        <td>{log.ip_address || 'N/A'}</td>
                        <td title={log.user_agent || 'Not Available'}>{truncate(log.user_agent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="detail-section">
              <h4>Active Sessions (Multi-Login)</h4>
               <div className="table-wrapper">
                <table className="mini-table">
                  <thead><tr><th>Last Activity</th><th>IP Address</th><th>Device</th></tr></thead>
                  <tbody>
                    {details.active_sessions.map(s => (
                      <tr key={s.id}>
                        {/* --- APPLYING DATE FIX HERE --- */}
                        <td>{formatDate(s.last_activity)}</td>
                        <td>{s.ip_address || 'N/A'}</td>
                        <td title={s.user_agent || 'Not Available'}>{truncate(s.user_agent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Compliance Audit Trail</h4>
               <div className="table-wrapper">
                <table className="mini-table">
                  <thead><tr><th>Time</th><th>Action</th><th>Description</th></tr></thead>
                  <tbody>
                    {details.audit_trail.map(log => (
                      <tr key={log.id}>
                        {/* --- APPLYING DATE FIX HERE --- */}
                        <td>{formatDate(log.time)}</td>
                        <td>{log.action}</td>
                        <td title={log.description}>{truncate(log.description)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityCompliance;