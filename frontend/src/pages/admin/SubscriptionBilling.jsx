// src/pages/admin/SubscriptionBilling.jsx

import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/AdminDashboard.css';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true,
        timeZone: 'America/New_York', timeZoneName: 'short'
      });
    } catch (e) { return 'Invalid Date'; }
};

const SubscriptionBilling = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [revenueData, setRevenueData] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoadingRevenue(true);
    setLoadingSubscribers(true);
    setError('');
    try {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const revenueRes = await adminService.getRevenueStats(startDate, endOfDay);
      setRevenueData(revenueRes.data);

      const subscribersRes = await adminService.getSubscriptionActivity(startDate, endOfDay, page);
      setSubscribers(subscribersRes.data.subscribers);
      setPagination({
        currentPage: subscribersRes.data.current_page,
        totalPages: subscribersRes.data.total_pages,
      });
    } catch (err) {
      setError('Failed to load billing data.');
    } finally {
      setLoadingRevenue(false);
      setLoadingSubscribers(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handlePageChange = (page) => fetchData(page);
  
  const CustomDatePickerInput = React.forwardRef(({ value, onClick }, ref) => (
    <button className="pagination-button" onClick={onClick} ref={ref}>
      {value}
    </button>
  ));
  
  const formatCardDate = (dateString) => {
    const fullDate = formatDate(dateString);
    if (fullDate === 'N/A' || fullDate === 'Invalid Date') return 'N/A';
    return fullDate.split(',')[0];
  };

  return (
    <div>
      <div className="dashboard-header" style={{ textAlign: 'left', maxWidth: 'none', marginLeft: 0 }}>
        <h1>Subscription & Billing</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-table-container date-range-container">
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Select Date Range:</h3>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          customInput={<CustomDatePickerInput />}
        />
        <span style={{color: 'var(--text-secondary)'}}>to</span>
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          customInput={<CustomDatePickerInput />}
        />
        <button className="action-button success" onClick={() => fetchData(1)} style={{marginLeft: 'auto'}}>
          Load Data
        </button>
      </div>

      <div className="admin-table-container" style={{ marginBottom: '2rem' }}>
        <h3>Revenue</h3>
        {loadingRevenue ? <LoadingSpinner /> : (
          <div className="dashboard-stats admin-stats" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p className="stat-number">${revenueData?.total_revenue.toFixed(2) ?? '0.00'}</p>
            </div>
            <div className="stat-card">
              <h3>Total Transactions</h3>
              <p className="stat-number">{revenueData?.total_transactions ?? '0'}</p>
            </div>
            <div className="stat-card">
              <h3>Date Range</h3>
              <p className="stat-date" style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>
                {formatCardDate(revenueData?.start_date)} - {formatCardDate(revenueData?.end_date)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="admin-table-container">
        <h3>Transaction Activity in Range</h3>
        {loadingSubscribers ? <LoadingSpinner /> : (
          <>
            {/* --- WRAPPER ADDED HERE --- */}
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Subscription Plan</th> 
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.length > 0 ? subscribers.map(sub => (
                    <tr key={sub.transaction_id}>
                      <td>{formatDate(sub.date)}</td>
                      <td>{sub.username}</td>
                      <td>{sub.email}</td>
                      <td>
                        <span className={`status-badge ${sub.plan_name.includes('Top-Up') ? 'inactive' : 'active'}`}>
                          {sub.plan_name}
                        </span>
                      </td>
                      <td>${sub.amount.toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" style={{textAlign: 'center'}}>No transactions in this date range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* --- END WRAPPER --- */}
            <Pagination 
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionBilling;