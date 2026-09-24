package com.parksync.notification;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "User ID is required")
    private Long userId;

    // Optional link so we can avoid duplicate reminders for the same booking
    private Long reservationId;

    @NotBlank(message = "Notification message is required")
    @Size(max = 500, message = "Message must be under 500 characters")
    private String message;

    @NotNull(message = "Notification type is required")
    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private NotificationType type;

    private LocalDateTime sentAt;

    private boolean readFlag = false;

    public enum NotificationType {
        BOOKING_CREATED,          // booking placed, pay within 15 min
        PAYMENT_REMINDER,         // 10 / 5 / 1 min left to pay
        BOOKING_CONFIRMATION,     // paid successfully
        BOOKING_UPDATE,          // time or slot changed
        BOOKING_CANCELLED,
        REMINDER,                 // ~15 min before booked end
        TIME_OVER,                // booked end time reached
        OVERSTAY_WARNING,         // 5 min after end — penalty applies
        TICKET_CREATED,           // checked in
        TICKET_CLOSED,            // checked out / receipt
        REVIEW_REQUEST,           // ask for review after visit
        RECEIPT                   // alias kept for compatibility
    }
}
