// frontend/src/pages/admin/UserDetailsModal.jsx

import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import '../../styles/Modal.css'; // We'll create this new CSS file

const UserDetailsModal = ({ userId, onClose, onUpdate }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await adminService.getUser(userId);
        setUser(res.data);
      } catch (err) {
        setError('Failed to fetch user details.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleStatusChange = async (isActive) => {
    try {
      await adminService.updateUserStatus(userId, isActive);
      onUpdate(); // Refresh the user list in the parent component
      onClose();   // Close the modal
    } catch (err) {
      setError('Failed to update user status.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete user ${user.username}?`)) {
      try {
        await adminService.deleteUser(userId);
        onUpdate();
        onClose();
      } catch (err) {
        setError('Failed to delete user.');
      }
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p className="error-message">{error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>User Details</h2>
        {user && (
          <>
            <div className="user-details-grid">
              <strong>User ID:</strong><span>{user.user_id}</span>
              <strong>Username:</strong><span>{user.username}</span>
              <strong>Email:</strong><span>{user.email}</span>
              <strong>First Name:</strong><span>{user.first_name || 'N/A'}</span>
              <strong>Last Name:</strong><span>{user.last_name || 'N/A'}</span>
              <strong>Status:</strong>
              <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
              <strong>Member Since:</strong><span>{new Date(user.created_at).toLocaleDateString()}</span>
              <strong>Last Login:</strong><span>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</span>
            </div>
            <div className="modal-actions">
              {user.is_active ? (
                <button className="action-button danger" onClick={() => handleStatusChange(false)}>Deactivate User</button>
              ) : (
                <button className="action-button success" onClick={() => handleStatusChange(true)}>Activate User</button>
              )}
              <button className="action-button danger" onClick={handleDelete}>Delete User</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserDetailsModal;