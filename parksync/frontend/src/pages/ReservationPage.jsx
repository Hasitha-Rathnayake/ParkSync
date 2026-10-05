import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLots, getSlotsForLot, getLotPhotos } from '../api/parkingLotApi';
import {
  createReservation, getReservationsForLot, getReservationsByUser,
  updateReservation, cancelReservation,
} from '../api/reservationApi';
import { getPaymentForReservation } from '../api/paymentApi';
import { getRulesForLot } from '../api/pricingApi';
import { getActivePackages } from '../api/packageApi';
import { getVehiclesForUser } from '../api/vehicleApi';
import { getUsersByRole } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { canManageReservations } from '../utils/roles';
import SearchableSelect from '../components/SearchableSelect';

const API_ORIGIN = 'http://localhost:8080';
const lotPhotoUrl = (imagePath) =>
  imagePath ? (imagePath.startsWith('http') ? imagePath : `${API_ORIGIN}/uploads/${imagePath}`) : null;

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
  const [lotPricing, setLotPricing] = useState(null); // active pricing rule for selected lot
  const [pricingLoading, setPricingLoading] = useState(false);
  const [lotPricingMap, setLotPricingMap] = useState({}); // lotId -> active rule (for list)
  const [lotPhotos, setLotPhotos] = useState([]); // photos for selected lot
  const [photoIndex, setPhotoIndex] = useState(0);
  const [activePackages, setActivePackages] = useState([]);

  const loadMyReservations = () => {
    getReservationsByUser(user.id).then((res) =>
      setMyReservations(res.data.filter((r) => r.status !== 'CANCELLED'))
    );
  };

  useEffect(() => {
    getAllLots()
      .then(async (res) => {
        const list = res.data || [];
        setLots(list);
        // Load active pricing for every lot (for the lot list cards)
        const map = {};
        await Promise.all(
          list.map(async (lot) => {
            try {
              const pr = await getRulesForLot(lot.id);
              const rules = pr.data || [];
              if (rules.length > 0) map[lot.id] = rules[0];
            } catch {
              /* ignore */
            }
          })
        );
        setLotPricingMap(map);
      })
      .catch(() => setError('Could not load lots — is the backend running?'));
    getVehiclesForUser(user.id).then((res) => setVehicles(res.data));
    loadMyReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    if (selectedLot) {
      getSlotsForLot(selectedLot).then((res) => setSlots(res.data.filter((s) => s.status === 'AVAILABLE')));
      setForm((f) => ({ ...f, parkingSlotId: '' }));
      setPricingLoading(true);
      setLotPricing(null);
      setLotPhotos([]);
      setPhotoIndex(0);
      getRulesForLot(selectedLot)
        .then((res) => {
          const rules = res.data || [];
          setLotPricing(rules.length > 0 ? rules[0] : null);
        })
        .catch(() => setLotPricing(null))
        .finally(() => setPricingLoading(false));
      getLotPhotos(selectedLot)
        .then((res) => setLotPhotos(res.data || []))
        .catch(() => setLotPhotos([]));
      getActivePackages(selectedLot)
        .then((res) => setActivePackages(res.data || []))
        .catch(() => setActivePackages([]));
    } else {
      setSlots([]);
      setLotPricing(null);
      setLotPhotos([]);
      setActivePackages([]);
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

        
        {selectedLot && lotPhotos.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--navy)' }}>
              Lot photos ({lotPhotos.length})
            </div>
            <div style={{ position: 'relative', maxWidth: 520 }}>
              <img
                src={lotPhotoUrl(lotPhotos[Math.min(photoIndex, lotPhotos.length - 1)]?.filePath)}
                alt="Lot"
                style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }}
              />
              {lotPhotos.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, gap: 8 }}>
                  <button type="button" className="btn btn-secondary btn-sm"
                    onClick={() => setPhotoIndex((i) => (i - 1 + lotPhotos.length) % lotPhotos.length)}>
                    ← Prev
                  </button>
                  <span className="card-meta">{photoIndex + 1} / {lotPhotos.length}</span>
                  <button type="button" className="btn btn-secondary btn-sm"
                    onClick={() => setPhotoIndex((i) => (i + 1) % lotPhotos.length)}>
                    Next →
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {lotPhotos.map((ph, i) => (
                  <img
                    key={ph.id}
                    src={lotPhotoUrl(ph.filePath)}
                    alt=""
                    onClick={() => setPhotoIndex(i)}
                    style={{
                      width: 56, height: 42, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
                      border: i === photoIndex ? '2px solid #F59E0B' : '1px solid var(--border)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lot pricing details — peak vs normal (Madam request) */}
        {selectedLot && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: '#F8FAFC',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--navy)' }}>
              Pricing for this lot
            </div>
            {pricingLoading && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading rates…</div>
            )}
            {!pricingLoading && !lotPricing && (
              <div className="alert alert-error" style={{ marginBottom: 0 }}>
                No active pricing rule for this lot yet. You can still reserve, but payment will fail until the lot admin sets rates.
              </div>
            )}
            {!pricingLoading && lotPricing && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 13.5 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Normal rate</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--navy)' }}>Rs. {lotPricing.baseRatePerHour}<span style={{ fontSize: 12, fontWeight: 600 }}>/hr</span></div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Peak rate</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--amber-dark)' }}>Rs. {lotPricing.peakRatePerHour}<span style={{ fontSize: 12, fontWeight: 600 }}>/hr</span></div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Peak hours</div>
                  <div style={{ fontWeight: 700, color: 'var(--navy)' }}>
                    {String(lotPricing.peakStartHour).padStart(2, '0')}:00 – {String(lotPricing.peakEndHour).padStart(2, '0')}:00
                  </div>
                </div>
                {lotPricing.discountCode && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Discount code</div>
                    <div style={{ fontWeight: 700 }}>{lotPricing.discountCode} ({lotPricing.discountPercentage}% off)</div>
                  </div>
                )}
              </div>
            )}
            {!pricingLoading && lotPricing && (
              <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                Peak rate applies when your booking <strong>start time</strong> falls inside peak hours. Final amount is calculated at payment.
              </p>
            )}
          </div>
        )}

        {selectedLot && activePackages.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--navy)' }}>Active special packages</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {activePackages.map((pkg) => (
                <div key={pkg.id} className="card" style={{ width: 200, padding: 0, overflow: 'hidden' }}>
                  {pkg.imagePath ? (
                    <img src={lotPhotoUrl(pkg.imagePath)} alt=""
                      style={{ width: '100%', height: 90, objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: 90, background: '#1e3a5f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                      {pkg.packageType}
                    </div>
                  )}
                  <div style={{ padding: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{pkg.name}</div>
                    <div className="card-meta">{pkg.discountPercentage}% off · until {pkg.endDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Booking…' : 'Reserve Slot & Continue to Payment'}
        </button>
      </form>

      <div className="section-label">Your Reservations</div>
      {myReservations.length === 0 && <div className="empty-state">You don't have any active reservations yet.</div>}
      {myReservations.map((r) => (
        <MyReservationRow key={r.id} reservation={r} onChanged={loadMyReservations} />
      ))}

      <div className="section-label">Parking Lots</div>
      {lots.length === 0 && <div className="empty-state">No lots available yet — check back soon.</div>}
      {lots.map((lot) => {
        const rule = lotPricingMap[lot.id];
        return (
          <div className="card" key={lot.id}>
            <div className="card-row">
              <div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {lot.imagePath && (
                    <img
                      src={lotPhotoUrl(lot.imagePath)}
                      alt=""
                      style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8 }}
                    />
                  )}
                  <div>
                    <div className="card-title">{lot.name}</div>
                    <div className="card-meta">{lot.address} · Capacity: {lot.totalCapacity}</div>
                  </div>
                </div>
                {rule ? (
                  <div className="card-meta" style={{ marginTop: 8 }}>
                    <strong>Normal</strong> Rs.{rule.baseRatePerHour}/hr
                    {' · '}
                    <strong style={{ color: 'var(--amber-dark)' }}>Peak</strong> Rs.{rule.peakRatePerHour}/hr
                    {' · '}
                    Peak hours {String(rule.peakStartHour).padStart(2, '0')}:00–{String(rule.peakEndHour).padStart(2, '0')}:00
                    {rule.discountCode
                      ? ` · Code ${rule.discountCode} (${rule.discountPercentage}% off)`
                      : ''}
                  </div>
                ) : (
                  <div className="card-meta" style={{ marginTop: 8, color: 'var(--text-muted)' }}>
                    Pricing not set yet
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedLot(String(lot.id));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Select lot
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// One reservation row: edit time and/or slot + cancel.
function MyReservationRow({ reservation, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [startTime, setStartTime] = useState(reservation.startTime?.slice(0, 16) || '');
  const [endTime, setEndTime] = useState(reservation.endTime?.slice(0, 16) || '');
  const [slotId, setSlotId] = useState(reservation.parkingSlot?.id || '');
  const [lotSlots, setLotSlots] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const statusBadge = (status) => <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;

  const openEdit = async () => {
    setEditing(true);
    setError('');
    setNotice('');
    setStartTime(reservation.startTime?.slice(0, 16) || '');
    setEndTime(reservation.endTime?.slice(0, 16) || '');
    setSlotId(reservation.parkingSlot?.id || '');
    const lotId = reservation.parkingSlot?.parkingLot?.id;
    if (lotId) {
      try {
        const res = await getSlotsForLot(lotId);
        // Show available slots + current slot (even if occupied by this booking)
        const list = (res.data || []).filter(
          (s) => s.status === 'AVAILABLE' || s.id === reservation.parkingSlot?.id
        );
        setLotSlots(list);
      } catch {
        setLotSlots(reservation.parkingSlot ? [reservation.parkingSlot] : []);
      }
    }
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
        setNotice('Reservation updated.');
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
      await updateReservation(reservation.id, startTime, endTime, slotId || null);
      await showPaymentChange(reservation.id, 'edit');
      setEditing(false);
      onChanged();
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === 'string' ? msg : msg?.error || 'Could not update reservation.');
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
      setError(err.response?.data?.error || 'Could not cancel reservation.');
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
            {reservation.parkingSlot?.parkingLot?.name
              ? ` · ${reservation.parkingSlot.parkingLot.name}`
              : ''}
          </div>
        </div>
        {statusBadge(reservation.status)}
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
      {notice && <div className="alert alert-success" style={{ marginTop: 12 }}>{notice}</div>}

      {!editing ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={openEdit} disabled={busy}>
            Edit time / slot
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={busy}>
            {reservation.status === 'CONFIRMED' ? 'Cancel (fee may apply)' : 'Cancel'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSaveEdit} style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field">
            <label>Slot (same lot)</label>
            <select value={slotId} onChange={(e) => setSlotId(e.target.value)} required>
              {lotSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.slotCode}{s.floor ? ` · Floor ${s.floor}` : ''}
                  {s.id === reservation.parkingSlot?.id ? ' (current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>New start time</label>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
          <div className="field">
            <label>New end time</label>
            <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(false)} disabled={busy}>Cancel edit</button>
        </form>
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
