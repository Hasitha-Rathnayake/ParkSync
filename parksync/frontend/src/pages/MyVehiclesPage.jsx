import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addVehicle, getVehiclesForUser, deleteVehicle } from '../api/vehicleApi';

const emptyForm = { plateNumber: '', make: '', model: '', color: '', type: 'CAR' };

export default function MyVehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadVehicles = () => {
    if (user) getVehiclesForUser(user.id).then((res) => setVehicles(res.data));
  };

  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return (
      <div className="page">
        <h1 className="page-title">My Vehicles</h1>
        <div className="alert alert-error">Please log in to manage your saved vehicles.</div>
      </div>
    );
  }

  // Vehicles belong to drivers, not staff - only Customer accounts manage them.
  // (Same UI-only limitation as the rest of this project's role checks - see README.)
  if (user.role !== 'CUSTOMER') {
    return (
      <div className="page">
        <h1 className="page-title">My Vehicles</h1>
        <div className="alert alert-error">This page is only available to Customer accounts.</div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await addVehicle({ ...form, userId: user.id });
      setForm(emptyForm);
      loadVehicles();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    await deleteVehicle(id);
    loadVehicles();
  };

  return (
    <div className="page">
      <h1 className="page-title">My Vehicles</h1>
      <p className="page-subtitle">Save your vehicles here so you don't have to re-enter details every visit.</p>

      <div className="section-label">Add a Vehicle</div>
      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-grid">
          <div className="field">
            <label>Plate number</label>
            <input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} placeholder="WP CAB-1234" required />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="CAR">Car</option>
              <option value="VAN">Van</option>
              <option value="MOTORCYCLE">Motorcycle</option>
              <option value="SUV">SUV</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="field">
            <label>Make (optional)</label>
            <input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="Toyota" />
          </div>
          <div className="field">
            <label>Model (optional)</label>
            <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Aqua" />
          </div>
          <div className="field">
            <label>Color (optional)</label>
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="White" />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Adding…' : 'Add Vehicle'}
        </button>
      </form>

      <div className="section-label">Saved Vehicles</div>
      {vehicles.length === 0 && <div className="empty-state">No vehicles saved yet — add one above.</div>}
      {vehicles.map((v) => (
        <div className="card" key={v.id}>
          <div className="card-row">
            <div>
              <div className="card-title">
                {v.plateNumber} <span className="badge badge-pending" style={{ marginLeft: 8 }}>{v.type}</span>
              </div>
              <div className="card-meta">
                {[v.color, v.make, v.model].filter(Boolean).join(' · ') || 'No additional details'}
              </div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => handleRemove(v.id)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}
