import { useState, useEffect } from 'react';
import {
  createPricingRule,
  getRulesForLot,
  updatePricingRule,
  deactivatePricingRule,
} from '../api/pricingApi';
import { getAllLots } from '../api/parkingLotApi';
import SearchableSelect from '../components/SearchableSelect';

const emptyForm = {
  parkingLotId: '',
  baseRatePerHour: '',
  peakRatePerHour: '',
  peakStartHour: 8,
  peakEndHour: 18,
  discountCode: '',
  discountPercentage: '',
  cancellationFeePercentage: 20,
  freeCancellationWindowMinutes: 60,
  overstayMultiplier: 1.5,
};

export default function PricingPage() {
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState([]);
  const [lotId, setLotId] = useState('');

  useEffect(() => {
    getAllLots().then((res) => setLots(res.data)).catch(() => setLots([]));
  }, []);

  const lotOptions = lots.map((l) => ({ value: l.id, label: l.name, sublabel: l.address }));
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validateForm = () => {
    if (!form.parkingLotId) return 'Select a parking lot.';
    const base = Number(form.baseRatePerHour);
    const peak = Number(form.peakRatePerHour);
    if (!form.baseRatePerHour || isNaN(base) || base <= 0) return 'Base rate must be greater than 0.';
    if (!form.peakRatePerHour || isNaN(peak) || peak <= 0) return 'Peak rate must be greater than 0.';
    const start = Number(form.peakStartHour);
    const end = Number(form.peakEndHour);
    if (isNaN(start) || start < 0 || start > 23) return 'Peak start hour must be 0–23.';
    if (isNaN(end) || end < 0 || end > 23) return 'Peak end hour must be 0–23.';
    if (start >= end) return 'Peak start hour must be before peak end hour (e.g. 8 and 18).';
    if (form.discountPercentage !== '' && form.discountPercentage != null) {
      const d = Number(form.discountPercentage);
      if (isNaN(d) || d < 0 || d > 100) return 'Discount % must be between 0 and 100.';
      if (d > 0 && !form.discountCode?.trim()) return 'Enter a discount code if you set a discount %.';
    }
    const cancelFee = Number(form.cancellationFeePercentage);
    if (isNaN(cancelFee) || cancelFee < 0 || cancelFee > 100) return 'Cancellation fee % must be 0–100.';
    const freeWin = Number(form.freeCancellationWindowMinutes);
    if (isNaN(freeWin) || freeWin < 0) return 'Free cancellation window cannot be negative.';
    const mult = Number(form.overstayMultiplier);
    if (isNaN(mult) || mult < 1) return 'Overstay multiplier must be at least 1.0.';
    return null;
  };

  const buildPayload = () => ({
    parkingLotId: Number(form.parkingLotId),
    baseRatePerHour: Number(form.baseRatePerHour),
    peakRatePerHour: Number(form.peakRatePerHour),
    peakStartHour: Number(form.peakStartHour),
    peakEndHour: Number(form.peakEndHour),
    discountCode: form.discountCode?.trim() || null,
    discountPercentage: form.discountPercentage === '' ? null : Number(form.discountPercentage),
    cancellationFeePercentage: Number(form.cancellationFeePercentage),
    freeCancellationWindowMinutes: Number(form.freeCancellationWindowMinutes),
    overstayMultiplier: Number(form.overstayMultiplier),
    active: true,
  });

  const loadRules = async (id) => {
    setLotId(id);
    try {
      const res = await getRulesForLot(id);
      setRules(res.data || []);
    } catch {
      setRules([]);
    }
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setForm({
      parkingLotId: rule.parkingLotId,
      baseRatePerHour: rule.baseRatePerHour ?? '',
      peakRatePerHour: rule.peakRatePerHour ?? '',
      peakStartHour: rule.peakStartHour ?? 8,
      peakEndHour: rule.peakEndHour ?? 18,
      discountCode: rule.discountCode || '',
      discountPercentage: rule.discountPercentage ?? '',
      cancellationFeePercentage: rule.cancellationFeePercentage ?? 20,
      freeCancellationWindowMinutes: rule.freeCancellationWindowMinutes ?? 60,
      overstayMultiplier: rule.overstayMultiplier ?? 1.5,
    });
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const msg = validateForm();
    if (msg) {
      setError(msg);
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await updatePricingRule(editingId, payload);
        setNotice('Pricing rule updated.');
        setEditingId(null);
      } else {
        await createPricingRule(payload);
        setNotice('Pricing rule created. Customers can now pay for bookings at this lot.');
      }
      setForm({ ...emptyForm });
      const refreshLot = lotId || payload.parkingLotId;
      if (refreshLot) await loadRules(refreshLot);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not save pricing rule.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    setError('');
    setNotice('');
    try {
      await deactivatePricingRule(id);
      setNotice('Rule deactivated.');
      if (editingId === id) cancelEdit();
      if (lotId) await loadRules(lotId);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not deactivate rule.');
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Dynamic Pricing & Discount Management</h1>
      <p className="page-subtitle">
        Lot Admin — create, edit, or deactivate rates, peak hours, discounts, cancellation fees, and overstay rules per lot.
      </p>

      <div className="section-label">{editingId ? `Edit rule #${editingId}` : 'Create a Pricing Rule'}</div>
      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}
        <div className="form-grid">
          <div className="field">
            <label>Parking Lot *</label>
            <SearchableSelect
              options={lotOptions}
              value={form.parkingLotId}
              onSelect={(id) => set('parkingLotId', id)}
              placeholder="Start typing a lot name…"
            />
          </div>
          <div className="field">
            <label>Base rate / hour (Rs.) *</label>
            <input type="number" min="0.01" step="0.01" value={form.baseRatePerHour}
              onChange={(e) => set('baseRatePerHour', e.target.value)} required placeholder="e.g. 100" />
          </div>
          <div className="field">
            <label>Peak rate / hour (Rs.) *</label>
            <input type="number" min="0.01" step="0.01" value={form.peakRatePerHour}
              onChange={(e) => set('peakRatePerHour', e.target.value)} required placeholder="e.g. 150" />
          </div>
          <div className="field">
            <label>Peak start hour (0–23) *</label>
            <input type="number" min="0" max="23" value={form.peakStartHour}
              onChange={(e) => set('peakStartHour', e.target.value)} required />
          </div>
          <div className="field">
            <label>Peak end hour (0–23) *</label>
            <input type="number" min="0" max="23" value={form.peakEndHour}
              onChange={(e) => set('peakEndHour', e.target.value)} required />
          </div>
          <div className="field">
            <label>Discount code</label>
            <input value={form.discountCode} onChange={(e) => set('discountCode', e.target.value)}
              placeholder="e.g. FIRST10" />
          </div>
          <div className="field">
            <label>Discount %</label>
            <input type="number" min="0" max="100" step="0.1" value={form.discountPercentage}
              onChange={(e) => set('discountPercentage', e.target.value)} placeholder="0–100" />
          </div>
          <div className="field">
            <label>Cancellation fee %</label>
            <input type="number" min="0" max="100" value={form.cancellationFeePercentage}
              onChange={(e) => set('cancellationFeePercentage', e.target.value)} />
          </div>
          <div className="field">
            <label>Free cancellation window (minutes)</label>
            <input type="number" min="0" value={form.freeCancellationWindowMinutes}
              onChange={(e) => set('freeCancellationWindowMinutes', e.target.value)} />
          </div>
          <div className="field">
            <label>Overstay multiplier (≥ 1.0)</label>
            <input type="number" min="1" step="0.1" value={form.overstayMultiplier}
              onChange={(e) => set('overstayMultiplier', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : editingId ? 'Save changes' : 'Create Pricing Rule'}
          </button>
          {editingId && (
            <button className="btn btn-secondary" type="button" onClick={cancelEdit}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="section-label">Active rules for a lot</div>
      <div className="form-card">
        <div className="field">
          <label>Select lot</label>
          <SearchableSelect options={lotOptions} value={lotId} onSelect={loadRules}
            placeholder="Start typing a lot name…" />
        </div>
      </div>

      {lotId && rules.length === 0 && (
        <div className="empty-state">No active rules for this lot yet. Create one above.</div>
      )}
      {rules.map((r) => (
        <div className="card" key={r.id}>
          <div className="card-row">
            <div>
              <div className="card-title">
                #{r.id} · Rs.{r.baseRatePerHour}/hr base · Rs.{r.peakRatePerHour}/hr peak
                ({r.peakStartHour}:00–{r.peakEndHour}:00)
              </div>
              <div className="card-meta">
                {r.discountCode
                  ? `Code "${r.discountCode}" — ${r.discountPercentage}% off · `
                  : 'No discount · '}
                Cancel fee {r.cancellationFeePercentage ?? 0}% · Free cancel window{' '}
                {r.freeCancellationWindowMinutes ?? 0} min · Overstay ×{r.overstayMultiplier ?? 1}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(r)}>
                Edit
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeactivate(r.id)}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
