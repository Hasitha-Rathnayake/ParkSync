import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/userApi';
import { useAuth } from '../context/AuthContext';

// Public registration is CUSTOMER-only, by design. Attendant / Lot Admin /
// System Admin accounts are not self-registerable - they're seeded on the
// backend (see AdminAccountSeeder.java) or, in a full production build,
// created by an existing admin through a protected staff-management screen.
export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await register({ ...form, role: 'CUSTOMER' });
      loginUser(res.data); // auto-login after registering
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.fieldErrors
        ? JSON.stringify(err.response.data.fieldErrors) : 'Could not register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 460 }}>
      <h1 className="page-title">Create an Account</h1>
      <p className="page-subtitle">Register as a customer to search and book parking.</p>

      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Full name</label>
          <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Password (min. 6 characters)</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>Phone number</label>
          <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="+94 71 234 5678" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating account…' : 'Register'}
        </button>
        <p style={{ marginTop: 16, fontSize: 13.5, color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--amber)' }}>Log in</Link>
        </p>
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          Staff or admin? Use the demo credentials provided by your team lead — those accounts aren't created here.
        </p>
      </form>
    </div>
  );
}
