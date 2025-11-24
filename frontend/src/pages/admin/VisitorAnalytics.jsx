// Create this new file: src/pages/admin/VisitorAnalytics.jsx

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/AdminDashboard.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const VisitorAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminService.getVisitorAnalytics();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading Analytics Data..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const lineChartData = {
    labels: data.daily_chart.labels,
    datasets: [
      {
        label: 'Unique Visitors',
        data: data.daily_chart.visitors,
        borderColor: 'rgba(125, 211, 201, 1)',
        backgroundColor: 'rgba(125, 211, 201, 0.2)',
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Pageviews',
        data: data.daily_chart.pageviews,
        borderColor: 'rgba(230, 126, 80, 1)',
        backgroundColor: 'rgba(230, 126, 80, 0.2)',
        fill: false,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Visitors / Sessions',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Pageviews',
        },
        grid: {
          drawOnChartArea: false, // only draw grid for y-axis
        },
      },
    },
  };

  return (
    <div>
      <div className="dashboard-header" style={{ textAlign: 'left', maxWidth: 'none', marginLeft: 0 }}>
        <h1>Visitor Analytics (Last 30 Days)</h1>
      </div>

      <div className="dashboard-stats admin-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <h3>Total Unique Visitors</h3>
          <p className="stat-number">{data.totals.visitors.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Total Sessions</h3>
          <p className="stat-number">{data.totals.sessions.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Total Pageviews</h3>
          <p className="stat-number">{data.totals.pageviews.toLocaleString()}</p>
        </div>
      </div>

      <div className="admin-table-container">
        <h3>Traffic Over Time</h3>
        <div className="chart-container" style={{ height: '400px' }}>
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default VisitorAnalytics;