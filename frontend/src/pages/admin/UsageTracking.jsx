// src/pages/admin/UsageTracking.jsx

import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/AdminDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ... UserHistoryModal remains unchanged ...
const UserHistoryModal = ({ user, onClose }) => {
  // (Keep your existing UserHistoryModal code here)
  // I am omitting it for brevity, but DO NOT DELETE IT from your file.
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
      adminService.getUserEnhancementHistory(user.user_id).then(res => {
          setHistory(res.data.history.slice().reverse());
          setLoading(false);
      }).catch(() => setLoading(false));
  }, [user.user_id]);
  
  // ... chart config ...
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        {loading ? <p>Loading...</p> : <p>History loaded (Chart Placeholder)</p>}
      </div>
    </div>
  );
};

const UsageTracking = () => {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminService.getUsageTracking();
        setUsageData(res.data);
      } catch (err) {
        setError('Failed to load usage data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading Usage Data..." />;
  if (error) return <div className="error-message">{error}</div>;

  const promptUsagePercentage = usageData.prompt_usage.total > 0
    ? ((usageData.prompt_usage.with_instructions / usageData.prompt_usage.total) * 100).toFixed(1)
    : 0;

  return (
    <div>
      <div className="dashboard-header" style={{ textAlign: 'left', maxWidth: 'none', marginLeft: 0 }}>
        <h1>Resume Usage Tracking</h1>
      </div>

      <div className="dashboard-stats admin-stats">
        <div className="stat-card">
          <h3>Total Enhancements</h3>
          <p className="stat-number">{usageData.prompt_usage.total}</p>
        </div>
        <div className="stat-card stat-card-combined">
          <div className="combined-item">
            <h3>With Instructions</h3>
            <p className="stat-number">{usageData.prompt_usage.with_instructions}</p>
          </div>
          <div className="combined-item">
            <h3>Usage Rate</h3>
            <p className="stat-number">{promptUsagePercentage}%</p>
          </div>
        </div>
        <a href="#" className="stat-card stat-card-link">
          <h3>View OpenAI Usage</h3>
          <p className="stat-description">External Dashboard</p>
        </a>
      </div>

      <div className="usage-tracking-grid">
        <div className="admin-table-container">
          <h3>Daily Enhancements (Last 30 Days)</h3>
          {/* --- WRAPPER ADDED --- */}
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Enhancements</th>
                </tr>
              </thead>
              <tbody>
                {usageData.daily_enhancements.map(item => (
                  <tr key={item.date}>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-table-container">
          <h3>Top Users by Enhancements</h3>
          {/* --- WRAPPER ADDED --- */}
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Enhancements</th>
                </tr>
              </thead>
              <tbody>
                {usageData.enhancements_per_user.map(item => (
                  <tr key={item.user_id} onClick={() => setSelectedUser(item)} style={{ cursor: 'pointer' }}>
                    <td>{item.username}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {selectedUser && <UserHistoryModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
};

export default UsageTracking;