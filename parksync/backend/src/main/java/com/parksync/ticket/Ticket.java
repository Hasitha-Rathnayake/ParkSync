package com.parksync.ticket;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // null = walk-in (no prior reservation)
    private Long reservationId;

    @NotNull(message = "A parking slot must be selected at check-in")
    private Long parkingSlotId;

    @NotBlank(message = "Vehicle plate number is required")
    @Size(min = 2, max = 20, message = "Plate number must be between 2 and 20 characters")
    private String vehiclePlateNumber;

    private LocalDateTime entryTime;
    private LocalDateTime exitTime;

    // Flagged if exit is after booked end + grace; penalty uses existing PaymentService rules
    private boolean overstayed = false;

    // After check-out the slot stays held until this time (10 min buffer), then auto-released
    private LocalDateTime slotReleaseAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private TicketStatus status = TicketStatus.ACTIVE;

    public enum TicketStatus {
        ACTIVE, COMPLETED, VOID
    }
}
