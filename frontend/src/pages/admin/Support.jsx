// src/pages/admin/Support.jsx

import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/AdminDashboard.css';

const Support = () => {
  // ... (useState, fetchTickets, handleResolve hooks remain the same)
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingTicket, setViewingTicket] = useState(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getSupportTickets();
      setTickets(res.data);
    } catch (err) {
      setError('Failed to fetch support tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleResolve = async (ticketId) => {
    try {
      await adminService.resolveSupportTicket(ticketId);
      // Refresh the list to show the updated status
      fetchTickets();
    } catch (err) {
      alert('Failed to resolve ticket. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading support tickets..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }
  return (
    <div>
      <div className="dashboard-header" style={{ textAlign: 'left', maxWidth: 'none', marginLeft: 0 }}>
        <h1>Support Tickets</h1>
      </div>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Submitted</th>
              {/* NEW: Added Resolved column */}
              <th>Resolved</th>
              <th>From</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td>{new Date(ticket.submitted_at).toLocaleString()}</td>
                {/* NEW: Display resolved_at date or N/A */}
                <td>{ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : 'N/A'}</td>
                <td>
                  <div>{ticket.name}</div>
                  <div className="text-muted">{ticket.email}</div>
                </td>
                <td>{ticket.subject}</td>
                <td>
                  <span className={`status-badge ${ticket.status === 'resolved' ? 'active' : 'inactive'}`}>
                    {ticket.status}
                  </span>
                </td>
                <td>
                  <button className="action-button" onClick={() => setViewingTicket(ticket)}>View</button>
                  {ticket.status === 'unresolved' && (
                    <button className="action-button success" onClick={() => handleResolve(ticket.id)} style={{marginLeft: '0.5rem'}}>
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingTicket && (
        <div className="modal-overlay" onClick={() => setViewingTicket(null)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setViewingTicket(null)}>&times;</button>
            <h3>Support Ticket #{viewingTicket.id}</h3>
            <div className="user-details-grid" style={{marginTop: '1.5rem'}}>
              <strong>From:</strong> <span>{viewingTicket.name} ({viewingTicket.email})</span>
              <strong>Subject:</strong> <span>{viewingTicket.subject}</span>
              <strong>Submitted:</strong> <span>{new Date(viewingTicket.submitted_at).toLocaleString()}</span>
              {/* NEW: Conditionally render the "Resolved At" field in the modal */}
              {viewingTicket.resolved_at && (
                <>
                  <strong>Resolved:</strong> <span>{new Date(viewingTicket.resolved_at).toLocaleString()}</span>
                </>
              )}
              <strong>Status:</strong> <span className={`status-badge ${viewingTicket.status === 'resolved' ? 'active' : 'inactive'}`}>{viewingTicket.status}</span>
            </div>
            <div className="detail-section" style={{marginTop: '1.5rem'}}>
              <h4>Message</h4>
              <p style={{whiteSpace: 'pre-wrap', background: '#1a2332', padding: '1rem', borderRadius: '8px'}}>{viewingTicket.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;