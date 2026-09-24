// Single source of truth for "who can see what" in the UI.
// Used by both App.jsx (navbar) and HomePage.jsx (feature cards).

export const canSeeLots = (role) => role === 'LOT_ADMIN' || role === 'SYSTEM_ADMIN';
// Attendant operates tickets; customer views their e-tickets; system admin full access
export const canSeeTickets = (role) =>
  role === 'ATTENDANT' || role === 'SYSTEM_ADMIN' || role === 'CUSTOMER';
export const canOperateTickets = (role) => role === 'ATTENDANT' || role === 'SYSTEM_ADMIN';
export const canSeeVehicles = (role) => role === 'CUSTOMER';
export const canManageStaff = (role) => role === 'SYSTEM_ADMIN';

export const canSeeReservations = (role) => role === 'CUSTOMER';
export const canManageReservations = (role) => role === 'LOT_ADMIN' || role === 'SYSTEM_ADMIN';

export const canManagePayments = (role) => role === 'SYSTEM_ADMIN';
export const canSeePayments = (role) => role === 'CUSTOMER' || canManagePayments(role);

export const canManageReviews = (role) => role === 'LOT_ADMIN' || role === 'SYSTEM_ADMIN';
export const canSeeReviews = (role) => role === 'CUSTOMER' || canManageReviews(role);

// Pricing: Lot Admin sets rates for their lots; System Admin can also manage.
export const canSeePricing = (role) => role === 'LOT_ADMIN' || role === 'SYSTEM_ADMIN';
