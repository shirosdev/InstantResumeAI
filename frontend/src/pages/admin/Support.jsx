// src/pages/admin/Support.jsx

import React, { useState, useEffect, useCallback } from 'react';
// We no longer need useAuth
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/AdminDashboard.css';
import '../../styles/SupportThread.css'; // We can keep this for other styles if needed

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // We no longer need selectedTicketId
  // const [selectedTicketId, setSelectedTicketId] = useState(null);

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
    // Add a confirmation before resolving
    if (window.confirm('Are you sure you have resolved this ticket via email?')) {
      try {
        await adminService.resolveSupportTicket(ticketId);
        fetchTickets();
      } catch (err) {
        alert('Failed to resolve ticket. Please try again.');
      }
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
        <p style={{color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'left', margin: 0}}>
          Reply to user queries from your admin email (info@instantresumeai.com). Mark tickets as "Resolved" here when done.
        </p>
      </div>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Resolved</th>
              <th>From</th>
              <th>Email (Reply-To)</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td>{new Date(ticket.submitted_at).toLocaleString()}</td>
                <td>{ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : 'N/A'}</td>
                <td>{ticket.name}</td>
                {/* Add email as a dedicated column */}
                <td><a href={`mailto:${ticket.email}`}>{ticket.email}</a></td>
                
                {/* Add a title attribute to see the full message on hover */}
                <td title={`Message: ${ticket.message}`}>
                  {ticket.subject}
                </td>
                
                <td>
                  <span className={`status-badge ${ticket.status === 'resolved' ? 'active' : 'inactive'}`}>
                    {ticket.status}
                  </span>
                </td>
                <td>
                  {/* REMOVED the "View Thread" button */}
                  {ticket.status === 'unresolved' && (
                    <button className="action-button success" onClick={() => handleResolve(ticket.id)}>
                      Mark as Resolved
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REMOVED the TicketThreadModal component */}
    </div>
  );
};

// --- REMOVED THE ENTIRE TicketThreadModal COMPONENT ---

export default Support;