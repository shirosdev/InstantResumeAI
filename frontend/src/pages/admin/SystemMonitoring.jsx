// src/pages/admin/SystemMonitoring.jsx

import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/AdminDashboard.css'; // Reusing some styles

const SystemMonitoring = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminService.getSystemStats();
        setData(res.data);
      } catch (err) {
        setError('Failed to load system monitoring data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading System Data..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const { api_health, job_processing, external_services } = data;

  return (
    <div>
      <div className="dashboard-header" style={{ textAlign: 'left', maxWidth: 'none', marginLeft: 0 }}>
        <h1>System Monitoring</h1>
      </div>

      {/* API Health Section */}
      <div className="admin-table-container" style={{ marginBottom: '2rem' }}>
        <h3>API Health (Last 24 Hours)</h3>
        <div className="dashboard-stats admin-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <h3>Avg. Response Time</h3>
            <p className="stat-number">{api_health.avg_response_time} ms</p>
          </div>
          <div className="stat-card">
            <h3>Server Error Rate</h3>
            <p className="stat-number">{api_health.error_rate_percent}%</p>
          </div>
        </div>
        <h4>Slowest Endpoints</h4>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Avg. Response Time (ms)</th>
            </tr>
          </thead>
          <tbody>
            {api_health.slowest_endpoints.map((ep, i) => (
              <tr key={i}>
                <td>{ep.method}</td>
                <td>{ep.endpoint}</td>
                <td>{ep.avg_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Job Processing Section */}
      <div className="admin-table-container" style={{ marginBottom: '2rem' }}>
        <h3>Background Job Processing</h3>
        <div className="dashboard-stats admin-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <h3>Completed</h3>
            <p className="stat-number">{job_processing.status_counts.completed || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <p className="stat-number">{job_processing.status_counts.pending || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Failed</h3>
            <p className="stat-number">{job_processing.status_counts.failed || 0}</p>
          </div>
        </div>
        <h4>Recent Failures</h4>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>User ID</th>
              <th>Failed At</th>
            </tr>
          </thead>
          <tbody>
             {job_processing.recent_failures.length > 0 ? job_processing.recent_failures.map(job => (
              <tr key={job.enhancement_id}>
                <td>{job.enhancement_id}</td>
                <td>{job.user_id}</td>
                <td>{new Date(job.failed_at).toLocaleString()}</td>
              </tr>
            )) : (
              <tr><td colSpan="3" style={{textAlign: 'center'}}>No recent failures.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
       {/* External Services Section */}
      <div className="admin-table-container">
          <h3>External Service Status</h3>
           <table className="admin-table">
              <thead>
                <tr>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                    <td>OpenAI API</td>
                    <td>
                        <span className={`status-badge ${external_services.openai_api.indicator === 'operational' ? 'active' : 'inactive'}`}>
                            {external_services.openai_api.indicator}
                        </span>
                    </td>
                    <td>{external_services.openai_api.description}</td>
                </tr>
              </tbody>
           </table>
      </div>

    </div>
  );
};

export default SystemMonitoring;