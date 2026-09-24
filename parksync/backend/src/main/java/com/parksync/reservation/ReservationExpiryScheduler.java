package com.parksync.reservation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

// NEW feature: runs automatically every minute, checking for reservations
// still stuck at PENDING_PAYMENT past their 15-minute deadline, and
// auto-cancels them - the same "temporary hold expires" pattern used by
// flight and event-ticket booking sites, so one indecisive customer can't
// block a slot forever.
@Component
public class ReservationExpiryScheduler {

    @Autowired
    private ReservationRepository reservationRepository;

    @Scheduled(fixedRate = 60000)
    public void cancelExpiredPendingReservations() {
        List<Reservation> expired = reservationRepository.findByStatusAndPaymentDeadlineBefore(
                Reservation.ReservationStatus.PENDING_PAYMENT, LocalDateTime.now());

        for (Reservation res : expired) {
            res.setStatus(Reservation.ReservationStatus.CANCELLED);
            reservationRepository.save(res);
        }
    }
}
