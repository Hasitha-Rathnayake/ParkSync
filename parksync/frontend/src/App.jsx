import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
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
import OffersPage from './pages/OffersPage';
import { useAuth } from './context/AuthContext';
import {
  canSeeLots, canSeePricing, canSeeTickets, canSeeVehicles, canManageStaff,
  canSeeReservations, canManageReservations, canSeePayments, canSeeReviews,
} from './utils/roles';
import { getNotificationHistory } from './api/notificationApi';
import { getStoredTheme, applyTheme } from './theme';
import './App.css';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

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
        Theme
        <span className="theme-menu-caret">▾</span>
      </button>
      {open && (
        <div className="theme-menu-panel">
          {['light', 'mixed', 'dark'].map((t) => (
            <button
              key={t}
              type="button"
              className={theme === t ? 'active' : ''}
              onClick={() => pick(t)}
            >
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
    if (!user?.id) { setUnread(0); return; }
    const load = () => {
      getNotificationHistory(user.id)
        .then((res) => {
          const list = res.data || [];
          setUnread(list.filter((n) => !n.readFlag).length);
        })
        .catch(() => setUnread(0));
    };
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [user?.id]);

  if (!user || !canSeeReviews(user.role)) return null;

  return (
    <NavLink to="/reviews" className="nav-bell" title="Notifications">
      <span className="nav-bell-icon" aria-hidden>🔔</span>
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

      <NavLink to="/offers" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
        Offers
      </NavLink>
      {user && (canSeeReservations(role) || canManageReservations(role)) && (
        <NavLink to="/reservations" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Reservations
        </NavLink>
      )}
      {user && canSeeVehicles(role) && (
        <NavLink to="/vehicles" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          My Vehicles
        </NavLink>
      )}
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
      <NotificationBell />

      <div className="nav-user">
        {user ? (
          <>
            <span>
              {user.fullName}{' '}
              <span className="badge badge-pending" style={{ marginLeft: 4 }}>{user.role}</span>
            </span>
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reservations" element={<RequireAuth><ReservationPage /></RequireAuth>} />
        <Route path="/lots" element={<RequireAuth><ParkingLotAdminPage /></RequireAuth>} />
        <Route path="/tickets" element={<RequireAuth><TicketPage /></RequireAuth>} />
        <Route path="/payments" element={<RequireAuth><PaymentPage /></RequireAuth>} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/pricing" element={<RequireAuth><PricingPage /></RequireAuth>} />
        <Route path="/reviews" element={<RequireAuth><NotificationReviewPage /></RequireAuth>} />
        <Route path="/staff" element={<RequireAuth><ManageStaffPage /></RequireAuth>} />
        <Route path="/vehicles" element={<RequireAuth><MyVehiclesPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}
