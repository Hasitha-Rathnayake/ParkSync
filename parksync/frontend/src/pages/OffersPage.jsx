import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllAvailablePackages, deactivatePackage } from '../api/packageApi';
import { getAllLots } from '../api/parkingLotApi';
import { useAuth } from '../context/AuthContext';
import { canSeePricing } from '../utils/roles';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api')
  .replace(/\/api\/?$/, '');
const imgUrl = (path) =>
  path ? (path.startsWith('http') ? path : `${API_ORIGIN}/uploads/${path}`) : null;

function offerStatus(pkg) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(pkg.startDate + 'T00:00:00');
  const end = new Date(pkg.endDate + 'T00:00:00');
  if (today < start) return { label: 'Upcoming', tone: 'upcoming' };
  if (today > end) return { label: 'Ended', tone: 'ended' };
  return { label: 'Active now', tone: 'now' };
}

export default function OffersPage() {
  const { user } = useAuth();
  const role = user?.role;
  const isCustomer = !user || role === 'CUSTOMER';
  const isManager = user && canSeePricing(role);
  const [packages, setPackages] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getAllAvailablePackages().then((r) => r.data || []).catch(() => []),
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
        All active deals — running now and upcoming. Discount applies automatically when you book
        a slot at that lot for a date inside the highlighted period. Applies to available slots at the lot.
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
          No active offers yet.
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
        {packages.map((pkg) => {
          const status = offerStatus(pkg);
          return (
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
                  {pkg.packageType} · all available slots at this lot
                </div>

                {/* Period highlighting */}
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: status.tone === 'now'
                      ? 'rgba(201, 162, 39, 0.18)'
                      : status.tone === 'upcoming'
                        ? 'rgba(59, 130, 246, 0.12)'
                        : 'rgba(148, 163, 184, 0.2)',
                    border: status.tone === 'now'
                      ? '1px solid rgba(201, 162, 39, 0.45)'
                      : '1px solid transparent',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--navy)' }}>
                    {status.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
                    {pkg.startDate} → {pkg.endDate}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Book any available slot at this lot with a start date inside this period
                  </div>
                </div>

                {pkg.description && (
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '10px 0 0' }}>
                    {pkg.description}
                  </p>
                )}

                <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                  {user && !isCustomer && !isManager && (
                    <div className="card-meta" style={{ textAlign: 'center' }}>
                      View only — customers use this to book
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
