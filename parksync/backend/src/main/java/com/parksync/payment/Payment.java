package com.parksync.payment;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Reservation ID is required")
    private Long reservationId;

    @NotNull(message = "User ID is required")
    private Long userId;

    // Remembered so a later edit or cancellation can recalculate/refund
    // using the SAME rule that was applied at charge time, without asking
    // the customer to re-enter a pricing rule ID they never knew anyway.
    private Long pricingRuleId;

    @Size(max = 50, message = "Discount code must be under 50 characters")
    private String discountCodeUsed;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Amount cannot be negative")
    private BigDecimal amount;

    @DecimalMin(value = "0.0", inclusive = true, message = "Refund amount cannot be negative")
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "Overstay penalty cannot be negative")
    private BigDecimal overstayPenalty = BigDecimal.ZERO;

    @NotNull(message = "Payment method is required")
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private PaymentMethod method; // simulated - no real transaction

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private PaymentStatus status = PaymentStatus.PENDING;

    private LocalDateTime paidAt;

    public enum PaymentMethod {
        CARD, PAYPAL, WALLET
    }

    public enum PaymentStatus {
        PENDING, PAID, REFUNDED
    }
}
