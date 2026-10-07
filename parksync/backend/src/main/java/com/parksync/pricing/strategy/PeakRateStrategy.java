package com.parksync.pricing.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** STRATEGY concrete — peak hourly rate. */
public class PeakRateStrategy implements PricingStrategy {
    @Override
    public BigDecimal calculate(BigDecimal hours, BigDecimal baseHourly, BigDecimal peakHourly) {
        BigDecimal rate = peakHourly != null ? peakHourly : baseHourly;
        return hours.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }
    @Override
    public String name() { return "PEAK_RATE"; }
}
