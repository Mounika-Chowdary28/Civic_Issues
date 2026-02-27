import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { toast } from 'react-toastify';
import './MyReports.css';

const MyReports = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchMyIssues();
  }, [sortBy]);

  const fetchMyIssues = async () => {
    try {
      const response = await issuesAPI.getAll({});
      let issuesList = response.data.data;

      // Sort
      if (sortBy === 'recent') {
        issuesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'oldest') {
        issuesList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      setIssues(issuesList);
    } catch (error) {
      toast.error('Failed to fetch your reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await issuesAPI.delete(id);
      toast.success('Report deleted successfully');
      fetchMyIssues();
    } catch (error) {
      toast.error('Failed to delete report');
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

  const getStatusStats = () => {
    const stats = {
      total: issues.length,
      pending: issues.filter((i) => i.status === 'Pending').length,
      verified: issues.filter((i) => i.status === 'Verified').length,
      inProgress: issues.filter((i) => i.status === 'In Progress').length,
      resolved: issues.filter((i) => i.status === 'Resolved').length,
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const stats = getStatusStats();

  return (
    <div className="my-reports-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>📌 My Reports</h1>
            <p>View and manage all your reported issues</p>
          </div>
          <Link to="/report" className="btn btn-primary">
            📝 Report New Issue
          </Link>
        </div>

        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Reports</div>
          </div>
          <div className="stat-box pending">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-box progress">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-box resolved">
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        <div className="reports-controls">
          <div className="controls-left">
            <h2>All Reports ({issues.length})</h2>
          </div>
          <div className="controls-right">
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📭</div>
            <h3>No reports yet</h3>
            <p>You haven't reported any issues. Start by reporting your first issue!</p>
            <Link to="/report" className="btn btn-primary">
              Report Your First Issue
            </Link>
          </div>
        ) : (
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue._id}>
                    <td>
                      <div className="table-title">
                        <img
                          src={issue.image}
                          alt={issue.title}
                          className="table-thumbnail"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'; }}
                        />
                        <span>{issue.title}</span>
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
                    <td className="location-cell">
                      {issue.address.substring(0, 30)}...
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/issues/${issue._id}`}
                          className="btn btn-outline btn-sm"
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

export default MyReports;
