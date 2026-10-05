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
  step1: '/step1.jpg',
  step2: '/step2.jpg',
  step3: '/step3.jpg',
  why1: '/why1.jpg',
  why2: '/why2.jpg',
  why3: '/why3.jpg',
};

/** Larger line icons for benefit / stat cards */
const IconSearch = () => (
  <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
const IconCard = () => (
  <svg viewBox="0 0 24 24" aria-hidden><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M6 15h4" /></svg>
);
const IconTicket = () => (
  <svg viewBox="0 0 24 24" aria-hidden><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" /><path d="M12 6v12" /></svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24" aria-hidden><path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
);
const IconBuilding = () => (
  <svg viewBox="0 0 24 24" aria-hidden><path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" /><path d="M14 10h5a1 1 0 0 1 1 1v10" /><path d="M8 8h2M8 12h2M8 16h2M16 14h2M16 18h2" /></svg>
);
const IconParking = () => (
  <svg viewBox="0 0 24 24" aria-hidden><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 17V7h4.5a3.5 3.5 0 0 1 0 7H9" /></svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" aria-hidden><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
const IconUser = () => (
  <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
const IconBook = () => (
  <svg viewBox="0 0 24 24" aria-hidden><path d="M4 5a2 2 0 0 1 2-2h11v18H6a2 2 0 0 0-2 2V5z" /><path d="M17 3v18" /></svg>
);
const IconTag = () => (
  <svg viewBox="0 0 24 24" aria-hidden><path d="M20 12l-8 8-9-9V4h7l10 8z" /><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" /></svg>
);

function getHeroCta(role) {
  switch (role) {
    case 'ATTENDANT': return { label: 'Open Check-in Desk', to: '/tickets' };
    case 'LOT_ADMIN': return { label: 'Manage Lots', to: '/lots' };
    case 'SYSTEM_ADMIN': return { label: 'Manage Staff', to: '/staff' };
    case 'CUSTOMER': return { label: 'Find a Parking Slot', to: '/reservations' };
    default: return { label: 'Find a Parking Slot', to: '/login' };
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
  const [videoOk, setVideoOk] = useState(true);

  useEffect(() => {
    const load = () => getPublicStats().then((r) => setStats(r.data)).catch(() => setStats(null));
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const statDefs = [
    { key: 'totalLots', label: 'Parking Lots', detail: 'Active locations on the platform', icon: <IconBuilding /> },
    { key: 'totalSlots', label: 'Parking slots', detail: 'Spaces across all lots', icon: <IconParking /> },
    { key: 'totalReservations', label: 'Reservations', detail: 'Total bookings recorded', icon: <IconCalendar /> },
    { key: 'totalCustomers', label: 'Registered drivers', detail: 'Customer accounts', icon: <IconUser /> },
  ];

  const customerBenefits = [
    { icon: <IconSearch />, title: 'Search & reserve early', desc: 'Pick a lot and time before you leave — lock a slot in seconds.' },
    { icon: <IconCard />, title: 'Pay online, no surprises', desc: 'Peak rates and discounts calculated up front. Clear total before you confirm.' },
    { icon: <IconTicket />, title: 'Digital e-ticket', desc: 'Show your ticket on arrival. Staff check you in and out with timestamps.' },
    { icon: <IconBell />, title: 'Alerts & reviews', desc: 'Payment reminders, time-over notices, and rate lots after your visit.' },
  ];

  const operatorBenefits = [
    { icon: <IconBook />, title: 'Reservation oversight', desc: 'See bookings by lot and help customers change time or slot.', to: '/reservations', show: canManageReservations },
    { icon: <IconBuilding />, title: 'Lot & slot control', desc: 'Open, maintain, or free spaces as the day changes.', to: '/lots', show: canSeeLots },
    { icon: <IconTag />, title: 'Dynamic pricing', desc: 'Base, peak, discounts, and special packages in one place.', to: '/pricing', show: canSeePricing },
    { icon: <IconTicket />, title: 'Check-in desk', desc: 'Confirm arrivals, complete exits, and handle walk-ins.', to: '/tickets', show: canSeeTickets },
  ];

  const steps = [
    { n: '1', title: 'Search & reserve', desc: 'Choose a lot and time window. Your slot is held while you pay.', img: IMG.step1 },
    { n: '2', title: 'Pay online', desc: 'Transparent total with peak rates and packages applied automatically.', img: IMG.step2 },
    { n: '3', title: 'Check in & out', desc: 'Digital ticket on arrival. Attendants log entry and exit.', img: IMG.step3 },
  ];

  const whyDrivers = [
    {
      title: 'Reserve before you leave',
      desc: 'See real availability and lock a space on your phone — no more circling the block.',
      img: IMG.why1,
    },
    {
      title: 'Clear prices & special offers',
      desc: 'Peak rates, discounts, and festival packages shown up front. Pay online in one step.',
      img: IMG.why2,
    },
    {
      title: 'Digital ticket on arrival',
      desc: 'Show your e-ticket at the gate. Staff check you in and out with exact timestamps.',
      img: IMG.why3,
    },
  ];

  const visibleOps = user
    ? operatorBenefits.filter((b) => b.show(user.role))
    : [];

  return (
    <div className="lp">
      <section className="lp-hero">
        {videoOk ? (
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoOk(false)}
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
        ) : (
          <div className="lp-hero-bg lp-hero-bg-fallback" />
        )}
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

      <section className="lp-section lp-section-alt">
        <div className="lp-section-head">
          <h2>Why drivers choose ParkSync</h2>
          <p>Built for real city parking — less stress, more certainty before you arrive.</p>
        </div>
        <div className="lp-steps-premium">
          {whyDrivers.map((s, i) => (
            <div className="lp-step-premium" key={s.title}>
              <div className="lp-step-img-wrap">
                <img src={s.img} alt={s.title} className="lp-step-img" loading="lazy" />
                <span className="lp-step-n">{i + 1}</span>
              </div>
              <div className="lp-step-premium-body">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <h2>Built for drivers</h2>
          <p>Everything you need from search to exit — clear, fast, and paperless.</p>
        </div>
        <div className="lp-benefit-grid">
          {customerBenefits.map((b) => (
            <div className="lp-benefit" key={b.title}>
              <div className="lp-benefit-icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <h2>Platform at a glance</h2>
          <p>Live totals across lots, slots, bookings, and drivers.</p>
        </div>
        <div className="lp-stat-cards">
          {statDefs.map((s) => (
            <div className="lp-stat-card" key={s.key}>
              <div className="lp-stat-card-icon">{s.icon}</div>
              <div className="lp-stats-strip-num">{fmt(stats?.[s.key])}</div>
              <div className="lp-stats-strip-label">{s.label}</div>
              <div className="lp-stats-strip-detail">{s.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-section-alt">
        <div className="lp-section-head">
          <h2>How it works</h2>
          <p>Three clear steps. No paper tickets.</p>
        </div>
        <div className="lp-steps-premium">
          {steps.map((s) => (
            <div className="lp-step-premium" key={s.n}>
              <div className="lp-step-img-wrap">
                <img src={s.img} alt={s.title} className="lp-step-img" loading="lazy" />
                <span className="lp-step-n">{s.n}</span>
              </div>
              <div className="lp-step-premium-body">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {visibleOps.length > 0 && (
        <section className="lp-section">
          <div className="lp-section-head">
            <h2>For operators & staff</h2>
            <p>Tools matched to your role — lots, pricing, tickets, and oversight.</p>
          </div>
          <div className="lp-benefit-grid">
            {visibleOps.map((b) => (
              <Link to={b.to} className="lp-benefit" key={b.title}>
                <div className="lp-benefit-icon">{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="lp-footer-brand">ParkSync</div>
            <div className="lp-footer-meta">
              Web-based automated parking reservation and management.
              Built for drivers and lot operators — reserve, pay, and check in digitally.
            </div>
          </div>
          <div className="lp-footer-badges">
            <span className="lp-footer-badge">Verified demo</span>
            <span className="lp-footer-badge">SE2030</span>
            <span className="lp-footer-badge">Secure booking flow</span>
          </div>
        </div>
        <div className="lp-footer-copy">
          © {new Date().getFullYear()} ParkSync · 26-MTR-SE2030-08 · All rights reserved.
        </div>
      </footer>
    </div>
  );
}
