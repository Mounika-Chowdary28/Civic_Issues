import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { issuesAPI } from '../services/api';
import { toast } from 'react-toastify';
import L from 'leaflet';
import './AdminDashboard.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await issuesAPI.getAll();
      setIssues(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch issues');
    } finally {
      setLoading(false);
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

  const updateStatus = async (issueId, newStatus) => {
    try {
      await issuesAPI.updateStatus(issueId, { status: newStatus });
      toast.success('Status updated successfully');
      fetchIssues();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>🛡️ Admin Dashboard</h1>
            <p>View all reported issues and their locations</p>
          </div>
        </div>

        {/* Map Section */}
        <div className="admin-map-section">
          <h2>📍 Issues Map</h2>
          <div style={{ height: '400px', width: '100%', marginBottom: '2rem' }}>
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: '100%', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {issues.map((issue) => (
                <Marker
                  key={issue._id}
                  position={[
                    issue.location.coordinates[1],
                    issue.location.coordinates[0],
                  ]}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <h4>{issue.title}</h4>
                      <p>{issue.description}</p>
                      <p><strong>Category:</strong> {issue.category}</p>
                      <p><strong>Status:</strong> {issue.status}</p>
                      <p><strong>Reported by:</strong> {issue.reportedBy?.name}</p>
                      <Link to={`/issues/${issue._id}`} className="btn btn-sm btn-primary">
                        View Details
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Issues List Section */}
        <div className="admin-issues-section">
          <h2>📋 All Reported Issues ({issues.length})</h2>
          <div className="issues-table">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Reported By</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue._id}>
                    <td>
                      <img
                        src={issue.image}
                        alt={issue.title}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'; }}
                      />
                    </td>
                    <td>
                      <strong>{issue.title}</strong>
                      <br />
                      <small>{issue.description}</small>
                    </td>
                    <td>
                      <span className="badge">{issue.category}</span>
                    </td>
                    <td>{issue.address}</td>
                    <td>
                      <strong>{issue.reportedBy?.name}</strong>
                      <br />
                      <small>{issue.reportedBy?.email}</small>
                      <br />
                      <small>{issue.reportedBy?.phone}</small>
                    </td>
                    <td>
                      <select
                        value={issue.status}
                        onChange={(e) => updateStatus(issue._id, e.target.value)}
                        className={getStatusBadgeClass(issue.status)}
                        style={{ padding: '4px 8px', borderRadius: '4px' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Verified">Verified</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${issue.priority.toLowerCase()}`}>
                        {issue.priority}
                      </span>
                    </td>
                    <td>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link to={`/issues/${issue._id}`} className="btn btn-sm btn-primary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
