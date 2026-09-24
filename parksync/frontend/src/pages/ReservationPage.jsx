import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLots, getSlotsForLot } from '../api/parkingLotApi';
import {
  createReservation, getReservationsForLot, getReservationsByUser,
  updateReservation, cancelReservation,
} from '../api/reservationApi';
import { getPaymentForReservation } from '../api/paymentApi';
import { getReviewsForLot, getAverageRating } from '../api/notificationApi';
import { getVehiclesForUser } from '../api/vehicleApi';
import { getUsersByRole } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { canManageReservations } from '../utils/roles';
import SearchableSelect from '../components/SearchableSelect';

// Member 1 - Slot Search & Reservation
export default function ReservationPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="page">
        <h1 className="page-title">Find & Reserve a Parking Slot</h1>
        <div className="alert alert-error">Please log in to continue.</div>
      </div>
    );
  }

  return canManageReservations(user.role)
    ? <AdminReservationOversight />
    : <CustomerBooking user={user} />;
}

// ---------- Customer view: search & book ----------
function CustomerBooking({ user }) {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState('');
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ parkingSlotId: '', vehicleId: '', startTime: '', endTime: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [myReservations, setMyReservations] = useState([]);

  const loadMyReservations = () => {
    getReservationsByUser(user.id).then((res) =>
      setMyReservations(res.data.filter((r) => r.status !== 'CANCELLED'))
    );
  };

  useEffect(() => {
    getAllLots().then((res) => setLots(res.data)).catch(() => setError('Could not load lots — is the backend running?'));
    getVehiclesForUser(user.id).then((res) => setVehicles(res.data));
    loadMyReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    if (selectedLot) {
      getSlotsForLot(selectedLot).then((res) => setSlots(res.data.filter((s) => s.status === 'AVAILABLE')));
    } else {
      setSlots([]);
    }
  }, [selectedLot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createReservation({
        userId: user.id,
        vehicleId: Number(form.vehicleId),
        parkingSlot: { id: Number(form.parkingSlotId) },
        startTime: form.startTime,
        endTime: form.endTime,
      });
      // Straight to payment - the booking is only held for 15 minutes.
      navigate(`/payments?reservationId=${res.data.id}&justBooked=1`);
    } catch (err) {
      setError(err.response?.data || 'Could not create reservation.');
    } finally {
      setLoading(false);
    }
  };

  if (vehicles.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">Find & Reserve a Parking Slot</h1>
        <div className="alert alert-error">
          You need to add a vehicle to your profile before booking a slot.{' '}
          <a href="/vehicles" style={{ color: 'var(--amber)', fontWeight: 700 }}>Add a vehicle</a>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Find & Reserve a Parking Slot</h1>
      <p className="page-subtitle">
        Booking as {user.fullName}. Once booked, you'll have <strong>15 minutes</strong> to pay before the slot is released.
      </p>

      <div className="section-label">Book a Slot</div>
      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
        <div className="form-grid">
          <div className="field">
            <label>Vehicle</label>
            <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
              <option value="">Select a vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber}{v.make ? ` — ${v.make} ${v.model || ''}`.trim() : ''}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Parking Lot</label>
            <select value={selectedLot} onChange={(e) => setSelectedLot(e.target.value)} required>
              <option value="">Select a lot…</option>
              {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Available Slot</label>
            <select value={form.parkingSlotId} onChange={(e) => setForm({ ...form, parkingSlotId: e.target.value })} required disabled={!selectedLot}>
              <option value="">{selectedLot ? 'Select a slot…' : 'Choose a lot first'}</option>
              {slots.map((s) => <option key={s.id} value={s.id}>{s.slotCode}{s.floor ? ` — Floor ${s.floor}` : ''}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Start Time</label>
            <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
          </div>
          <div className="field">
            <label>End Time</label>
            <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Booking…' : 'Reserve Slot & Continue to Payment'}
        </button>
      </form>

      <div className="section-label">Your Reservations</div>
      {myReservations.length === 0 && <div className="empty-state">You don't have any active reservations yet.</div>}
      {myReservations.map((r) => (
        <MyReservationRow key={r.id} reservation={r} onChanged={loadMyReservations} />
      ))}

      <div className="section-label">Parking Lots & Reviews</div>
      {lots.length === 0 && <div className="empty-state">No lots available yet — check back soon.</div>}
      {lots.map((lot) => (
        <LotWithReviews key={lot.id} lot={lot} />
      ))}
    </div>
  );
}

// One reservation row with inline Edit (time + optional change slot) + Cancel.
// Kept separate so each row's editing state doesn't affect the others.
function MyReservationRow({ reservation, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [startTime, setStartTime] = useState(reservation.startTime?.slice(0, 16) || '');
  const [endTime, setEndTime] = useState(reservation.endTime?.slice(0, 16) || '');
  const [editLotId, setEditLotId] = useState('');
  const [editSlots, setEditSlots] = useState([]);
  const [editSlotId, setEditSlotId] = useState(reservation.parkingSlot?.id ? String(reservation.parkingSlot.id) : '');
  const [lots, setLots] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const statusBadge = (status) => <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;

  // Load lots when entering edit mode so the customer can pick another slot.
  useEffect(() => {
    if (!editing) return;
    getAllLots().then((res) => setLots(res.data)).catch(() => {});
  }, [editing]);

  useEffect(() => {
    if (!editLotId) {
      setEditSlots([]);
      return;
    }
    getSlotsForLot(editLotId).then((res) => {
      // Show AVAILABLE slots, plus the reservation's current slot if it's in this lot
      // (so the user can keep the same slot while only changing time).
      const currentId = reservation.parkingSlot?.id;
      const available = res.data.filter(
        (s) => s.status === 'AVAILABLE' || s.id === currentId
      );
      setEditSlots(available);
    }).catch(() => setEditSlots([]));
  }, [editLotId, reservation.parkingSlot?.id]);

  const openEdit = () => {
    setStartTime(reservation.startTime?.slice(0, 16) || '');
    setEndTime(reservation.endTime?.slice(0, 16) || '');
    setEditSlotId(reservation.parkingSlot?.id ? String(reservation.parkingSlot.id) : '');
    setEditLotId(''); // user picks lot if they want to change slot
    setError('');
    setNotice('');
    setEditing(true);
  };

  const showPaymentChange = async (reservationId, verb) => {
    try {
      const res = await getPaymentForReservation(reservationId);
      if (res.data) {
        if (verb === 'edit') {
          setNotice(`Updated. New total: Rs. ${res.data.amount}.`);
        } else {
          setNotice(
            res.data.refundAmount > 0
              ? `Cancelled. Refunded Rs. ${res.data.refundAmount}.`
              : 'Cancelled. No refund was due (cancellation fee applied, or nothing had been paid).'
          );
        }
      } else if (verb === 'edit') {
        setNotice('Reservation updated (not paid yet — no charge change).');
      }
    } catch {
      if (verb === 'edit') setNotice('Reservation updated.');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // Only send parkingSlotId when the user picked a different slot.
      const currentSlotId = reservation.parkingSlot?.id;
      const chosenSlotId = editSlotId ? Number(editSlotId) : null;
      const slotChanged = chosenSlotId != null && chosenSlotId !== currentSlotId;
      await updateReservation(
        reservation.id,
        startTime,
        endTime,
        slotChanged ? chosenSlotId : null
      );
      await showPaymentChange(reservation.id, 'edit');
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err.response?.data || 'Could not update reservation.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      await cancelReservation(reservation.id);
      await showPaymentChange(reservation.id, 'cancel');
      onChanged();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || 'Could not cancel reservation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="card-row">
        <div>
          <div className="card-title">
            Reservation #{reservation.id} — Slot {reservation.parkingSlot?.slotCode}
          </div>
          <div className="card-meta">
            {new Date(reservation.startTime).toLocaleString()} → {new Date(reservation.endTime).toLocaleString()}
          </div>
        </div>
        {statusBadge(reservation.status)}
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
      {notice && <div className="alert alert-success" style={{ marginTop: 12 }}>{notice}</div>}

      {!editing ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={openEdit} disabled={busy}>
            Edit Time / Change Slot
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={busy}>
            {reservation.status === 'CONFIRMED' ? 'Cancel (fee may apply)' : 'Cancel'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSaveEdit} style={{ marginTop: 14 }}>
          <div className="form-grid" style={{ marginBottom: 12 }}>
            <div className="field">
              <label>New Start Time</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="field">
              <label>New End Time</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
            <div className="field">
              <label>Change to Lot (optional)</label>
              <select
                value={editLotId}
                onChange={(e) => {
                  setEditLotId(e.target.value);
                  setEditSlotId('');
                }}
              >
                <option value="">Keep current slot — or pick a lot…</option>
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>{lot.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>New Slot</label>
              <select
                value={editSlotId}
                onChange={(e) => setEditSlotId(e.target.value)}
                disabled={!editLotId}
              >
                <option value="">
                  {editLotId ? 'Select a slot…' : 'Pick a lot first (or leave blank to keep current)'}
                </option>
                {editSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.slotCode}{s.floor ? ` — Floor ${s.floor}` : ''}
                    {s.id === reservation.parkingSlot?.id ? ' (current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="card-meta" style={{ marginBottom: 10 }}>
            Leave lot/slot blank to only change the time. Changing to another lot updates the charge if already paid.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(false)} disabled={busy}>
              Cancel Edit
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


function LotWithReviews({ lot }) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(null);
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const load = async () => {
    if (!open) {
      const [r, a] = await Promise.all([getReviewsForLot(lot.id), getAverageRating(lot.id)]);
      setReviews(r.data || []);
      setAvg(a.data);
    }
    setOpen(!open);
  };

  return (
    <div className="card">
      <div className="card-row">
        <div>
          <div className="card-title">{lot.name}</div>
          <div className="card-meta">{lot.address} · Capacity: {lot.totalCapacity}</div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={load}>
          {open ? 'Hide reviews' : 'Show reviews'}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          {avg != null && avg > 0 && (
            <div className="card-meta" style={{ marginBottom: 8 }}>
              Average: <span className="stars">{stars(Math.round(avg))}</span> ({Number(avg).toFixed(1)})
            </div>
          )}
          {reviews.length === 0 && <div className="empty-state">No reviews for this lot yet.</div>}
          {reviews.filter((r) => !r.flaggedAsSpam).map((r) => (
            <div key={r.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
              <div className="stars">{stars(r.rating)}</div>
              <div className="card-meta">{r.comment || '(no comment)'}</div>
              {r.adminResponse && (
                <div className="card-meta" style={{ fontStyle: 'italic' }}>Admin: {r.adminResponse}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Admin view: reservation oversight ----------
function AdminReservationOversight() {
  const [lots, setLots] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [lotId, setLotId] = useState('');
  const [userId, setUserId] = useState('');
  const [reservations, setReservations] = useState([]);
  const [lookupMode, setLookupMode] = useState(''); // 'lot' | 'user'

  useEffect(() => {
    getAllLots().then((res) => setLots(res.data));
    getUsersByRole('CUSTOMER').then((res) => setCustomers(res.data));
  }, []);

  const lotOptions = lots.map((l) => ({ value: l.id, label: l.name, sublabel: l.address }));
  const customerOptions = customers.map((c) => ({ value: c.id, label: c.fullName, sublabel: c.email }));

  const loadByLot = async (id) => {
    setLotId(id);
    const res = await getReservationsForLot(id);
    setReservations(res.data);
    setLookupMode('lot');
  };

  const loadByUser = async (id) => {
    setUserId(id);
    const res = await getReservationsByUser(id);
    setReservations(res.data);
    setLookupMode('user');
  };

  const statusBadge = (status) => <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;

  return (
    <div className="page">
      <h1 className="page-title">Reservation Oversight</h1>
      <p className="page-subtitle">Admin view — search by lot or by customer to see bookings.</p>

      <div className="section-label">By Parking Lot</div>
      <div className="form-card">
        <div className="field">
          <label>Search for a lot by name</label>
          <SearchableSelect options={lotOptions} value={lotId} onSelect={loadByLot} placeholder="Start typing a lot name…" />
        </div>
      </div>

      <div className="section-label">By Customer</div>
      <div className="form-card">
        <div className="field">
          <label>Search for a customer by name or email</label>
          <SearchableSelect options={customerOptions} value={userId} onSelect={loadByUser} placeholder="Start typing a name or email…" />
        </div>
      </div>

      <div className="section-label">
        {lookupMode === 'lot' && 'Bookings for This Lot'}
        {lookupMode === 'user' && "This Customer's Bookings"}
        {!lookupMode && 'Results'}
      </div>
      {reservations.length === 0 && <div className="empty-state">No results yet — search above.</div>}
      {reservations.map((r) => (
        <div className="card" key={r.id}>
          <div className="card-row">
            <div>
              <div className="card-title">Reservation #{r.id} — Slot {r.parkingSlot?.slotCode}</div>
              <div className="card-meta">
                {new Date(r.startTime).toLocaleString()} → {new Date(r.endTime).toLocaleString()}
              </div>
            </div>
            {statusBadge(r.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
