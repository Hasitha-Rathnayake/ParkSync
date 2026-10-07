import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ReservationPage from './pages/ReservationPage';
import ParkingLotAdminPage from './pages/ParkingLotAdminPage';
import TicketPage from './pages/TicketPage';
import PaymentPage from './pages/PaymentPage';
import PricingPage from './pages/PricingPage';
import NotificationReviewPage from './pages/NotificationReviewPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ManageStaffPage from './pages/ManageStaffPage';
import MyVehiclesPage from './pages/MyVehiclesPage';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './context/AuthContext';
import {
  canSeeLots, canSeePricing, canSeeTickets, canSeeVehicles, canManageStaff,
  canSeeReservations, canManageReservations, canSeePayments, canSeeReviews,
} from './utils/roles';
import { getUnreadCount, getNotificationHistory } from './api/notificationApi';
import { getTicketsForUser } from './api/ticketApi';
import { getStoredTheme, applyTheme } from './theme';
import './App.css';

function ThemeMenu() {
  const [theme, setTheme] = useState(() => getStoredTheme());
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (t) => {
    setTheme(t);
    applyTheme(t);
    setOpen(false);
  };

  return (
    <div className="theme-menu" ref={ref}>
      <button type="button" className="theme-menu-btn" onClick={() => setOpen((o) => !o)}>
        Theme <span className="theme-menu-caret">▾</span>
      </button>
      {open && (
        <div className="theme-menu-panel">
          {['light', 'mixed', 'dark'].map((t) => (
            <button key={t} type="button" className={theme === t ? 'active' : ''} onClick={() => pick(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.id || !canSeeReviews(user.role)) {
      setUnread(0);
      return undefined;
    }
    const load = () => {
      getUnreadCount(user.id)
        .then((res) => setUnread(Number(res.data?.count ?? 0)))
        .catch(() => {
          getNotificationHistory(user.id)
            .then((res) => setUnread((res.data || []).filter((n) => !n.readFlag).length))
            .catch(() => setUnread(0));
        });
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [user?.id, user?.role]);

  if (!user || !canSeeReviews(user.role)) return null;

  return (
    <NavLink to="/reviews" className="nav-bell" title="Unread notifications">
      <span className="nav-bell-icon" aria-hidden>🔔</span>
      {unread > 0 && <span className="nav-bell-count">{unread > 9 ? '9+' : unread}</span>}
    </NavLink>
  );
}

/** Unread completed e-tickets (same localStorage key as TicketPage). */
function TicketBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.id || user.role !== 'CUSTOMER' || !canSeeTickets(user.role)) {
      setUnread(0);
      return undefined;
    }
    const load = () => {
      getTicketsForUser(user.id)
        .then((res) => {
          let meta = { read: {}, hidden: {} };
          try {
            meta = JSON.parse(localStorage.getItem('parksync_ticket_meta_' + user.id) || '{}') || meta;
          } catch { /* ignore */ }
          const read = meta.read || {};
          const hidden = meta.hidden || {};
          const n = (res.data || []).filter((d) => {
            const id = d.ticket?.id;
            const status = String(d.ticket?.status || '').toUpperCase();
            return status === 'COMPLETED' && id && !read[id] && !hidden[id];
          }).length;
          setUnread(n);
        })
        .catch(() => setUnread(0));
    };
    load();
    const id = setInterval(load, 15000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id, user?.role]);

  if (!user || user.role !== 'CUSTOMER' || !canSeeTickets(user.role)) return null;

  return (
    <NavLink to="/tickets" className="nav-bell" title="Unread e-tickets">
      <span className="nav-bell-icon" aria-hidden>🎫</span>
      {unread > 0 && <span className="nav-bell-count">{unread > 9 ? '9+' : unread}</span>}
    </NavLink>
  );
}

function NavBar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">P</span>
        ParkSync
      </Link>

      {(!user || canSeeReservations(role) || canManageReservations(role)) && (
        <NavLink to="/reservations" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Reservations
        </NavLink>
      )}
      {user && canSeeVehicles(role) && (
        <NavLink to="/vehicles" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          My Vehicles
        </NavLink>
      )}
      {/* Profile removed from left — use right-side user chip instead */}
      {user && canSeeTickets(role) && (
        <NavLink to="/tickets" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Tickets
        </NavLink>
      )}
      {user && canSeePayments(role) && (
        <NavLink to="/payments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Payments
        </NavLink>
      )}
      {user && canSeeLots(role) && (
        <NavLink to="/lots" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Lots
        </NavLink>
      )}
      {user && canSeePricing(role) && (
        <NavLink to="/pricing" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Pricing
        </NavLink>
      )}
      {user && canSeeReviews(role) && (
        <NavLink to="/reviews" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Notifications & Reviews
        </NavLink>
      )}
      {user && canManageStaff(role) && (
        <NavLink to="/staff" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Staff
        </NavLink>
      )}

      <div className="nav-spacer" />
      <ThemeMenu />
      <TicketBell />
      <NotificationBell />

      <div className="nav-user">
        {user ? (
          <>
            {/* One premium profile button — name only (all roles) */}
            <Link to="/profile" className="nav-profile-btn" title="Open profile">
              {user.fullName}
            </Link>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Log In
            </NavLink>
            <NavLink to="/register" className="btn btn-primary btn-sm">
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reservations" element={<ReservationPage />} />
        <Route path="/lots" element={<ParkingLotAdminPage />} />
        <Route path="/tickets" element={<TicketPage />} />
        <Route path="/payments" element={<PaymentPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/reviews" element={<NotificationReviewPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/staff" element={<ManageStaffPage />} />
        <Route path="/vehicles" element={<MyVehiclesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
