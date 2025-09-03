// frontend/src/pages/admin/UsageTracking.jsx

import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/AdminDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const UserHistoryModal = ({ user, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await adminService.getUserEnhancementHistory(user.user_id);
        setHistory(res.data.history.slice().reverse());
      } catch (err) {
        setError('Failed to load user enhancement history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.user_id]);
  
  const chartData = {
    labels: history.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [{
      label: 'Enhancements',
      data: history.map(item => item.count),
      backgroundColor: 'rgba(125, 211, 201, 0.7)',
      borderColor: 'rgba(125, 211, 201, 1)',
      borderWidth: 1,
      borderRadius: 4,
      barThickness: 'flex',
      maxBarThickness: 60,
      categoryPercentage: 0.8,
      barPercentage: 0.8,
    }],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Daily Enhancement Count for ${user.username}`,
        color: '#E0E0E0',
        font: {
            size: 16,
            weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: 'rgba(125, 211, 201, 0.5)',
        borderWidth: 1,
        borderRadius: 5,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-US').format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          stepSize: 1,
          font: {
              size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.15)',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
              size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.15)',
          drawBorder: false
        }
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        {loading && <p>Loading history...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && (
          <div style={{ marginTop: '1.5rem', height: '300px', width: '100%' }}>
            {history.length > 0 ? (
              <Bar options={chartOptions} data={chartData} />
            ) : (
              <p style={{textAlign: 'center', color: '#E0E0E0'}}>No enhancement history found for this user.</p>
            )}
          </div>
        )}
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

  if (loading) {
    return <LoadingSpinner message="Loading Usage Data..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const promptUsagePercentage = usageData.prompt_usage.total > 0
    ? ((usageData.prompt_usage.with_instructions / usageData.prompt_usage.total) * 100).toFixed(1)
    : 0;

  return (
    <div>
      <div className="dashboard-header" style={{ textAlign: 'left', maxWidth: 'none', marginLeft: 0 }}>
        <h1>Resume Usage Tracking</h1>
      </div>

      {/* --- MODIFIED STATS SECTION --- */}
      <div className="dashboard-stats admin-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <h3>Total Enhancements</h3>
          <p className="stat-number">{usageData.prompt_usage.total}</p>
        </div>
        
        {/* Combined Stat Card */}
        <div className="stat-card stat-card-combined">
          <div className="combined-item">
            <h3>Total Prompt box Usage</h3>
            <p className="stat-number">{usageData.prompt_usage.with_instructions}</p>
          </div>
          <div className="combined-item">
            <h3>Prompt Usage Rate</h3>
            <p className="stat-number">{promptUsagePercentage}%</p>
          </div>
        </div>

        {/* Link Card to OpenAI */}
        <a 
          href="https://platform.openai.com/settings/organization/usage" 
          target="_blank" 
          rel="noopener noreferrer"
          className="stat-card stat-card-link"
        >
          <h3>Click to track usage</h3>
          <p className="stat-description">View OpenAI API Usage</p>
        </a>
      </div>
      {/* --- END MODIFIED STATS SECTION --- */}

      <div className="usage-tracking-grid">
        <div className="admin-table-container">
          <h3>Daily Enhancements (Last 30 Days)</h3>
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

        <div className="admin-table-container">
          <h3>Top Users by Enhancements</h3>
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
      
      {selectedUser && <UserHistoryModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
};

export default UsageTracking;