import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createStaffAccount, getUsersByRole, deleteUser } from '../api/userApi';

export default function ManageStaffPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '', role: 'ATTENDANT' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);

  const loadStaff = async () => {
    const [attendants, lotAdmins] = await Promise.all([
      getUsersByRole('ATTENDANT'),
      getUsersByRole('LOT_ADMIN'),
    ]);
    setStaff([...attendants.data, ...lotAdmins.data]);
  };

  useEffect(() => {
    if (user?.role === 'SYSTEM_ADMIN') loadStaff();
  }, [user]);

  // Guard: only a logged-in System Admin can use this page.
  // (UI-side only, same limitation noted throughout this project - see README.)
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return (
      <div className="page">
        <h1 className="page-title">Manage Staff</h1>
        <div className="alert alert-error">
          This page is only available to System Admin accounts. Log in with the seeded
          System Admin demo account to access it.
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await createStaffAccount(form);
      setNotice(`${form.role === 'ATTENDANT' ? 'Attendant' : 'Lot Admin'} account created.`);
      setForm({ fullName: '', email: '', password: '', phoneNumber: '', role: 'ATTENDANT' });
      loadStaff();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create staff account.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    await deleteUser(id);
    loadStaff();
  };

  return (
    <div className="page">
      <h1 className="page-title">Manage Staff</h1>
      <p className="page-subtitle">System Admin — create and remove Attendant and Lot Admin accounts.</p>

      <div className="section-label">Add a Staff Account</div>
      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}
        <div className="form-grid">
          <div className="field">
            <label>Full name</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label>Temporary password (min. 6 chars)</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ATTENDANT">Attendant / Staff</option>
              <option value="LOT_ADMIN">Parking Lot Admin</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </form>

      <div className="section-label">Current Staff</div>
      {staff.length === 0 && <div className="empty-state">No staff accounts yet.</div>}
      {staff.map((s) => (
        <div className="card" key={s.id}>
          <div className="card-row">
            <div>
              <div className="card-title">
                {s.fullName} <span className="badge badge-pending" style={{ marginLeft: 8 }}>{s.role}</span>
              </div>
              <div className="card-meta">{s.email}</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => handleRemove(s.id)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}
