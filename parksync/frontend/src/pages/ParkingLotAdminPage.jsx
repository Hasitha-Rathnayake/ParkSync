import { useState, useEffect } from 'react';
import {
  getAllLots, createLot, addSlot, getSlotsForLot, getOccupancy,
  updateSlotStatus, deleteSlot, deleteLot,
} from '../api/parkingLotApi';

// Member 2 - Parking Lot & Slot Management
export default function ParkingLotAdminPage() {
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', totalCapacity: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedLotId, setExpandedLotId] = useState(null);

  const loadLots = () => getAllLots().then((res) => setLots(res.data));

  useEffect(() => {
    loadLots();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createLot({ ...form, totalCapacity: Number(form.totalCapacity) });
      setForm({ name: '', address: '', totalCapacity: '' });
      loadLots();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create lot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLot = async (id) => {
    await deleteLot(id);
    if (expandedLotId === id) setExpandedLotId(null);
    loadLots();
  };

  return (
    <div className="page">
      <h1 className="page-title">Parking Lot & Slot Management</h1>
      <p className="page-subtitle">Add lots by location and size, then manage each lot's individual slots.</p>

      <div className="section-label">Add a New Lot</div>
      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-grid">
          <div className="field">
            <label>Lot name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Colombo City Lot" required />
          </div>
          <div className="field">
            <label>Location / Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Galle Rd" required />
          </div>
          <div className="field">
            <label>Size (total capacity)</label>
            <input type="number" min="1" value={form.totalCapacity} onChange={(e) => setForm({ ...form, totalCapacity: e.target.value })} placeholder="40" required />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Adding…' : 'Add Lot'}
        </button>
      </form>

      <div className="section-label">Your Lots</div>
      {lots.length === 0 && <div className="empty-state">No parking lots yet — add one above to get started.</div>}
      {lots.map((lot) => (
        <LotCard
          key={lot.id}
          lot={lot}
          expanded={expandedLotId === lot.id}
          onToggle={() => setExpandedLotId(expandedLotId === lot.id ? null : lot.id)}
          onDeleteLot={() => handleDeleteLot(lot.id)}
        />
      ))}
    </div>
  );
}

function LotCard({ lot, expanded, onToggle, onDeleteLot }) {
  const [slots, setSlots] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [slotForm, setSlotForm] = useState({ slotCode: '', floor: '' });
  const [slotError, setSlotError] = useState('');
  const [slotLoading, setSlotLoading] = useState(false);

  const loadSlots = () => {
    getSlotsForLot(lot.id).then((res) => setSlots(res.data));
    getOccupancy(lot.id).then((res) => setOccupancy(res.data));
  };

  useEffect(() => {
    if (expanded) loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setSlotError('');
    setSlotLoading(true);
    try {
      await addSlot(lot.id, slotForm);
      setSlotForm({ slotCode: '', floor: '' });
      loadSlots();
    } catch (err) {
      setSlotError(err.response?.data?.error || 'Could not add slot.');
    } finally {
      setSlotLoading(false);
    }
  };

  const handleStatusChange = async (slotId, status) => {
    await updateSlotStatus(slotId, status);
    loadSlots();
  };

  const handleDeleteSlot = async (slotId) => {
    await deleteSlot(slotId);
    loadSlots();
  };

  const statusBadge = (status) => <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-row">
        <div>
          <div className="card-title">{lot.name}</div>
          <div className="card-meta">
            {lot.address} · Capacity: {lot.totalCapacity}
            {occupancy !== null && expanded && ` · Occupancy: ${occupancy.toFixed(0)}%`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onToggle}>
            {expanded ? 'Hide Slots' : 'Manage Slots'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDeleteLot}>Delete Lot</button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>Add a Slot</div>
          <form onSubmit={handleAddSlot} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap' }}>
            {slotError && <div className="alert alert-error" style={{ width: '100%' }}>{slotError}</div>}
            <div className="field" style={{ flex: 1, minWidth: 140 }}>
              <label>Slot ID / Code</label>
              <input value={slotForm.slotCode} onChange={(e) => setSlotForm({ ...slotForm, slotCode: e.target.value })} placeholder="B-14" required />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 140 }}>
              <label>Floor (optional)</label>
              <input value={slotForm.floor} onChange={(e) => setSlotForm({ ...slotForm, floor: e.target.value })} placeholder="2" />
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={slotLoading}>
              {slotLoading ? 'Adding…' : 'Add Slot'}
            </button>
          </form>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>Slots</div>
          {slots.length === 0 && <div className="empty-state">No slots added yet.</div>}
          {slots.map((s) => (
            <div key={s.id} className="card" style={{ marginBottom: 8, padding: '12px 16px' }}>
              <div className="card-row">
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{s.slotCode}</span>
                  {s.floor && <span className="card-meta" style={{ marginLeft: 8 }}>Floor {s.floor}</span>}
                  <span style={{ marginLeft: 10 }}>{statusBadge(s.status)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={s.status}
                    onChange={(e) => handleStatusChange(s.id, e.target.value)}
                    style={{ fontSize: 12.5, padding: '6px 8px', borderRadius: 7, border: '1.5px solid var(--border)' }}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSlot(s.id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
