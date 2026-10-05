package com.parksync.pricing;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "special_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SpecialPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String name; // e.g. "Vesak Festival Special"

    @Size(max = 500)
    private String description;

    /** FESTIVAL, SEASONAL, WEEKEND, PROMO */
    @NotBlank
    @Size(max = 30)
    private String packageType = "PROMO";

    /** Lot this package applies to (required for lot admin) */
    @NotNull
    private Long parkingLotId;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    /** Extra % off on top of / instead of normal discount — applied on final amount */
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    /** Optional promo image path under uploads/ */
    @Size(max = 255)
    private String imagePath;

    private boolean active = true;
}
