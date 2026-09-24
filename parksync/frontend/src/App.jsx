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
import { useAuth } from './context/AuthContext';
import { canSeeLots, canSeePricing, canSeeTickets, canSeeVehicles, canManageStaff, canSeeReservations, canManageReservations, canSeePayments, canSeeReviews } from './utils/roles';
import './App.css';

// See src/utils/roles.js for the role-visibility rules (shared with HomePage).

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
      <Link to="/" className="brand">ParkSync</Link>
      {(!user || canSeeReservations(role) || canManageReservations(role)) && (
        <NavLink to="/reservations" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Reservations
        </NavLink>
      )}
      {canSeeVehicles(role) && (
        <NavLink to="/vehicles" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          My Vehicles
        </NavLink>
      )}
      {(!user || canSeeTickets(role)) && (
        <NavLink to="/tickets" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Tickets
        </NavLink>
      )}
      {(!user || canSeePayments(role)) && (
        <NavLink to="/payments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Payments
        </NavLink>
      )}
      {(!user || canSeeLots(role)) && (
        <NavLink to="/lots" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Lots
        </NavLink>
      )}
      {(!user || canSeePricing(role)) && (
        <NavLink to="/pricing" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Pricing
        </NavLink>
      )}
      {(!user || canSeeReviews(role)) && (
        <NavLink to="/reviews" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Notifications & Reviews
        </NavLink>
      )}
      {canManageStaff(role) && (
        <NavLink to="/staff" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Manage Staff
        </NavLink>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {user ? (
          <>
            <span style={{ fontSize: 13, color: 'var(--steel-light)' }}>
              {user.fullName} <span className="badge badge-pending" style={{ marginLeft: 6 }}>{user.role}</span>
            </span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Log In</NavLink>
            <NavLink to="/register" className="btn btn-primary btn-sm">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
