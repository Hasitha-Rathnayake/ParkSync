package com.parksync.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByParkingSlotIdAndStatus(Long slotId, Reservation.ReservationStatus status);
    List<Reservation> findByParkingSlotIdAndStatusIn(Long slotId, List<Reservation.ReservationStatus> statuses);
    List<Reservation> findByUserId(Long userId);
    List<Reservation> findByStatus(Reservation.ReservationStatus status);
    // Admin oversight - all reservations across every slot in a given lot
    List<Reservation> findByParkingSlot_ParkingLot_Id(Long parkingLotId);
    // Used by ReservationExpiryScheduler to find bookings whose payment window has passed
    List<Reservation> findByStatusAndPaymentDeadlineBefore(Reservation.ReservationStatus status, LocalDateTime cutoff);
}
