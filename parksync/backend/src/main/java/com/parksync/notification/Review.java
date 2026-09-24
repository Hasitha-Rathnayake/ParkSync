package com.parksync.notification;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Parking lot ID is required")
    private Long parkingLotId;

    @NotNull(message = "Reservation ID is required")
    private Long reservationId;

    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private int rating;

    @Size(max = 500, message = "Comment must be under 500 characters")
    private String comment;

    private String adminResponse;

    private boolean flaggedAsSpam = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}
