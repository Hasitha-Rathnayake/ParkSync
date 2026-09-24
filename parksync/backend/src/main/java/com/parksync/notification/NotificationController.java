package com.parksync.notification;

import com.parksync.reservation.Reservation;
import com.parksync.reservation.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @PostMapping("/send")
    public Notification send(@RequestParam Long userId, @RequestParam String message,
                             @RequestParam Notification.NotificationType type) {
        return notificationService.send(userId, message, type);
    }

    @GetMapping("/user/{userId}")
    public List<Notification> history(@PathVariable Long userId) {
        return notificationService.getHistory(userId);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
    }

    // ---- Reviews ----

    @PostMapping("/reviews")
    public ResponseEntity<?> submitReview(@Valid @RequestBody Review review) {
        try {
            return ResponseEntity.ok(notificationService.submitReview(review));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    /** Completed visits this customer can still review. */
    @GetMapping("/reviews/eligible/{userId}")
    public List<Map<String, Object>> eligibleReviews(@PathVariable Long userId) {
        List<Reservation> completed = reservationRepository.findByUserId(userId).stream()
                .filter(r -> r.getStatus() == Reservation.ReservationStatus.COMPLETED)
                .toList();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Reservation r : completed) {
            if (reviewRepository.existsByReservationId(r.getId())) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("reservationId", r.getId());
            row.put("startTime", r.getStartTime());
            row.put("endTime", r.getEndTime());
            if (r.getParkingSlot() != null) {
                row.put("slotCode", r.getParkingSlot().getSlotCode());
                if (r.getParkingSlot().getParkingLot() != null) {
                    row.put("parkingLotId", r.getParkingSlot().getParkingLot().getId());
                    row.put("lotName", r.getParkingSlot().getParkingLot().getName());
                }
            }
            out.add(row);
        }
        return out;
    }

    /** Public-facing reviews for a lot (customers browsing / choosing a lot). */
    @GetMapping("/reviews/lot/{lotId}")
    public List<Review> reviewsForLot(@PathVariable Long lotId) {
        return notificationService.getReviewsForLot(lotId);
    }

    @GetMapping("/reviews/lot/{lotId}/average")
    public double averageRating(@PathVariable Long lotId) {
        return notificationService.getAverageRating(lotId);
    }

    @PutMapping("/reviews/{id}/respond")
    public Review respond(@PathVariable Long id, @RequestParam String response) {
        return notificationService.respondToReview(id, response);
    }

    @PutMapping("/reviews/{id}/flag-spam")
    public Review flagSpam(@PathVariable Long id) {
        return notificationService.flagAsSpam(id);
    }

    // DELETE reviews intentionally removed — admin cannot delete customer reviews
}
