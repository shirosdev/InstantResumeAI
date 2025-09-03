// frontend/src/pages/admin/AdminOverview.jsx

import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/AdminOverview.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminOverview = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await adminService.getChartData();
        setChartData(res.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading Dashboard..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const barChartData = {
    labels: chartData.monthly_signups.map(d => new Date(d.year, d.month - 1).toLocaleString('default', { month: 'long' })),
    datasets: [{
      label: 'New Users',
      data: chartData.monthly_signups.map(d => d.count),
      backgroundColor: 'rgba(125, 211, 201, 0.6)',
      borderColor: 'rgba(125, 211, 201, 1)',
      borderWidth: 1,
    }],
  };

  const pieChartData = {
    labels: chartData.plan_distribution.map(d => d.plan_name),
    datasets: [{
      data: chartData.plan_distribution.map(d => d.count),
      backgroundColor: ['#e67e50', '#f4a261', '#7dd3c9', '#8b7ed8', '#4a5568'],
    }],
  };

  return (
    <div className="admin-overview">
      <div className="dashboard-header" style={{ textAlign: 'left', maxWidth: 'none', marginLeft: 0 }}>
        <h1>Admin Overview</h1>
      </div>
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Monthly User Registrations (Last 6 Months)</h3>
          <Bar data={barChartData} />
        </div>
        <div className="chart-container">
          <h3>Subscription Plan Distribution</h3>
          <Pie data={pieChartData} />
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;