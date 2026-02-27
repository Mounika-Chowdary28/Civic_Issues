import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { toast } from 'react-toastify';
import './AdminIssues.css';

const AdminIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
  });
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchIssues();
  }, [filters, sortBy]);

  const fetchIssues = async () => {
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const response = await issuesAPI.getAll(params);
      let issuesList = response.data.data;

      // Filter by search
      if (filters.search) {
        issuesList = issuesList.filter(
          (issue) =>
            issue.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            issue.address.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      // Sort
      if (sortBy === 'recent') {
        issuesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'oldest') {
        issuesList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      setIssues(issuesList);
    } catch (error) {
      toast.error('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUpdate = async (id, status) => {
    try {
      await issuesAPI.updateStatus(id, { status });
      toast.success(`Status updated to ${status}`);
      fetchIssues();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) {
      return;
    }

    try {
      await issuesAPI.delete(id);
      toast.success('Issue deleted successfully');
      fetchIssues();
    } catch (error) {
      toast.error('Failed to delete issue');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      Pending: 'badge-pending',
      Verified: 'badge-verified',
      'In Progress': 'badge-progress',
      Resolved: 'badge-resolved',
      Rejected: 'badge-rejected',
    };
    return `badge ${classes[status] || ''}`;
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-issues-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>📋 Issue Management</h1>
            <p>Review, verify, and manage all reported issues</p>
          </div>
          <div className="header-actions">
            <Link to="/admin/dashboard" className="btn btn-outline">
              ← Dashboard
            </Link>
            <Link to="/map" className="btn btn-primary">
              🗺️ Map View
            </Link>
          </div>
        </div>

        <div className="filters-section card">
          <div className="filters-row">
            <input
              type="text"map
              className="form-control search-input"
              placeholder="🔍 Search by title or area..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />

            <select
              className="form-control"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Broken Streetlight">Broken Streetlight</option>
              <option value="Garbage Overflow">Garbage Overflow</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Other">Other</option>
            </select>

            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>

            <button
              className="btn btn-outline"
              onClick={() => {
                setFilters({ category: '', status: '', search: '' });
                setSortBy('recent');
              }}
            >
              Clear All
            </button>
          </div>
          <div className="results-count">
            Showing {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📭</div>
            <h3>No issues found</h3>
            <p>Try adjusting your filters to see more results</p>
          </div>
        ) : (
          <div className="issues-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Reporter</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Quick Actions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue._id}>
                    <td>
                      <div className="issue-cell">
                          <img
                            src={issue.image}
                            alt={issue.title}
                            className="issue-thumbnail"
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'; }}
                          />
                        <div>
                          <div className="issue-title">{issue.title}</div>
                          <div className="issue-location">📍 {issue.address}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="reporter-cell">
                        <div className="reporter-name">{issue.reportedBy?.name}</div>
                        <div className="reporter-email">{issue.reportedBy?.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge">{issue.category}</span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(issue.status)}>
                        {issue.status}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-${issue.priority.toLowerCase()}`}>
                        {issue.priority}
                      </span>
                    </td>
                    <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select
                        className="form-control status-select"
                        value={issue.status}
                        onChange={(e) => handleQuickUpdate(issue._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Verified">Verified</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/issues/${issue._id}`}
                          className="btn btn-primary btn-sm"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(issue._id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminIssues;
