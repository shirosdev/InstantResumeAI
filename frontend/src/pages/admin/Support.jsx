// src/pages/admin/Support.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth to identify the current admin
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/AdminDashboard.css';
import '../../styles/SupportThread.css';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);

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
                  <button className="action-button" onClick={() => setSelectedTicketId(ticket.id)}>View Thread</button>
                  {ticket.status === 'unresolved' && (
                    <button className="action-button success" onClick={() => handleResolve(ticket.id)} style={{marginLeft: '0.5rem'}}>
                      Close Ticket
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTicketId && (
        <TicketThreadModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onUpdate={fetchTickets}
        />
      )}
    </div>
  );
};

// --- Modal Component with Corrected Logic ---
const TicketThreadModal = ({ ticketId, onClose, onUpdate }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const fetchThread = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getTicketDetails(ticketId);
      setTicket(res.data);
    } catch (err) {
      setError('Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    setIsReplying(true);
    try {
      await adminService.postTicketReply(ticketId, reply);
      setReply('');
      fetchThread();
    } catch (err) {
      alert('Failed to send reply.');
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        {loading && <LoadingSpinner />}
        {error && <div className="error-message">{error}</div>}
        {ticket && (
          <>
            <h3>{ticket.subject}</h3>
            <div className="ticket-thread-container">
              {/* Original Message from User (Always Left) */}
              <div className="thread-message user-message">
                <div className="message-header">
                  <strong>{ticket.name}</strong>
                  <span>{new Date(ticket.submitted_at).toLocaleString()}</span>
                </div>
                <div className="message-body">
                  <p>{ticket.message}</p>
                </div>
              </div>

              {/* All Replies (User and Admin) */}
              {ticket.replies.map(rep => {
                // FIX: Check if the reply is from an admin or the user
                const messageClass = rep.is_admin_reply ? 'admin-message' : 'user-message';

                return (
                  <div key={rep.id} className={`thread-message ${messageClass}`}>
                    <div className="message-header">
                      <strong>{rep.author_name}{rep.is_admin_reply ? ' (Admin)' : ''}</strong>
                      <span>{new Date(rep.sent_at).toLocaleString()}</span>
                    </div>
                    <div className="message-body">
                      <p>{rep.reply_message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {ticket.status === 'unresolved' ? (
              <form onSubmit={handlePostReply} className="reply-form">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  rows="4"
                  disabled={isReplying}
                />
                <button type="submit" className="action-button" disabled={isReplying || !reply.trim()}>
                  {isReplying ? 'Sending...' : 'Send Reply'}
                </button>
              </form>
            ) : (
              <div className="ticket-closed-notice">
                This ticket was closed on {new Date(ticket.resolved_at).toLocaleString()} and can no longer be replied to.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Support;