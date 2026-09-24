import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chargePayment, getPaymentHistory } from '../api/paymentApi';
import { getReservationsByUser } from '../api/reservationApi';
import { useAuth } from '../context/AuthContext';
import { canManagePayments } from '../utils/roles';

// ---- Simulated card helpers (inline so page works even if utils file missing) ----
function onlyDigits(v) {
  return String(v || '').replace(/\D/g, '');
}
function luhnCheck(num) {
  const d = onlyDigits(num);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
function detectBrand(num) {
  const d = onlyDigits(num);
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  return 'Card';
}
function isExpiryValid(expiry) {
  const m = String(expiry || '').replace(/\s/g, '').match(/^(\d{2})\s*\/?\s*(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 0, 23, 59, 59) >= new Date();
}
function formatCardInput(v) {
  return onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
function formatExpiryInput(v) {
  const d = onlyDigits(v).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

export default function PaymentPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isAdmin = canManagePayments(user?.role);

  const [form, setForm] = useState({
    reservationId: searchParams.get('reservationId') || '',
    discountCode: '',
    method: 'CARD',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardholder: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(
    searchParams.get('justBooked')
      ? 'Slot reserved! Complete payment within 15 minutes to keep it.'
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState([]);
  const [lookupUserId, setLookupUserId] = useState('');
  const [, setTick] = useState(0);

  const loadCustomerData = () => {
    if (!user?.id) return;
    getPaymentHistory(user.id).then((res) => setHistory(res.data)).catch(() => setHistory([]));
    getReservationsByUser(user.id)
      .then((res) => setPending((res.data || []).filter((r) => r.status === 'PENDING_PAYMENT')))
      .catch(() => setPending([]));
  };

  useEffect(() => {
    if (user && !isAdmin) loadCustomerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="page">
        <h1 className="page-title">Billing & Payment</h1>
        <div className="alert alert-error">Please log in as a Customer to pay.</div>
      </div>
    );
  }

  const timeLeft = (deadline) => {
    if (!deadline) return '—';
    const ms = new Date(deadline).getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')} remaining`;
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validateCard = () => {
    if (form.method !== 'CARD') return null;
    const digits = onlyDigits(form.cardNumber);
    if (!digits) return 'Enter a card number.';
    if (!luhnCheck(digits)) return 'Invalid card number. Try 4111111111111111 (Visa test).';
    if (!isExpiryValid(form.expiry)) return 'Enter a valid expiry (MM/YY), not expired.';
    const cvv = onlyDigits(form.cvv);
    if (cvv.length < 3) return 'CVV must be 3 digits (4 for Amex).';
    const name = (form.cardholder || '').trim();
    if (name.length < 2) return 'Enter the name on the card.';
    return null;
  };

  const handleCharge = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!form.reservationId) {
      setError('Select or enter a reservation ID.');
      return;
    }
    const cardErr = validateCard();
    if (cardErr) {
      setError(cardErr);
      return;
    }
    setLoading(true);
    try {
      // Card data validated in browser only — never sent to server
      await chargePayment(form.reservationId, form.discountCode?.trim() || null, form.method);
      setNotice('Payment successful (simulated). Reservation confirmed.');
      setForm({
        reservationId: '',
        discountCode: '',
        method: 'CARD',
        cardNumber: '',
        expiry: '',
        cvv: '',
        cardholder: '',
      });
      if (!isAdmin) loadCustomerData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not process payment.');
    } finally {
      setLoading(false);
    }
  };

  const loadLookupHistory = async () => {
    if (!lookupUserId) return;
    try {
      const res = await getPaymentHistory(lookupUserId);
      setHistory(res.data || []);
    } catch {
      setHistory([]);
      setError('Could not load history for that user.');
    }
  };

  const brand = form.method === 'CARD' && onlyDigits(form.cardNumber).length >= 1
    ? detectBrand(form.cardNumber)
    : null;

  const statusBadge = (status) => (
    <span className={`badge badge-${String(status).toLowerCase()}`}>{status}</span>
  );

  // SYSTEM_ADMIN only sees lookup — tell them clearly
  if (isAdmin) {
    return (
      <div className="page">
        <h1 className="page-title">Billing & Payment</h1>
        <p className="page-subtitle">Admin view — look up customer payment history.</p>
        <div className="alert alert-info">
          Card payment form is only for <strong>Customer</strong> accounts. Log out and login as a customer to test card payment.
        </div>
        <div className="section-label">Look Up a Customer's Payment History</div>
        <div className="form-card" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>User ID</label>
            <input value={lookupUserId} onChange={(e) => setLookupUserId(e.target.value)} placeholder="1" />
          </div>
          <button className="btn btn-secondary" onClick={loadLookupHistory} type="button">Load</button>
        </div>
        {history.length === 0 && <div className="empty-state">No payment history to show yet.</div>}
        {history.map((p) => (
          <div className="card" key={p.id}>
            <div className="card-row">
              <div>
                <div className="card-title">#{p.id} — Rs. {p.amount}{p.method ? ` · ${p.method}` : ''}</div>
                <div className="card-meta">Reservation #{p.reservationId}</div>
              </div>
              {statusBadge(p.status)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Billing & Payment</h1>
      <p className="page-subtitle">
        Pay at booking time. Card checks are simulated — no real gateway. Card data is not stored.
      </p>

      {pending.length > 0 && (
        <>
          <div className="section-label">Awaiting Payment</div>
          {pending.map((r) => (
            <div className="card" key={r.id} style={{ borderColor: '#FCD34D' }}>
              <div className="card-row">
                <div>
                  <div className="card-title">
                    Reservation #{r.id}
                    {r.parkingSlot?.slotCode ? ` — Slot ${r.parkingSlot.slotCode}` : ''}
                  </div>
                  <div className="card-meta">
                    {new Date(r.startTime).toLocaleString()} → {new Date(r.endTime).toLocaleString()}
                  </div>
                  <div className="card-meta" style={{ color: 'var(--error)', fontWeight: 700, marginTop: 4 }}>
                    {timeLeft(r.paymentDeadline)}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setField('reservationId', r.id);
                    setError('');
                    setNotice('');
                  }}
                >
                  Pay Now
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="section-label">Pay for a Reservation</div>
      <form className="form-card" onSubmit={handleCharge}>
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}

        <div className="form-grid">
          <div className="field">
            <label>Reservation ID *</label>
            <input
              value={form.reservationId}
              onChange={(e) => setField('reservationId', e.target.value)}
              required
              placeholder="Click Pay Now above or type ID"
            />
          </div>
          <div className="field">
            <label>Discount code (optional)</label>
            <input
              value={form.discountCode}
              onChange={(e) => setField('discountCode', e.target.value)}
              placeholder="e.g. FIRST10"
            />
          </div>
          <div className="field">
            <label>Payment method *</label>
            <select value={form.method} onChange={(e) => setField('method', e.target.value)}>
              <option value="CARD">Card (Visa / Mastercard)</option>
              <option value="PAYPAL">PayPal</option>
              <option value="WALLET">Wallet</option>
            </select>
          </div>
        </div>

        {/* Card block — always visible when CARD selected (default) */}
        {form.method === 'CARD' ? (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              border: '2px solid #F59E0B',
              borderRadius: 12,
              background: '#FFFBEB',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#0F172A' }}>
              Card details (simulated) {brand ? `· ${brand}` : ''}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              Test Visa: <strong>4111 1111 1111 1111</strong>
              &nbsp;·&nbsp; Mastercard: <strong>5500 0000 0000 0004</strong>
              &nbsp;·&nbsp; Expiry e.g. <strong>12/28</strong> · CVV <strong>123</strong>
            </div>
            <div className="form-grid">
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Card number *</label>
                <input
                  value={form.cardNumber}
                  onChange={(e) => setField('cardNumber', formatCardInput(e.target.value))}
                  placeholder="4111 1111 1111 1111"
                  inputMode="numeric"
                />
              </div>
              <div className="field">
                <label>Expiry (MM/YY) *</label>
                <input
                  value={form.expiry}
                  onChange={(e) => setField('expiry', formatExpiryInput(e.target.value))}
                  placeholder="12/28"
                  inputMode="numeric"
                />
              </div>
              <div className="field">
                <label>CVV *</label>
                <input
                  value={form.cvv}
                  onChange={(e) => setField('cvv', onlyDigits(e.target.value).slice(0, 4))}
                  placeholder="123"
                  inputMode="numeric"
                />
              </div>
              <div className="field">
                <label>Name on card *</label>
                <input
                  value={form.cardholder}
                  onChange={(e) => setField('cardholder', e.target.value)}
                  placeholder="As printed on card"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-info" style={{ marginTop: 12 }}>
            {form.method === 'PAYPAL'
              ? 'PayPal is simulated — confirm to mark paid (no redirect).'
              : 'Wallet is simulated — confirm to mark paid.'}
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Processing…' : 'Confirm Payment (Simulated)'}
        </button>
      </form>

      <div className="section-label">Your Payment History</div>
      {history.length === 0 && <div className="empty-state">No payment history yet.</div>}
      {history.map((p) => {
        const paid = Number(p.amount) || 0;
        const refunded = Number(p.refundAmount) || 0;
        const feeKept = p.status === 'REFUNDED' ? Math.max(0, paid - refunded) : 0;
        return (
          <div className="card" key={p.id}>
            <div className="card-row">
              <div>
                <div className="card-title">
                  #{p.id} — Rs. {p.amount}
                  {p.method ? ` · ${p.method}` : ''}
                </div>
                <div className="card-meta">
                  Reservation #{p.reservationId}
                  {p.discountCodeUsed ? ` · Code ${p.discountCodeUsed}` : ''}
                  {p.status === 'REFUNDED' && (
                    <>
                      {` · Refunded Rs. ${refunded.toFixed(2)}`}
                      {feeKept > 0 ? ` · Fee kept Rs. ${feeKept.toFixed(2)}` : ' · Full refund (no fee)'}
                    </>
                  )}
                  {p.overstayPenalty > 0 ? ` · +Rs. ${p.overstayPenalty} overstay` : ''}
                </div>
              </div>
              {statusBadge(p.status)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
