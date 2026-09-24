package com.parksync.reservation;

import com.parksync.parkinglot.ParkingSlot;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Please select which vehicle you're bringing")
    private Long vehicleId; // references vehicle.Vehicle - must belong to this userId

    @NotNull(message = "A parking slot must be selected")
    @ManyToOne
    @JoinColumn(name = "parking_slot_id")
    private ParkingSlot parkingSlot;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    // NEW: a booking now starts as PENDING_PAYMENT, not CONFIRMED. Only
    // flips to CONFIRMED once PaymentService successfully charges it.
    // length=30 is explicit: Hibernate otherwise sizes an enum column to the
    // longest value that existed when the table was FIRST created, and
    // ddl-auto=update won't widen it later - which breaks inserts the moment
    // you add a longer status name like PENDING_PAYMENT.
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ReservationStatus status = ReservationStatus.PENDING_PAYMENT;

    // NEW: the moment payment must be completed by. Set to createdAt + 15
    // minutes when the reservation is created. ReservationExpiryScheduler
    // auto-cancels anything still PENDING_PAYMENT past this time, freeing
    // the slot for someone else - the same pattern real ticket/flight
    // booking sites use for a temporary seat hold.
    private LocalDateTime paymentDeadline;

    public enum ReservationStatus {
        PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED
    }
}
