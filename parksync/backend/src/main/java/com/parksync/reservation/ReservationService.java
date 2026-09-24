package com.parksync.reservation;

import com.parksync.parkinglot.ParkingSlot;
import com.parksync.parkinglot.ParkingSlotRepository;
import com.parksync.payment.PaymentService;
import com.parksync.notification.NotificationService;
import com.parksync.vehicle.Vehicle;
import com.parksync.vehicle.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private ParkingSlotRepository parkingSlotRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private NotificationService notificationService;

    private static final int BUFFER_MINUTES = 15;
    private static final int PAYMENT_WINDOW_MINUTES = 15;

    // A slot counts as "taken" for overlap purposes if there's a CONFIRMED
    // booking on it, OR another booking still waiting on payment.
    private static final List<Reservation.ReservationStatus> BLOCKING_STATUSES =
            Arrays.asList(Reservation.ReservationStatus.CONFIRMED, Reservation.ReservationStatus.PENDING_PAYMENT);

    // Shared overlap/buffer check used by both create and edit, so a booking
    // can't be edited into colliding with someone else's reservation either.
    // excludeReservationId lets an edit ignore the reservation's OWN existing
    // row when checking for conflicts.
    private void validateNoOverlap(Long slotId, LocalDateTime start, LocalDateTime end, Long excludeReservationId) {
        List<Reservation> existing = reservationRepository.findByParkingSlotIdAndStatusIn(slotId, BLOCKING_STATUSES);
        for (Reservation existingRes : existing) {
            if (excludeReservationId != null && existingRes.getId().equals(excludeReservationId)) continue;

            LocalDateTime bufferedStart = existingRes.getStartTime().minusMinutes(BUFFER_MINUTES);
            LocalDateTime bufferedEnd = existingRes.getEndTime().plusMinutes(BUFFER_MINUTES);
            boolean overlaps = start.isBefore(bufferedEnd) && end.isAfter(bufferedStart);
            if (overlaps) {
                throw new IllegalStateException(
                        "This slot is already booked (or within the " + BUFFER_MINUTES +
                        "-minute buffer) for the requested time.");
            }
        }
    }

    // CREATE - book a slot, with full validation + overlap/buffer check.
    // Starts as PENDING_PAYMENT with a 15-minute deadline, not CONFIRMED.
    public Reservation createReservation(Reservation newRes) {
        if (!newRes.getStartTime().isBefore(newRes.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }
        if (newRes.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("You cannot book a slot in the past.");
        }

        // The slot arrives from the frontend as just { id: X } - fetch the
        // REAL persisted slot so status checks and the lot relationship
        // (needed later for auto-pricing) actually work, instead of
        // silently checking a mostly-empty stub object.
        ParkingSlot slot = parkingSlotRepository.findById(newRes.getParkingSlot().getId())
                .orElseThrow(() -> new RuntimeException("Parking slot not found"));
        if (slot.getStatus() == ParkingSlot.SlotStatus.MAINTENANCE) {
            throw new IllegalStateException("This slot is currently under maintenance and cannot be booked.");
        }

        Vehicle vehicle = vehicleRepository.findById(newRes.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Selected vehicle not found."));
        if (!vehicle.getUserId().equals(newRes.getUserId())) {
            throw new IllegalArgumentException("That vehicle does not belong to you.");
        }

        validateNoOverlap(slot.getId(), newRes.getStartTime(), newRes.getEndTime(), null);

        newRes.setParkingSlot(slot);
        newRes.setStatus(Reservation.ReservationStatus.PENDING_PAYMENT);
        newRes.setPaymentDeadline(LocalDateTime.now().plusMinutes(PAYMENT_WINDOW_MINUTES));
        Reservation saved = reservationRepository.save(newRes);
        try {
            notificationService.notifyBookingCreated(saved);
        } catch (Exception ignored) { }
        return saved;
    }

    // READ - a customer's bookings
    public List<Reservation> getReservationsByUser(Long userId) {
        return reservationRepository.findByUserId(userId);
    }

    // READ (admin oversight) - all reservations across every slot in a lot
    public List<Reservation> getReservationsForLot(Long parkingLotId) {
        return reservationRepository.findByParkingSlot_ParkingLot_Id(parkingLotId);
    }

    // READ - one reservation
    public Reservation getReservation(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + id));
    }

    // UPDATE - change time and/or slot before check-in. Allowed while
    // PENDING_PAYMENT or CONFIRMED. Re-checks overlap/buffer on the target
    // slot. If already paid, recalculates the charge; if the new slot is in a
    // different lot, switches to that lot's active pricing rule.
    public Reservation updateReservation(Long id, LocalDateTime newStart, LocalDateTime newEnd) {
        return updateReservation(id, newStart, newEnd, null);
    }

    public Reservation updateReservation(Long id, LocalDateTime newStart, LocalDateTime newEnd, Long newSlotId) {
        Reservation res = getReservation(id);
        if (res.getStatus() != Reservation.ReservationStatus.CONFIRMED
                && res.getStatus() != Reservation.ReservationStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Only an active reservation can be modified.");
        }
        if (!newStart.isBefore(newEnd)) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }
        if (newStart.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("You cannot move a booking to a time in the past.");
        }

        Long targetSlotId = res.getParkingSlot().getId();
        Long newLotId = null;

        if (newSlotId != null && !newSlotId.equals(res.getParkingSlot().getId())) {
            ParkingSlot newSlot = parkingSlotRepository.findById(newSlotId)
                    .orElseThrow(() -> new RuntimeException("Parking slot not found: " + newSlotId));
            if (newSlot.getStatus() == ParkingSlot.SlotStatus.MAINTENANCE) {
                throw new IllegalStateException("That slot is under maintenance and cannot be booked.");
            }
            if (newSlot.getStatus() == ParkingSlot.SlotStatus.OCCUPIED) {
                throw new IllegalStateException("That slot is currently occupied.");
            }
            targetSlotId = newSlot.getId();
            Long oldLotId = res.getParkingSlot().getParkingLot() != null
                    ? res.getParkingSlot().getParkingLot().getId() : null;
            Long candidateLotId = newSlot.getParkingLot() != null ? newSlot.getParkingLot().getId() : null;
            if (candidateLotId != null && (oldLotId == null || !candidateLotId.equals(oldLotId))) {
                newLotId = candidateLotId;
            }
            res.setParkingSlot(newSlot);
        }

        validateNoOverlap(targetSlotId, newStart, newEnd, res.getId());

        res.setStartTime(newStart);
        res.setEndTime(newEnd);
        Reservation saved = reservationRepository.save(res);

        if (saved.getStatus() == Reservation.ReservationStatus.CONFIRMED) {
            paymentService.recalculateForEdit(saved.getId(), newStart, newEnd, newLotId);
        }
        try {
            notificationService.notifyBookingUpdated(saved);
        } catch (Exception ignored) { }
        return saved;
    }

    // UPDATE - called by PaymentService once payment succeeds
    public Reservation confirmReservation(Long id) {
        Reservation res = getReservation(id);
        res.setStatus(Reservation.ReservationStatus.CONFIRMED);
        return reservationRepository.save(res);
    }

    // DELETE (cancel) - allowed any time before check-in. If nothing's been
    // paid yet (still PENDING_PAYMENT), this is a free, instant cancel - no
    // fee, since no money changed hands. If it was already CONFIRMED (paid),
    // automatically triggers PaymentService's tiered refund (free if cancelled
    // well ahead, a percentage fee if cancelled close to the start time).
    public Reservation cancelReservation(Long id) {
        Reservation res = getReservation(id);
        if (res.getStatus() == Reservation.ReservationStatus.CANCELLED) {
            throw new IllegalStateException("This reservation is already cancelled.");
        }

        boolean wasPaid = res.getStatus() == Reservation.ReservationStatus.CONFIRMED;
        res.setStatus(Reservation.ReservationStatus.CANCELLED);
        Reservation saved = reservationRepository.save(res);

        if (wasPaid) {
            paymentService.refundForCancellation(id);
        }
        try {
            notificationService.notifyBookingCancelled(saved);
        } catch (Exception ignored) { }
        return saved;
    }
}
