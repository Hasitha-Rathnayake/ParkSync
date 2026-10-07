package com.parksync.pricing.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** STRATEGY concrete — wraps another strategy and applies a percentage discount. */
public class PercentageOffStrategy implements PricingStrategy {
    private final PricingStrategy inner;
    private final BigDecimal percentOff;

    public PercentageOffStrategy(PricingStrategy inner, BigDecimal percentOff) {
        this.inner = inner;
        this.percentOff = percentOff == null ? BigDecimal.ZERO : percentOff;
    }

    @Override
    public BigDecimal calculate(BigDecimal hours, BigDecimal baseHourly, BigDecimal peakHourly) {
        BigDecimal full = inner.calculate(hours, baseHourly, peakHourly);
        if (percentOff.compareTo(BigDecimal.ZERO) <= 0) return full;
        BigDecimal off = full.multiply(percentOff).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        return full.subtract(off).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public String name() { return "PERCENT_OFF(" + inner.name() + ")"; }
}
