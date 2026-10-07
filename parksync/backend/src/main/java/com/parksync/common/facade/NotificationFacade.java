package com.parksync.common.facade;

import com.parksync.notification.Notification;
import com.parksync.notification.NotificationService;
import org.springframework.stereotype.Component;

/**
 * Member pattern: FACADE (Structural).
 * Simple front for notification helpers so other modules call one place.
 */
@Component
public class NotificationFacade {

    private final NotificationService notificationService;

    public NotificationFacade(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    public Notification bookingPlaced(Long userId, Long reservationId) {
        return notificationService.send(userId, reservationId,
                "Booking #" + reservationId + " placed. Please pay within 15 minutes.",
                Notification.NotificationType.BOOKING_CREATED);
    }

    public Notification paymentReceived(Long userId, Long reservationId, String amount) {
        return notificationService.send(userId, reservationId,
                "Payment received for booking #" + reservationId + " — amount Rs. " + amount,
                Notification.NotificationType.RECEIPT);
    }
}
