import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPublicStats } from '../api/statsApi';
import {
  canSeeLots, canSeePricing, canSeeTickets, canSeeVehicles, canSeePayments,
  canSeeReviews, canSeeReservations, canManageReservations,
} from '../utils/roles';

const IMG = {
  hero: 'https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=1400&h=800&fit=crop',
  step1: 'https://images.pexels.com/photos/17580916/pexels-photo-17580916/free-photo-of-empty-parking-lot.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop',
  step2: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop',
  step3: 'https://images.pexels.com/photos/5269678/pexels-photo-5269678.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop',
  strip1: 'https://images.pexels.com/photos/1756957/pexels-photo-1756957.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  strip2: 'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  strip3: 'https://images.pexels.com/photos/753876/pexels-photo-753876.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
};

const customerFeatures = [
  { to: '/reservations', title: 'Find & Reserve', desc: 'Search slots by lot and time. Book in seconds.', icon: '📅', visibleTo: canSeeReservations },
  { to: '/vehicles', title: 'My Vehicles', desc: 'Save plates for faster check-in every visit.', icon: '🚗', visibleTo: canSeeVehicles },
  { to: '/payments', title: 'Billing & Payment', desc: 'Transparent charges, refunds, overstay fees.', icon: '💳', visibleTo: canSeePayments },
  { to: '/reviews', title: 'Notifications & Reviews', desc: 'Alerts, reminders, and leave feedback.', icon: '⭐', visibleTo: canSeeReviews },
];

const operatorFeatures = [
  { to: '/reservations', title: 'Reservation Oversight', icon: '📖', visibleTo: canManageReservations },
  { to: '/lots', title: 'Lot & Slot Management', icon: '🏢', visibleTo: canSeeLots },
  { to: '/pricing', title: 'Dynamic Pricing', icon: '🏷️', visibleTo: canSeePricing },
  { to: '/tickets', title: 'Check-in / Check-out', icon: '🎫', visibleTo: canSeeTickets },
];

function getHeroCta(role) {
  switch (role) {
    case 'ATTENDANT': return { label: 'Check In a Vehicle', to: '/tickets' };
    case 'LOT_ADMIN': return { label: 'Manage Your Lots', to: '/lots' };
    case 'SYSTEM_ADMIN': return { label: 'Manage Staff', to: '/staff' };
    default: return { label: 'Find a Parking Slot', to: '/reservations' };
  }
}

function fmt(v) {
  if (v === undefined || v === null) return '—';
  return Number(v).toLocaleString();
}

export default function HomePage() {
  const { user } = useAuth();
  const heroCta = getHeroCta(user?.role);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = () => getPublicStats().then((r) => setStats(r.data)).catch(() => setStats(null));
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const visibleCustomer = user
    ? customerFeatures.filter((f) => f.visibleTo(user.role))
    : customerFeatures;
  const visibleOperator = user
    ? operatorFeatures.filter((f) => f.visibleTo(user.role))
    : operatorFeatures;

  const statItems = [
    { label: 'Parking Lots', value: stats?.totalLots },
    { label: 'Parking slots', value: stats?.totalSlots },
    { label: 'Reservations', value: stats?.totalReservations },
    { label: 'Registered drivers', value: stats?.totalCustomers },
  ];

  const steps = [
    { n: '1', title: 'Search & reserve', desc: 'Pick a lot and time window. Lock a slot before you leave home.', img: IMG.step1 },
    { n: '2', title: 'Pay online', desc: 'Peak rates and discounts applied automatically. Clear total before you confirm.', img: IMG.step2 },
    { n: '3', title: 'Check in & out', desc: 'Digital ticket on arrival. Attendants log entry and exit with timestamps.', img: IMG.step3 },
  ];

  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-hero-bg" style={{ backgroundImage: `url(${IMG.hero})` }} />
        <div className="lp-hero-shade" />
        <div className="lp-hero-inner">
          <p className="lp-eyebrow">Web-based parking reservation system</p>
          <h1 className="lp-title">
            Park smarter.<br />
            <span>Reserve before you arrive.</span>
          </h1>
          <p className="lp-lead">
            Search available slots, book in advance, pay transparently, and check in digitally —
            one platform for drivers and lot operators.
          </p>
          <div className="lp-actions">
            <Link to={heroCta.to} className="btn btn-primary btn-lg">{heroCta.label}</Link>
            {!user && (
              <Link to="/register" className="btn btn-secondary btn-lg">Create account</Link>
            )}
          </div>
        </div>
      </section>

      <section className="lp-stats">
        <div className="lp-stats-grid">
          {statItems.map((s) => (
            <div className="lp-stat" key={s.label}>
              <div className="lp-stat-num">{fmt(s.value)}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {visibleCustomer.length > 0 && (
        <section className="lp-section">
          <div className="lp-section-head">
            <h2>{user ? 'What you can do' : 'Built for drivers'}</h2>
            <p>Everything you need from search to exit — same options as the nav.</p>
          </div>
          <div className="lp-feature-grid">
            {visibleCustomer.map((f) => (
              <Link to={f.to} className="lp-feature" key={f.to}>
                <span className="lp-feature-icon">{f.icon}</span>
                <div>
                  <div className="lp-feature-title">{f.title}</div>
                  <div className="lp-feature-desc">{f.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="lp-section lp-section-alt">
        <div className="lp-section-head">
          <h2>How it works</h2>
          <p>Three steps. No paper tickets.</p>
        </div>
        <div className="lp-steps">
          {steps.map((s) => (
            <div className="lp-step" key={s.n}>
              <div className="lp-step-img-wrap">
                <img src={s.img} alt={s.title} className="lp-step-img" loading="lazy" />
                <span className="lp-step-n">{s.n}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-photo-strip">
        <img src={IMG.strip1} alt="Parking lot" loading="lazy" />
        <img src={IMG.strip2} alt="City parking" loading="lazy" />
        <img src={IMG.strip3} alt="Garage" loading="lazy" />
      </section>

      {visibleOperator.length > 0 && (
        <section className="lp-section">
          <div className="lp-section-head">
            <h2>For operators & staff</h2>
            <p>Manage lots, pricing, tickets, and reservations from one place.</p>
          </div>
          <div className="lp-ops">
            {visibleOperator.map((f) => (
              <Link to={f.to} className="lp-op" key={f.to}>
                <span>{f.icon}</span>
                <span>{f.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
