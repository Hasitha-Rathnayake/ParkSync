package com.parksync.reservation.state;

import com.parksync.reservation.Reservation;

/**
 * Member pattern: STATE (Behavioral).
 * Guards allowed status transitions for reservations.
 * Used by: PaymentService when confirming payment.
 */
public final class ReservationStatusState {

    private ReservationStatusState() {}

    public static void assertCanPay(Reservation.ReservationStatus current) {
        if (current != Reservation.ReservationStatus.PENDING_PAYMENT) {
            throw new IllegalStateException(
                    "Only PENDING_PAYMENT reservations can be paid (current=" + current + ")");
        }
    }

    public static void assertCanCancel(Reservation.ReservationStatus current) {
        if (current == Reservation.ReservationStatus.CANCELLED) {
            throw new IllegalStateException("Reservation is already cancelled");
        }
        if (current == Reservation.ReservationStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed reservation");
        }
    }

    public static Reservation.ReservationStatus afterSuccessfulPayment() {
        return Reservation.ReservationStatus.CONFIRMED;
    }
}
