import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { issuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './IssueDetail.css';

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    priority: '',
    adminNotes: '',
  });

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
    try {
      const response = await issuesAPI.getById(id);
      setIssue(response.data.data);
      setStatusUpdate({
        status: response.data.data.status,
        priority: response.data.data.priority,
        adminNotes: response.data.data.adminNotes || '',
      });
    } catch (error) {
      toast.error('Failed to fetch issue details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      await issuesAPI.updateStatus(id, statusUpdate);
      toast.success('Issue updated successfully');
      fetchIssue();
    } catch (error) {
      toast.error('Failed to update issue');
    } finally {
      setUpdating(false);
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

  if (!issue) return null;

  const position = [issue.location.coordinates[1], issue.location.coordinates[0]];

  return (
    <div className="issue-detail-page">
      <div className="container">
        <button className="btn btn-outline mb-3" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>

        <div className="detail-grid">
          <div className="detail-main">
            <div className="card">
              <div className="detail-header">
                <div>
                  <h1>{issue.title}</h1>
                  <div className="detail-badges">
                    <span className={getStatusBadgeClass(issue.status)}>
                      {issue.status}
                    </span>
                    <span className="badge">{issue.category}</span>
                    <span className="badge">Priority: {issue.priority}</span>
                  </div>
                </div>
              </div>

              <div className="detail-image">
                <img
                  src={issue.image}
                  alt={issue.title}
                  style={{ width: '100%', maxWidth: '400px', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}
                  onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                />
              </div>

              <div className="detail-content">
                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{issue.description}</p>
                </div>

                <div className="detail-section">
                  <h3>Location</h3>
                  <p>📍 {issue.address}</p>
                  <div className="detail-map">
                    <MapContainer
                      center={position}
                      zoom={15}
                      style={{ height: '300px', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <Marker position={position} />
                    </MapContainer>
                  </div>
                  <p className="text-muted mt-2">
                    Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                  </p>
                </div>

                {issue.adminNotes && (
                  <div className="detail-section admin-notes">
                    <h3>Admin Notes</h3>
                    <p>{issue.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="card">
              <h3>Issue Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="label">Reported By</span>
                  <span className="value">{issue.reportedBy?.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email</span>
                  <span className="value">{issue.reportedBy?.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">Phone</span>
                  <span className="value">{issue.reportedBy?.phone}</span>
                </div>
                <div className="info-item">
                  <span className="label">Reported On</span>
                  <span className="value">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Last Updated</span>
                  <span className="value">
                    {new Date(issue.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {issue.resolvedAt && (
                  <div className="info-item">
                    <span className="label">Resolved On</span>
                    <span className="value">
                      {new Date(issue.resolvedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="card">
                <h3>Update Status</h3>
                <form onSubmit={handleStatusUpdate}>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      className="form-control"
                      value={statusUpdate.status}
                      onChange={(e) =>
                        setStatusUpdate({ ...statusUpdate, status: e.target.value })
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Verified">Verified</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      className="form-control"
                      value={statusUpdate.priority}
                      onChange={(e) =>
                        setStatusUpdate({ ...statusUpdate, priority: e.target.value })
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Admin Notes</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={statusUpdate.adminNotes}
                      onChange={(e) =>
                        setStatusUpdate({ ...statusUpdate, adminNotes: e.target.value })
                      }
                      placeholder="Add notes about this issue..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Update Issue'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
