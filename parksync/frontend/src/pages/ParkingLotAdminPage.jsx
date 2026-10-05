import { useState, useEffect } from 'react';
import {
  getAllLots, createLot, addSlotsBatch, getSlotsForLot, getOccupancy,
  updateSlotStatus, deleteSlot, deleteLot, uploadLotPhoto, deleteLotPhoto,
  getLotPhotos, addLotPhoto, deleteLotPhotoById,
} from '../api/parkingLotApi';

// Member 2 - Parking Lot & Slot Management
const API_ORIGIN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  ? String(import.meta.env.VITE_API_URL).replace(/\/api\/?$/, '')
  : 'http://localhost:8080';

export function lotPhotoUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_ORIGIN}/uploads/${imagePath}`;
}

function slotPrefixFromName(name) {
  const cleaned = String(name || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!cleaned) return 'LOT';
  return cleaned.slice(0, 12);
}

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
          onPhotoChanged={loadLots}
        />
      ))}
    </div>
  );
}

function LotCard({ lot, expanded, onToggle, onDeleteLot, onPhotoChanged }) {
  const [slots, setSlots] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [slotForm, setSlotForm] = useState({ count: '1', floor: '' });
  const [slotError, setSlotError] = useState('');
  const [slotLoading, setSlotLoading] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photos, setPhotos] = useState([]);

  const loadPhotos = () => {
    getLotPhotos(lot.id).then((res) => setPhotos(res.data || [])).catch(() => setPhotos([]));
  };

  useEffect(() => { loadPhotos(); }, [lot.id, lot.imagePath]);

  const handlePhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setPhotoError('');
    setPhotoBusy(true);
    try {
      for (const file of files) {
        if (photos.length >= 5) {
          setPhotoError('Maximum 5 photos per lot.');
          break;
        }
        await addLotPhoto(lot.id, file);
        // refresh count mid-loop
        const res = await getLotPhotos(lot.id);
        setPhotos(res.data || []);
      }
      onPhotoChanged?.();
      loadPhotos();
    } catch (err) {
      setPhotoError(err.response?.data?.error || 'Could not upload photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async (photoId) => {
    setPhotoBusy(true);
    setPhotoError('');
    try {
      await deleteLotPhotoById(photoId);
      onPhotoChanged?.();
      loadPhotos();
    } catch (err) {
      setPhotoError(err.response?.data?.error || 'Could not remove photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const prefix = slotPrefixFromName(lot.name);

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
      const count = Math.max(1, Math.min(50, Number(slotForm.count) || 1));
      await addSlotsBatch(lot.id, count, slotForm.floor || undefined);
      setSlotForm({ count: '1', floor: '' });
      loadSlots();
    } catch (err) {
      setSlotError(err.response?.data?.error || 'Could not add slot(s).');
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
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
          <div style={{ flex: 1 }}>
            <div className="card-title">{lot.name}</div>
            <div className="card-meta">
              {lot.address} · Capacity: {lot.totalCapacity}
              {occupancy !== null && expanded && ` · Occupancy: ${occupancy.toFixed(0)}%`}
              {' · '}Photos: {photos.length}/5
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {photos.map((ph) => (
                <div key={ph.id} style={{ position: 'relative' }}>
                  <img
                    src={lotPhotoUrl(ph.filePath)}
                    alt=""
                    style={{ width: 88, height: 66, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ position: 'absolute', top: 2, right: 2, padding: '2px 6px', fontSize: 10 }}
                    disabled={photoBusy}
                    onClick={() => handleRemovePhoto(ph.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length === 0 && (
                <div style={{
                  width: 88, height: 66, borderRadius: 8, background: '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'var(--text-muted)', border: '1px dashed var(--border)',
                }}>
                  No photos
                </div>
              )}
              {photos.length < 5 && (
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  {photoBusy ? 'Uploading…' : 'Add photos'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    hidden
                    disabled={photoBusy}
                    onChange={handlePhoto}
                  />
                </label>
              )}
            </div>
            {photoError && <div className="alert alert-error" style={{ marginTop: 8 }}>{photoError}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onToggle}>
            {expanded ? 'Hide slots' : 'Manage slots'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDeleteLot}>Delete lot</button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>
            Add slots (pattern: {prefix}-01, {prefix}-02, …)
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 10px' }}>
            Codes are generated from the lot name automatically — no manual typing.
          </p>
          <form onSubmit={handleAddSlot} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap' }}>
            {slotError && <div className="alert alert-error" style={{ width: '100%' }}>{slotError}</div>}
            <div className="field" style={{ flex: 1, minWidth: 120 }}>
              <label>How many slots?</label>
              <input type="number" min="1" max="50" value={slotForm.count}
                onChange={(e) => setSlotForm({ ...slotForm, count: e.target.value })} required />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 120 }}>
              <label>Floor (optional)</label>
              <input value={slotForm.floor} onChange={(e) => setSlotForm({ ...slotForm, floor: e.target.value })} placeholder="1" />
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={slotLoading}>
              {slotLoading ? 'Adding…' : 'Add slots'}
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
