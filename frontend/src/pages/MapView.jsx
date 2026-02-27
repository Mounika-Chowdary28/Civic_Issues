import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { toast } from 'react-toastify';
import L from 'leaflet';
import './MapView.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
  });
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  const fetchIssues = async () => {
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const response = await issuesAPI.getAll(params);
      let issuesList = response.data.data;

      // Sort issues
      if (sortBy === 'recent') {
        issuesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setIssues(issuesList);
    } catch (error) {
      toast.error('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (status) => {
    const colors = {
      Pending: '#f59e0b',
      Verified: '#3b82f6',
      'In Progress': '#8b5cf6',
      Resolved: '#10b981',
      Rejected: '#ef4444',
    };
    return colors[status] || '#6b7280';
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
    <div className="map-view-page">
      <div className="map-header">
        <div className="container">
          <div className="map-header-content">
            <div>
              <h1>🗺️ All Issues Map</h1>
              <p>View all reported issues on the interactive map</p>
            </div>
            <Link to="/report" className="btn btn-primary">
              📝 Report New Issue
            </Link>
          </div>
        </div>
      </div>

      <div className="map-filters">
        <div className="container">
          <div className="filters-row">
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
              onChange={(e) => {
                setSortBy(e.target.value);
                fetchIssues();
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>

            <button
              className="btn btn-outline"
              onClick={() => {
                setFilters({ category: '', status: '' });
                setSortBy('recent');
              }}
            >
              Clear Filters
            </button>
          </div>
          <div className="map-info">
            <span>📍 Showing {issues.length} issues</span>
          </div>
        </div>
      </div>

      <div className="map-container-full">
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {issues.map((issue) => {
            const position = [
              issue.location.coordinates[1],
              issue.location.coordinates[0],
            ];
            return (
              <Marker key={issue._id} position={position}>
                <Popup maxWidth={300}>
                  <div className="map-popup">
                    <div className="popup-image">
                      <img
                        src={issue.image}
                        alt={issue.title}
                        style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x80?text=No+Image'; }}
                      />
                    </div>
                    <div className="popup-content">
                      <h3>{issue.title}</h3>
                      <div className="popup-badges">
                        <span className={getStatusBadgeClass(issue.status)}>
                          {issue.status}
                        </span>
                        <span className="badge">{issue.category}</span>
                      </div>
                      <p className="popup-description">{issue.description}</p>
                      <div className="popup-meta">
                        <span>📍 {issue.address}</span>
                        <span>📅 {new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Link to={`/issues/${issue._id}`} className="btn btn-primary btn-sm">
                        View Details
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;
