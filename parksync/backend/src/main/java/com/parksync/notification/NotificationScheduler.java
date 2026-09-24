package com.parksync.notification;

import com.parksync.reservation.Reservation;
import com.parksync.reservation.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Payment-window countdowns, end-of-booking "time over", and overstay+5min warnings.
 * Reminder ~15 min before end is also handled here (replaces narrow ReminderScheduler window).
 */
@Component
public class NotificationScheduler {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private NotificationService notificationService;

    @Scheduled(fixedRate = 30000) // every 30s
    public void runNotificationJobs() {
        LocalDateTime now = LocalDateTime.now();

        // --- PENDING_PAYMENT: 10 / 5 / 1 minute remaining ---
        List<Reservation> pending = reservationRepository.findByStatus(Reservation.ReservationStatus.PENDING_PAYMENT);
        for (Reservation res : pending) {
            if (res.getPaymentDeadline() == null) continue;
            long minsLeft = ChronoUnit.MINUTES.between(now, res.getPaymentDeadline());
            // fire when we enter each threshold band
            if (minsLeft <= 10 && minsLeft > 5) {
                notificationService.sendPaymentReminderOnce(res.getUserId(), res.getId(), 10,
                        "Payment reminder: 10 minutes left to pay for booking #" + res.getId()
                                + " or the slot will be released.");
            } else if (minsLeft <= 5 && minsLeft > 1) {
                notificationService.sendPaymentReminderOnce(res.getUserId(), res.getId(), 5,
                        "Payment reminder: only 5 minutes left to pay for booking #" + res.getId() + ".");
            } else if (minsLeft <= 1 && minsLeft >= 0) {
                notificationService.sendPaymentReminderOnce(res.getUserId(), res.getId(), 1,
                        "Last chance: about 1 minute left to pay for booking #" + res.getId() + ".");
            }
        }

        // --- CONFIRMED bookings: 15-min-before reminder, time-over, overstay+5 ---
        List<Reservation> confirmed = reservationRepository.findByStatus(Reservation.ReservationStatus.CONFIRMED);
        for (Reservation res : confirmed) {
            LocalDateTime end = res.getEndTime();
            if (end == null) continue;

            long minsToEnd = ChronoUnit.MINUTES.between(now, end);

            // ~15 minutes before end
            if (minsToEnd <= 15 && minsToEnd >= 14) {
                notificationService.sendOnce(res.getUserId(), res.getId(),
                        "Reminder: your ParkSync reservation #" + res.getId() + " ends in about 15 minutes.",
                        Notification.NotificationType.REMINDER);
            }

            // At / just after end time
            if (!now.isBefore(end) && now.isBefore(end.plusMinutes(5))) {
                notificationService.notifyTimeOver(res);
            }

            // 5+ minutes after end → overstay penalty warning
            if (!now.isBefore(end.plusMinutes(5))) {
                notificationService.notifyOverstayWarning(res);
            }
        }
    }
}
