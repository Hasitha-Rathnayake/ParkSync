package com.parksync.notification;

import com.parksync.reservation.Reservation;
import com.parksync.reservation.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    public Notification send(Long userId, String message, Notification.NotificationType type) {
        return send(userId, null, message, type);
    }

    public Notification send(Long userId, Long reservationId, String message, Notification.NotificationType type) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setReservationId(reservationId);
        n.setMessage(message);
        n.setType(type);
        n.setSentAt(LocalDateTime.now());
        n.setReadFlag(false);
        return notificationRepository.save(n);
    }

    /** Send once per reservation + type (avoids scheduler spam). */
    public Notification sendOnce(Long userId, Long reservationId, String message, Notification.NotificationType type) {
        if (reservationId != null && notificationRepository.existsByReservationIdAndType(reservationId, type)) {
            return null;
        }
        return send(userId, reservationId, message, type);
    }

    /** Payment-window reminders use different messages; key by type + minute fragment. */
    public Notification sendPaymentReminderOnce(Long userId, Long reservationId, int minutesLeft, String message) {
        String tag = minutesLeft + " min";
        if (reservationId != null
                && notificationRepository.existsByReservationIdAndTypeAndMessageContaining(
                        reservationId, Notification.NotificationType.PAYMENT_REMINDER, tag)) {
            return null;
        }
        return send(userId, reservationId, message, Notification.NotificationType.PAYMENT_REMINDER);
    }

    // ---- Event helpers used by other modules ----

    public void notifyBookingCreated(Reservation res) {
        send(res.getUserId(), res.getId(),
                "Booking #" + res.getId() + " placed. Please pay within 15 minutes or the slot will be released.",
                Notification.NotificationType.BOOKING_CREATED);
    }

    public void notifyBookingConfirmed(Reservation res) {
        sendOnce(res.getUserId(), res.getId(),
                "Payment received — booking #" + res.getId() + " is confirmed. Slot "
                        + (res.getParkingSlot() != null ? res.getParkingSlot().getSlotCode() : "")
                        + " · " + res.getStartTime() + " → " + res.getEndTime() + ".",
                Notification.NotificationType.BOOKING_CONFIRMATION);
    }

    public void notifyBookingUpdated(Reservation res) {
        send(res.getUserId(), res.getId(),
                "Booking #" + res.getId() + " was updated. New time: "
                        + res.getStartTime() + " → " + res.getEndTime()
                        + (res.getParkingSlot() != null ? " · Slot " + res.getParkingSlot().getSlotCode() : "") + ".",
                Notification.NotificationType.BOOKING_UPDATE);
    }

    public void notifyBookingCancelled(Reservation res) {
        send(res.getUserId(), res.getId(),
                "Booking #" + res.getId() + " was cancelled."
                        + (res.getStatus() == Reservation.ReservationStatus.CANCELLED
                        ? " Any refund will appear under Payments if you had already paid." : ""),
                Notification.NotificationType.BOOKING_CANCELLED);
    }

    public void notifyTicketCreated(Long userId, Long reservationId, Long ticketId, String plate) {
        send(userId, reservationId,
                "Checked in — e-ticket #" + ticketId + " issued for vehicle " + plate + ". Have a good stay!",
                Notification.NotificationType.TICKET_CREATED);
    }

    public void notifyTicketClosed(Long userId, Long reservationId, Long ticketId, boolean overstayed) {
        String msg = "Checked out — e-ticket #" + ticketId + " closed. Thank you for parking with ParkSync.";
        if (overstayed) {
            msg += " Overstay was recorded; any penalty is on your payment record.";
        }
        send(userId, reservationId, msg, Notification.NotificationType.TICKET_CLOSED);
        // Ask for review once after visit
        if (reservationId != null) {
            sendOnce(userId, reservationId,
                    "How was your visit? Please leave a 1–5 star review under Notifications & Reviews.",
                    Notification.NotificationType.REVIEW_REQUEST);
        }
    }

    public void notifyTimeOver(Reservation res) {
        sendOnce(res.getUserId(), res.getId(),
                "Your booking #" + res.getId() + " end time has been reached. Please check out at the lot soon.",
                Notification.NotificationType.TIME_OVER);
    }

    public void notifyOverstayWarning(Reservation res) {
        sendOnce(res.getUserId(), res.getId(),
                "You are more than 5 minutes past your booking end time for #" + res.getId()
                        + ". An overstay penalty will apply on check-out.",
                Notification.NotificationType.OVERSTAY_WARNING);
    }

    public List<Notification> getHistory(Long userId) {
        return notificationRepository.findByUserIdOrderBySentAtDesc(userId);
    }

    public void markRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setReadFlag(true);
            notificationRepository.save(n);
        });
    }

    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    // ---- Reviews ----

    /**
     * Customer may review only after the visit is COMPLETED, once per reservation.
     * No edit after submit. Admin cannot delete (controller blocks delete).
     */
    public Review submitReview(Review review) {
        if (reviewRepository.existsByReservationId(review.getReservationId())) {
            throw new IllegalStateException("You already submitted a review for this reservation.");
        }
        Reservation res = reservationRepository.findById(review.getReservationId())
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found."));
        if (!res.getUserId().equals(review.getUserId())) {
            throw new IllegalStateException("You can only review your own bookings.");
        }
        if (res.getStatus() != Reservation.ReservationStatus.COMPLETED) {
            throw new IllegalStateException("You can review only after your visit is completed (checked out).");
        }
        if (res.getParkingSlot() != null && res.getParkingSlot().getParkingLot() != null) {
            review.setParkingLotId(res.getParkingSlot().getParkingLot().getId());
        }
        if (review.getRating() < 1 || review.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars.");
        }
        review.setCreatedAt(LocalDateTime.now());
        review.setAdminResponse(null);
        review.setFlaggedAsSpam(false);
        return reviewRepository.save(review);
    }

    public List<Review> getReviewsForLot(Long lotId) {
        return reviewRepository.findByParkingLotIdOrderByCreatedAtDesc(lotId);
    }

    public double getAverageRating(Long lotId) {
        List<Review> reviews = reviewRepository.findByParkingLotId(lotId);
        if (reviews.isEmpty()) return 0.0;
        return reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
    }

    public Review respondToReview(Long reviewId, String response) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found: " + reviewId));
        review.setAdminResponse(response);
        return reviewRepository.save(review);
    }

    public Review flagAsSpam(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found: " + reviewId));
        review.setFlaggedAsSpam(true);
        return reviewRepository.save(review);
    }

    // Admin cannot delete reviews — method kept only if ever needed internally
}
