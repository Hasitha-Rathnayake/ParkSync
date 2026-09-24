import { useState, useEffect } from 'react';
import {
  getNotificationHistory, submitReview, getEligibleReviewReservations,
  getReviewsForLot, getAverageRating, respondToReview, flagReviewSpam, markNotificationRead,
} from '../api/notificationApi';
import { getAllLots } from '../api/parkingLotApi';
import { useAuth } from '../context/AuthContext';
import { canManageReviews } from '../utils/roles';
import SearchableSelect from '../components/SearchableSelect';

const PRESET_REPLIES = [
  'Thank you for your feedback! We appreciate your visit.',
  'Thanks for the kind words — we hope to see you again.',
  'We are sorry your experience was not perfect. We will work on improvements.',
  'Thank you for reporting this. Our team will look into it.',
];

export default function NotificationReviewPage() {
  const { user } = useAuth();
  if (!user) {
    return (
      <div className="page">
        <h1 className="page-title">Notifications & Reviews</h1>
        <div className="alert alert-error">Please log in to view this page.</div>
      </div>
    );
  }
  return canManageReviews(user.role)
    ? <AdminReviewModeration />
    : <CustomerNotifications user={user} />;
}

function CustomerNotifications({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [selectedResId, setSelectedResId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const load = () => {
    getNotificationHistory(user.id).then((res) => setNotifications(res.data));
    getEligibleReviewReservations(user.id).then((res) => setEligible(res.data || [])).catch(() => setEligible([]));
  };

  useEffect(() => { load(); }, [user.id]);

  const eligibleOptions = eligible.map((r) => ({
    value: r.reservationId,
    label: `#${r.reservationId} — ${r.lotName || 'Lot'} / ${r.slotCode || 'slot'}`,
    sublabel: r.endTime ? `Completed ${new Date(r.endTime).toLocaleString()}` : '',
  }));

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewNotice('');
    if (!selectedResId) {
      setReviewError('Select a completed visit to review.');
      return;
    }
    const row = eligible.find((r) => String(r.reservationId) === String(selectedResId));
    try {
      await submitReview({
        userId: user.id,
        reservationId: Number(selectedResId),
        parkingLotId: row?.parkingLotId || 0,
        rating,
        comment,
      });
      setReviewNotice('Review submitted — thank you! You cannot edit it after submit.');
      setSelectedResId('');
      setComment('');
      setRating(5);
      load();
    } catch (err) {
      setReviewError(typeof err.response?.data === 'string' ? err.response.data : 'Could not submit review.');
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Notifications & Reviews</h1>
      <p className="page-subtitle">
        Booking alerts, payment countdowns, check-in/out messages, and a place to rate completed visits.
      </p>

      <div className="section-label">Your Notifications</div>
      {notifications.length === 0 && <div className="empty-state">No notifications yet.</div>}
      {notifications.map((n) => (
        <div className="card" key={n.id} style={{ opacity: n.readFlag ? 0.75 : 1 }}>
          <div className="card-row">
            <div>
              <span className="badge badge-pending">{n.type}</span>
              <div className="card-meta" style={{ marginTop: 8 }}>{n.message}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="card-meta">{n.sentAt ? new Date(n.sentAt).toLocaleString() : ''}</div>
              {!n.readFlag && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 6 }}
                  onClick={() => markNotificationRead(n.id).then(load)}
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="section-label">Leave a Review</div>
      <p className="card-meta" style={{ marginBottom: 12 }}>
        Only completed visits (after check-out) appear below. After you submit, the review cannot be edited or deleted.
      </p>
      <form className="form-card" onSubmit={handleSubmitReview}>
        {reviewError && <div className="alert alert-error">{reviewError}</div>}
        {reviewNotice && <div className="alert alert-success">{reviewNotice}</div>}
        <div className="field">
          <label>Completed visit</label>
          <SearchableSelect
            options={eligibleOptions}
            value={selectedResId}
            onSelect={setSelectedResId}
            placeholder={eligibleOptions.length ? 'Select a completed booking…' : 'No visits left to review'}
          />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Rating</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`btn btn-sm ${rating === n ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRating(n)}
              >
                {n} ★
              </button>
            ))}
            <span className="stars" style={{ marginLeft: 8 }}>{stars(rating)}</span>
          </div>
        </div>
        <div className="field" style={{ marginTop: 12, marginBottom: 16 }}>
          <label>Additional comments</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell others about your parking experience…"
            rows={3}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={!selectedResId}>
          Submit Review
        </button>
      </form>
    </div>
  );
}

function AdminReviewModeration() {
  const [lots, setLots] = useState([]);
  const [lotId, setLotId] = useState('');
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [responseDrafts, setResponseDrafts] = useState({});
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  useEffect(() => {
    getAllLots().then((res) => setLots(res.data));
  }, []);

  const lotOptions = lots.map((l) => ({ value: l.id, label: l.name, sublabel: l.address }));

  const loadReviews = async (id) => {
    setLotId(id);
    const res = await getReviewsForLot(id);
    setReviews(res.data);
    const avg = await getAverageRating(id);
    setAvgRating(avg.data);
  };

  const handleRespond = async (reviewId, text) => {
    const body = text ?? responseDrafts[reviewId] ?? '';
    if (!body.trim()) return;
    await respondToReview(reviewId, body);
    loadReviews(lotId);
  };

  return (
    <div className="page">
      <h1 className="page-title">Review Moderation</h1>
      <p className="page-subtitle">
        View customer reviews for a lot. Reply with a custom message or a preset. Reviews cannot be deleted.
      </p>

      <div className="form-card">
        <div className="field">
          <label>Search for a lot by name</label>
          <SearchableSelect options={lotOptions} value={lotId} onSelect={loadReviews} placeholder="Start typing a lot name…" />
        </div>
      </div>

      {avgRating !== null && (
        <div className="alert alert-info">
          Average rating: <span className="stars">{stars(Math.round(avgRating))}</span> ({Number(avgRating).toFixed(1)})
        </div>
      )}
      {reviews.length === 0 && <div className="empty-state">No reviews to show yet — search for a lot above.</div>}
      {reviews.map((r) => (
        <div className="card" key={r.id}>
          <div className="card-row">
            <div className="stars">{stars(r.rating)}</div>
            {r.flaggedAsSpam && <span className="badge badge-cancelled">Flagged</span>}
          </div>
          <div className="card-meta" style={{ marginTop: 6 }}>{r.comment || '(no comment)'}</div>
          <div className="card-meta">Reservation #{r.reservationId} · {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
          {r.adminResponse ? (
            <div className="alert alert-info" style={{ marginTop: 10 }}>Admin reply: {r.adminResponse}</div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {PRESET_REPLIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRespond(r.id, p)}
                  >
                    {p.length > 40 ? p.slice(0, 40) + '…' : p}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Custom reply…"
                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', color: 'var(--text)' }}
                  value={responseDrafts[r.id] || ''}
                  onChange={(e) => setResponseDrafts({ ...responseDrafts, [r.id]: e.target.value })}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRespond(r.id)}>Reply</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => flagReviewSpam(r.id).then(() => loadReviews(lotId))}>Flag</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
