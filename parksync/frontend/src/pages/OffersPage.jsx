import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllActivePackages, deactivatePackage } from '../api/packageApi';
import { getAllLots } from '../api/parkingLotApi';
import { useAuth } from '../context/AuthContext';
import { canSeePricing } from '../utils/roles';

const API_ORIGIN = 'http://localhost:8080';
const imgUrl = (path) =>
  path ? (path.startsWith('http') ? path : `${API_ORIGIN}/uploads/${path}`) : null;

export default function OffersPage() {
  const { user } = useAuth();
  const role = user?.role;
  const isCustomer = !user || role === 'CUSTOMER';
  const isManager = user && canSeePricing(role); // LOT_ADMIN / SYSTEM_ADMIN
  const [packages, setPackages] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getAllActivePackages().then((r) => r.data || []).catch(() => []),
      getAllLots().then((r) => r.data || []).catch(() => []),
    ])
      .then(([pkgs, lotList]) => {
        setPackages(pkgs);
        setLots(lotList);
      })
      .catch(() => setError('Could not load offers.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const lotName = (id) => {
    const lot = lots.find((l) => String(l.id) === String(id));
    return lot ? lot.name : `Lot #${id}`;
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this offer? Customers will no longer see it.')) return;
    setBusyId(id);
    try {
      await deactivatePackage(id);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not deactivate package.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Offers & special packages</h1>
      <p className="page-subtitle">
        Festival, weekend, and seasonal deals active today. Discount applies automatically when a
        customer books a slot at that lot for a date inside the offer window.
      </p>

      {isManager && (
        <p className="card-meta" style={{ marginBottom: 16 }}>
          You manage these offers.{' '}
          <Link to="/pricing" style={{ color: 'var(--amber-dark)', fontWeight: 600 }}>
            Create or edit on Pricing →
          </Link>
        </p>
      )}

      {loading && <div className="empty-state">Loading offers…</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && packages.length === 0 && (
        <div className="empty-state">
          No active offers today.
          {isManager && (
            <>
              {' '}
              <Link to="/pricing">Add a package on Pricing</Link>
            </>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
          marginTop: 8,
        }}
      >
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="card"
            style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {pkg.imagePath ? (
              <img
                src={imgUrl(pkg.imagePath)}
                alt={pkg.name}
                style={{ width: '100%', height: 160, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  height: 160,
                  background: 'linear-gradient(135deg, #0B1220 0%, #C9A227 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: 1,
                }}
              >
                {pkg.packageType || 'OFFER'}
              </div>
            )}
            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <div className="card-title" style={{ margin: 0 }}>{pkg.name}</div>
                <span
                  className="badge"
                  style={{
                    background: 'rgba(201, 162, 39, 0.2)',
                    color: '#8B6914',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pkg.discountPercentage}% OFF
                </span>
              </div>
              <div className="card-meta" style={{ marginTop: 8 }}>
                {lotName(pkg.parkingLotId)}
                <br />
                {pkg.packageType} · {pkg.startDate} → {pkg.endDate}
              </div>
              {pkg.description && (
                <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '10px 0 0' }}>
                  {pkg.description}
                </p>
              )}
              <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Customer: book */}
                {isCustomer && (
                  <Link
                    to={user ? '/reservations' : '/login'}
                    state={user ? { preselectLotId: pkg.parkingLotId } : { from: '/offers' }}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', textAlign: 'center', display: 'inline-block' }}
                  >
                    {user ? 'Book this lot' : 'Log in to book'}
                  </Link>
                )}

                {/* Lot Admin / System Admin: manage */}
                {isManager && (
                  <>
                    <Link
                      to="/pricing"
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', textAlign: 'center', display: 'inline-block' }}
                    >
                      Modify on Pricing
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ width: '100%' }}
                      disabled={busyId === pkg.id}
                      onClick={() => handleDeactivate(pkg.id)}
                    >
                      {busyId === pkg.id ? 'Deactivating…' : 'Deactivate offer'}
                    </button>
                  </>
                )}

                {/* Attendant / other staff: view only */}
                {user && !isCustomer && !isManager && (
                  <div className="card-meta" style={{ textAlign: 'center' }}>
                    View only — customers use this to book
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
