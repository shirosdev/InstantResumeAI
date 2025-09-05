// src/pages/admin/UserManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import UserDetailsModal from './UserDetailsModal';
import Pagination from '../../components/Pagination';
import '../../styles/Dashboard.css';
import '../../styles/AdminDashboard.css';

const UserManagement = () => {
  // Receive stats from the parent AdminDashboard component
  const { stats, loading: statsLoading } = useOutletContext();
  
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async (page = 1, query = '') => {
    try {
      setLoading(true);
      const res = await adminService.getUsers(page, 15, query);
      setUsers(res.data.users);
      setPagination({
        currentPage: res.data.current_page,
        totalPages: res.data.total_pages
      });
    } catch (err) {
      setError('Failed to fetch user list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, searchQuery);
  }, [fetchUsers, searchQuery]);
  
  const handleViewUser = (userId) => setSelectedUserId(userId);
  const handleCloseModal = () => setSelectedUserId(null);
  const handleUserUpdate = () => fetchUsers(pagination.currentPage, searchQuery);
  const handlePageChange = (page) => fetchUsers(page, searchQuery);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  if (statsLoading) {
    return <LoadingSpinner message="Loading User Data..." />;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <>
      <div className="dashboard-stats admin-stats">
        <div className="stat-card">
          <h3>Total Registered Users</h3>
          <p className="stat-number">{stats?.total_users ?? 'N/A'}</p>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <p className="stat-number">{stats?.active_users ?? 'N/A'}</p>
        </div>
        <div className="stat-card">
          <h3>New Signups (Last 7 Days)</h3>
          <p className="stat-number">{stats?.new_signups_weekly ?? 'N/A'}</p>
        </div>
      </div>
      
      <div className="admin-table-container">
        <div className="table-header">
          <h3>All Users</h3>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search by username or email..." 
              value={searchQuery} 
              onChange={handleSearchChange} 
            />
          </div>
        </div>
        {loading ? <LoadingSpinner /> : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Member Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="action-button" onClick={() => handleViewUser(user.user_id)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <Pagination 
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {selectedUserId && (
        <UserDetailsModal 
          userId={selectedUserId} 
          onClose={handleCloseModal}
          onUpdate={handleUserUpdate}
        />
      )}
    </>
  );
};

export default UserManagement;