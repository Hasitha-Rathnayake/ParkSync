package com.parksync.pricing;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "pricing_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PricingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Parking lot is required")
    private Long parkingLotId;

    @NotNull(message = "Base rate is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Base rate must be greater than 0")
    private BigDecimal baseRatePerHour;

    @NotNull(message = "Peak rate is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Peak rate must be greater than 0")
    private BigDecimal peakRatePerHour;

    @Min(value = 0, message = "Peak start hour must be 0-23") @Max(value = 23, message = "Peak start hour must be 0-23")
    private int peakStartHour;

    @Min(value = 0, message = "Peak end hour must be 0-23") @Max(value = 23, message = "Peak end hour must be 0-23")
    private int peakEndHour;

    private String discountCode; // nullable

    @DecimalMin(value = "0.0", message = "Discount % cannot be negative")
    @DecimalMax(value = "100.0", message = "Discount % cannot exceed 100")
    private BigDecimal discountPercentage;

    @DecimalMin(value = "0.0", message = "Cancellation fee % cannot be negative")
    @DecimalMax(value = "100.0", message = "Cancellation fee % cannot exceed 100")
    private BigDecimal cancellationFeePercentage;

    @Min(value = 0, message = "Free cancellation window cannot be negative")
    private int freeCancellationWindowMinutes;

    @DecimalMin(value = "1.0", message = "Overstay multiplier must be at least 1.0")
    private BigDecimal overstayMultiplier;

    private boolean active = true;
}
