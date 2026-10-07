package com.parksync.pricing.strategy;

import java.math.BigDecimal;

/** Member pattern: STRATEGY (Behavioral) — interchangeable pricing algorithms. */
public interface PricingStrategy {
    BigDecimal calculate(BigDecimal hours, BigDecimal baseHourly, BigDecimal peakHourly);
    String name();
}
