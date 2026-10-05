import { useState, useEffect } from 'react';
import {
  createPackage, updatePackage, getPackagesForLot, uploadPackageImage, deactivatePackage,
} from '../api/packageApi';

const API_ORIGIN = 'http://localhost:8080';
const imgUrl = (path) =>
  path ? (path.startsWith('http') ? path : `${API_ORIGIN}/uploads/${path}`) : null;

const empty = {
  parkingLotId: '',
  name: '',
  description: '',
  packageType: 'FESTIVAL',
  startDate: '',
  endDate: '',
  discountPercentage: '15',
};

export default function SpecialPackagesPanel({ lots }) {
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState(null);
  const [lotId, setLotId] = useState('');
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const load = (id) => {
    if (!id) { setPackages([]); return; }
    getPackagesForLot(id, false).then((res) => setPackages(res.data || [])).catch(() => setPackages([]));
  };

  useEffect(() => { load(lotId); }, [lotId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const startEdit = (pkg) => {
    setEditingId(pkg.id);
    setForm({
      parkingLotId: String(pkg.parkingLotId),
      name: pkg.name || '',
      description: pkg.description || '',
      packageType: pkg.packageType || 'FESTIVAL',
      startDate: pkg.startDate || '',
      endDate: pkg.endDate || '',
      discountPercentage: String(pkg.discountPercentage ?? 0),
    });
    setLotId(String(pkg.parkingLotId));
    setError('');
    setNotice('Editing package. Change fields and click Update package.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...empty, parkingLotId: lotId || '' });
    setNotice('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!form.parkingLotId || !form.name.trim() || !form.startDate || !form.endDate) {
      setError('Lot, name, start date and end date are required.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('End date must be on or after start date.');
      return;
    }
    const payload = {
      parkingLotId: Number(form.parkingLotId),
      name: form.name.trim(),
      description: form.description.trim() || null,
      packageType: form.packageType,
      startDate: form.startDate,
      endDate: form.endDate,
      discountPercentage: Number(form.discountPercentage) || 0,
      active: true,
    };
    setLoading(true);
    try {
      if (editingId) {
        await updatePackage(editingId, payload);
        setNotice('Package updated successfully.');
        setEditingId(null);
        setForm({ ...empty, parkingLotId: form.parkingLotId });
      } else {
        const res = await createPackage(payload);
        setNotice('Package created. You can add a promo image below.');
        setForm({ ...empty, parkingLotId: form.parkingLotId });
      }
      setLotId(String(form.parkingLotId));
      load(form.parkingLotId);
    } catch (err) {
      setError(err.response?.data?.error || (editingId ? 'Could not update package.' : 'Could not create package.'));
    } finally {
      setLoading(false);
    }
  };

  const handleImage = async (pkgId, file) => {
    if (!file) return;
    try {
      await uploadPackageImage(pkgId, file);
      load(lotId);
      setNotice('Package image uploaded.');
    } catch (err) {
      setError(err.response?.data?.error || 'Image upload failed.');
    }
  };

  return (
    <div style={{ marginTop: 40 }}>
      <div className="section-label">Special packages</div>
      <p className="page-subtitle" style={{ marginTop: 0 }}>
        Festival / seasonal / weekend offers with optional promo image.
        Active packages auto-apply their discount on the reservation start date.
      </p>

      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}
        {editingId && (
          <div className="card-meta" style={{ marginBottom: 12 }}>
            Editing package #{editingId}{' '}
            <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit} style={{ marginLeft: 8 }}>
              Cancel edit
            </button>
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label>Parking lot</label>
            <select value={form.parkingLotId} onChange={(e) => set('parkingLotId', e.target.value)} required>
              <option value="">Select lot...</option>
              {lots.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Package name</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="Vesak Festival Special" required />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={form.packageType} onChange={(e) => set('packageType', e.target.value)}>
              <option value="FESTIVAL">Festival</option>
              <option value="SEASONAL">Seasonal</option>
              <option value="WEEKEND">Weekend</option>
              <option value="PROMO">Promo</option>
            </select>
          </div>
          <div className="field">
            <label>Discount %</label>
            <input type="number" min="0" max="100" value={form.discountPercentage}
              onChange={(e) => set('discountPercentage', e.target.value)} required />
          </div>
          <div className="field">
            <label>Start date</label>
            <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
          </div>
          <div className="field">
            <label>End date</label>
            <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Description (optional)</label>
            <input value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="20% off all weekend bookings" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Update package' : 'Create package'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="section-label" style={{ marginTop: 24 }}>Packages for a lot</div>
      <div className="field" style={{ maxWidth: 320, marginBottom: 12 }}>
        <label>View packages</label>
        <select value={lotId} onChange={(e) => setLotId(e.target.value)}>
          <option value="">Select lot...</option>
          {lots.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {packages.length === 0 && lotId && (
        <div className="empty-state">No packages for this lot yet.</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {packages.map((pkg) => (
          <div className="card" key={pkg.id} style={{ padding: 0, overflow: 'hidden', opacity: pkg.active ? 1 : 0.65 }}>
            {pkg.imagePath ? (
              <img src={imgUrl(pkg.imagePath)} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            ) : (
              <div style={{
                height: 140, background: 'linear-gradient(135deg, #1e3a5f, #C9A227)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700,
              }}>
                {pkg.packageType}
              </div>
            )}
            <div style={{ padding: 14 }}>
              <div className="card-title">{pkg.name}</div>
              <div className="card-meta">
                {pkg.packageType} · {pkg.discountPercentage}% off
                <br />
                {pkg.startDate} → {pkg.endDate}
                {!pkg.active && ' · INACTIVE'}
              </div>
              {pkg.description && <p style={{ fontSize: 13, margin: '8px 0' }}>{pkg.description}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(pkg)}>
                  Edit
                </button>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  {pkg.imagePath ? 'Change image' : 'Add image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) handleImage(pkg.id, f);
                    }}
                  />
                </label>
                {pkg.active && (
                  <button type="button" className="btn btn-danger btn-sm"
                    onClick={() => deactivatePackage(pkg.id).then(() => load(lotId))}>
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
