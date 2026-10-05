import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/userApi';
import { useAuth } from '../context/AuthContext';

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
      loginUser(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || (err.response?.data?.fieldErrors
        ? JSON.stringify(err.response.data.fieldErrors) : 'Could not register.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="page-title" style={{ fontSize: 24 }}>Create an account</h1>
        <p className="page-subtitle">Register as a customer to search and book parking.</p>
        <form onSubmit={handleSubmit}>
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
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div className="field" style={{ marginBottom: 18 }}>
            <label>Phone number</label>
            <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="+94 71 234 5678" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
          <p style={{ marginTop: 16, fontSize: 13.5, color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--amber-dark)', fontWeight: 600 }}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
