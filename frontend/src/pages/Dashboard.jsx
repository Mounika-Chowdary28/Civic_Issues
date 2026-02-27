import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchIssues();
    if (isAdmin) {
      fetchStats();
    }
  }, [filters]);

  const fetchIssues = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;

      const response = await issuesAPI.getAll(params);
      setIssues(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await issuesAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats');
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
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Welcome, {user?.name}!</h1>
            <p className="text-muted">
              {isAdmin ? 'Manage all reported issues' : 'View and track your reported issues'}
            </p>
          </div>
          <Link to="/report" className="btn btn-primary">
            📝 Report New Issue
          </Link>
        </div>

        {isAdmin && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{stats.total}</h3>
              <p>Total Issues</p>
            </div>
            <div className="stat-card pending">
              <h3>{stats.byStatus.pending}</h3>
              <p>Pending</p>
            </div>
            <div className="stat-card verified">
              <h3>{stats.byStatus.verified}</h3>
              <p>Verified</p>
            </div>
            <div className="stat-card progress">
              <h3>{stats.byStatus.inProgress}</h3>
              <p>In Progress</p>
            </div>
            <div className="stat-card resolved">
              <h3>{stats.byStatus.resolved}</h3>
              <p>Resolved</p>
            </div>
          </div>
        )}

        <div className="filters-section card">
          <h3>Filter Issues</h3>
          <div className="filters">
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
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            <button
              className="btn btn-outline"
              onClick={() => setFilters({ status: '', category: '', priority: '' })}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="issues-section">
          <h2>
            {isAdmin ? 'All Issues' : 'Your Issues'} ({issues.length})
          </h2>

          {issues.length === 0 ? (
            <div className="empty-state card">
              <p>No issues found. Start by reporting a new issue!</p>
              <Link to="/report" className="btn btn-primary">
                Report Issue
              </Link>
            </div>
          ) : (
            <div className="issues-grid">
              {issues.map((issue) => (
                <div key={issue._id} className="issue-card card">
                  <div className="issue-image">
                    <img
                      src={issue.image}
                      alt={issue.title}
                      onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                    />
                    <span className={getStatusBadgeClass(issue.status)}>
                      {issue.status}
                    </span>
                  </div>

                  <div className="issue-content">
                    <div className="issue-header">
                      <h3>{issue.title}</h3>
                      <span className="badge">{issue.category}</span>
                    </div>

                    <p className="issue-description">{issue.description}</p>

                    <div className="issue-meta">
                      <span>📍 {issue.address}</span>
                      <span>⚡ {issue.priority}</span>
                      <span>
                        📅 {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {isAdmin && issue.reportedBy && (
                      <div className="issue-reporter">
                        <small>
                          Reported by: {issue.reportedBy.name} ({issue.reportedBy.email})
                        </small>
                      </div>
                    )}

                    <div className="issue-actions">
                      <Link
                        to={`/issues/${issue._id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View Details
                      </Link>
                      {(isAdmin || issue.reportedBy._id === user._id) && (
                        <button
                          onClick={() => handleDelete(issue._id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
