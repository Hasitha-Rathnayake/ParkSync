import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVehiclesForUser } from '../api/vehicleApi';

export default function ProfilePage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (!user?.id || !isCustomer) return;
    getVehiclesForUser(user.id)
      .then((res) => setVehicles(res.data || []))
      .catch(() => setError('Could not load vehicles.'));
  }, [user?.id, isCustomer]);

  if (!user) {
    return (
      <div className="page">
        <h1 className="page-title">My Profile</h1>
        <div className="alert alert-error">Please log in to view your profile.</div>
        <Link to="/login" className="btn btn-primary">Log In</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">
        {isCustomer ? 'Your account details and registered vehicles.' : 'Your staff account details.'}
      </p>

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="card-title" style={{ fontSize: 20, marginBottom: 12 }}>{user.fullName}</div>
        <div className="card-meta"><strong>Email:</strong> {user.email}</div>
        <div className="card-meta"><strong>Phone:</strong> {user.phoneNumber || '—'}</div>
        <div className="card-meta" style={{ marginTop: 8 }}>
          <strong>Role:</strong>{' '}
          <span className="badge badge-pending">{user.role}</span>
        </div>
      </div>

      {isCustomer && (
        <>
          <div className="section-label">My vehicles</div>
          {error && <div className="alert alert-error">{error}</div>}
          {vehicles.length === 0 && (
            <div className="empty-state">
              No vehicles yet.{' '}
              <Link to="/vehicles" style={{ color: 'var(--amber-dark)', fontWeight: 600 }}>Add a vehicle</Link>
            </div>
          )}
          {vehicles.map((v) => (
            <div className="card" key={v.id}>
              <div className="card-title">{v.plateNumber}</div>
              <div className="card-meta">
                {[v.make, v.model, v.color].filter(Boolean).join(' · ') || 'Vehicle'}
                {v.vehicleType ? ` · ${v.vehicleType}` : ''}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/vehicles" className="btn btn-primary btn-sm">Manage vehicles</Link>
            <Link to="/reservations" className="btn btn-secondary btn-sm">My reservations</Link>
          </div>
        </>
      )}
    </div>
  );
}
