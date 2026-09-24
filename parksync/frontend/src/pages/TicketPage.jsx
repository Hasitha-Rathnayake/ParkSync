import { useState, useEffect } from 'react';
import {
  getEligibleReservations, checkInByReservation, checkIn, getActiveTickets, getTicketHistory,
  getTicketsForUser, checkOut, voidTicket,
} from '../api/ticketApi';
import { getAllLots, getSlotsForLot } from '../api/parkingLotApi';
import { useAuth } from '../context/AuthContext';
import { canOperateTickets } from '../utils/roles';
import SearchableSelect from '../components/SearchableSelect';

// Member 3 - Vehicle Check-in / Check-out (e-ticket)
export default function TicketPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="page">
        <h1 className="page-title">E-Tickets</h1>
        <div className="alert alert-error">Please log in to continue.</div>
      </div>
    );
  }

  return canOperateTickets(user.role)
    ? <AttendantTicketDesk />
    : <CustomerETickets user={user} />;
}

function CustomerETickets({ user }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getTicketsForUser(user.id)
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load your e-tickets.'));
  }, [user.id]);

  return (
    <div className="page">
      <h1 className="page-title">My E-Tickets</h1>
      <p className="page-subtitle">
        View only — your digital parking tickets. Show these at the lot if asked. Only staff can check you in or out.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      {items.length === 0 && <div className="empty-state">No e-tickets yet. Book a slot, pay, then staff will check you in.</div>}
      {items.map((d) => (
        <ETicketCard key={d.ticket.id} details={d} />
      ))}
    </div>
  );
}

function ETicketCard({ details }) {
  const t = details.ticket;
  const status = t.status;
  return (
    <div className="card">
      <div className="card-row">
        <div>
          <div className="card-title">
            E-Ticket #{t.id}
            {t.reservationId ? ` · Reservation #${t.reservationId}` : ' · Walk-in'}
          </div>
          <div className="card-meta">
            {details.customerName && <>Customer: {details.customerName} · </>}
            Plate: {t.vehiclePlateNumber}
          </div>
          <div className="card-meta">
            {details.lotName && <>{details.lotName}{details.lotAddress ? ` — ${details.lotAddress}` : ''} · </>}
            Slot {details.slotCode || t.parkingSlotId}
            {details.floor ? ` (Floor ${details.floor})` : ''}
          </div>
          {details.bookedStart && (
            <div className="card-meta">
              Booked: {new Date(details.bookedStart).toLocaleString()} → {new Date(details.bookedEnd).toLocaleString()}
            </div>
          )}
          <div className="card-meta">
            Entry: {t.entryTime ? new Date(t.entryTime).toLocaleString() : '—'}
            {t.exitTime ? ` · Exit: ${new Date(t.exitTime).toLocaleString()}` : ''}
          </div>
          {details.amountPaid != null && (
            <div className="card-meta">
              Paid: Rs. {details.amountPaid}
              {details.overstayPenalty > 0 ? ` · Overstay penalty: Rs. ${details.overstayPenalty}` : ''}
            </div>
          )}
          {details.thankYouMessage && status === 'COMPLETED' && (
            <div className="alert alert-success" style={{ marginTop: 10 }}>{details.thankYouMessage}</div>
          )}
          {status === 'ACTIVE' && details.thankYouMessage && (
            <div className="alert alert-info" style={{ marginTop: 10 }}>{details.thankYouMessage}</div>
          )}
        </div>
        <span className={`badge badge-${String(status).toLowerCase()}`}>{status}</span>
      </div>
      {t.overstayed && <span className="badge badge-cancelled" style={{ marginTop: 8 }}>Overstayed</span>}
    </div>
  );
}

function AttendantTicketDesk() {
  const [tab, setTab] = useState('checkin');
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [walkIn, setWalkIn] = useState({ vehiclePlateNumber: '', parkingSlotId: '' });
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);

  const loadActive = () => getActiveTickets().then((res) => setActive(res.data)).catch(() => {});
  const loadHistory = () => getTicketHistory().then((res) => setHistory(res.data)).catch(() => {});
  const loadEligible = () =>
    getEligibleReservations()
      .then((res) => setEligible(res.data || []))
      .catch(() => setEligible([]));

  useEffect(() => {
    loadActive();
    loadEligible();
    getAllLots().then((res) => setLots(res.data));
  }, []);

  useEffect(() => {
    if (tab === 'history') loadHistory();
    if (tab === 'active') loadActive();
    if (tab === 'checkin') loadEligible();
  }, [tab]);

  useEffect(() => {
    if (selectedLot) {
      getSlotsForLot(selectedLot).then((res) =>
        setAvailableSlots(res.data.filter((s) => s.status === 'AVAILABLE'))
      );
    } else {
      setAvailableSlots([]);
    }
  }, [selectedLot]);

  const eligibleOptions = eligible.map((r) => ({
    value: r.reservationId,
    label: `#${r.reservationId} — ${r.customerName || 'Customer'} · ${r.plateNumber || 'plate?'}`,
    sublabel: `${r.lotName || 'Lot'} / ${r.slotCode || 'slot'} · ${r.startTime ? new Date(r.startTime).toLocaleString() : ''}`,
  }));

  const selectedEligible = eligible.find((r) => String(r.reservationId) === String(selectedReservationId));

  const handleCheckInReservation = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!selectedReservationId) {
      setError('Select a confirmed reservation from the list.');
      return;
    }
    setLoading(true);
    try {
      const res = await checkInByReservation(Number(selectedReservationId));
      setLastTicket(res.data);
      setNotice(`Checked in — e-ticket #${res.data.ticket.id} created.`);
      setSelectedReservationId('');
      loadActive();
      loadEligible();
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : 'Could not check in.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalkIn = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await checkIn({
        vehiclePlateNumber: walkIn.vehiclePlateNumber,
        parkingSlotId: Number(walkIn.parkingSlotId),
      });
      setLastTicket(res.data);
      setNotice(`Walk-in checked in — e-ticket #${res.data.ticket.id}.`);
      setWalkIn({ vehiclePlateNumber: '', parkingSlotId: '' });
      setSelectedLot('');
      loadActive();
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : 'Could not check in walk-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (id) => {
    setError('');
    setNotice('');
    try {
      const res = await checkOut(id);
      setLastTicket(res.data);
      const t = res.data.ticket;
      setNotice(
        t.overstayed
          ? `Ticket #${id} checked out — overstay detected; existing overstay penalty applied. Slot frees in ~10 minutes.`
          : `Ticket #${id} checked out. No refund on early exit. Slot frees in ~10 minutes.`
      );
      loadActive();
      loadEligible();
      if (tab === 'history') loadHistory();
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : 'Check-out failed.');
    }
  };

  const handleVoid = async (id) => {
    if (!window.confirm(`Void ticket #${id}? Slot will be freed immediately.`)) return;
    setError('');
    try {
      await voidTicket(id);
      setNotice(`Ticket #${id} voided.`);
      setLastTicket(null);
      loadActive();
      loadEligible();
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : 'Could not void ticket.');
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Vehicle Check-in / Check-out</h1>
      <p className="page-subtitle">
        Pick a confirmed reservation from the list (cancelled / unpaid / already checked-in are hidden).
        Early exit = no refund. Late exit = existing overstay penalty. Slot held 10 minutes after check-out.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" className={`btn btn-sm ${tab === 'checkin' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('checkin')}>Check-in</button>
        <button type="button" className={`btn btn-sm ${tab === 'active' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('active')}>Active tickets</button>
        <button type="button" className={`btn btn-sm ${tab === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('history')}>History</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-info">{notice}</div>}
      {lastTicket && (
        <div style={{ marginBottom: 16 }}>
          <div className="section-label">Last e-ticket</div>
          <ETicketCard details={lastTicket} />
        </div>
      )}

      {tab === 'checkin' && (
        <>
          <div className="section-label">Check in by Reservation</div>
          <form className="form-card" onSubmit={handleCheckInReservation}>
            <div className="field">
              <label>Search confirmed reservation (ID, name, plate, lot…)</label>
              <SearchableSelect
                options={eligibleOptions}
                value={selectedReservationId}
                onSelect={(val) => setSelectedReservationId(val)}
                placeholder={eligibleOptions.length ? 'Type to filter…' : 'No eligible reservations right now'}
              />
            </div>
            {selectedEligible && (
              <div className="alert alert-info" style={{ marginTop: 12 }}>
                <strong>#{selectedEligible.reservationId}</strong>
                {' — '}{selectedEligible.customerName || 'Customer'}
                {' · '}{selectedEligible.plateNumber || '—'}
                {' · '}{selectedEligible.lotName || 'Lot'} / {selectedEligible.slotCode || 'slot'}
                <br />
                {selectedEligible.startTime && (
                  <span className="card-meta">
                    {new Date(selectedEligible.startTime).toLocaleString()} → {new Date(selectedEligible.endTime).toLocaleString()}
                  </span>
                )}
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading || !selectedReservationId} style={{ marginTop: 12 }}>
              {loading ? 'Checking in…' : 'Check In & Issue E-Ticket'}
            </button>
            <p className="card-meta" style={{ marginTop: 10 }}>
              Only <strong>CONFIRMED</strong> (paid) bookings without an active ticket appear here — cancelled and unpaid IDs are filtered out.
            </p>
          </form>

          <div className="section-label">Walk-in (no reservation)</div>
          <form className="form-card" onSubmit={handleWalkIn}>
            <div className="form-grid">
              <div className="field">
                <label>Vehicle plate number</label>
                <input
                  value={walkIn.vehiclePlateNumber}
                  onChange={(e) => setWalkIn({ ...walkIn, vehiclePlateNumber: e.target.value })}
                  placeholder="WP CAB-1234"
                  required
                />
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
                <select
                  value={walkIn.parkingSlotId}
                  onChange={(e) => setWalkIn({ ...walkIn, parkingSlotId: e.target.value })}
                  required
                  disabled={!selectedLot}
                >
                  <option value="">{selectedLot ? 'Select a slot…' : 'Choose a lot first'}</option>
                  {availableSlots.map((s) => (
                    <option key={s.id} value={s.id}>{s.slotCode}{s.floor ? ` — Floor ${s.floor}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn btn-secondary" type="submit" disabled={loading}>Check In Walk-in</button>
          </form>
        </>
      )}

      {tab === 'active' && (
        <>
          <div className="section-label">Active tickets</div>
          {active.length === 0 && <div className="empty-state">No active tickets right now.</div>}
          {active.map((d) => (
            <div key={d.ticket.id} style={{ marginBottom: 12 }}>
              <ETicketCard details={d} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => handleCheckOut(d.ticket.id)}>Check Out</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleVoid(d.ticket.id)}>Void ticket</button>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'history' && (
        <>
          <div className="section-label">Completed history</div>
          {history.length === 0 && <div className="empty-state">No completed tickets yet.</div>}
          {history.map((d) => (
            <div key={d.ticket.id} style={{ marginBottom: 12 }}>
              <ETicketCard details={d} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
