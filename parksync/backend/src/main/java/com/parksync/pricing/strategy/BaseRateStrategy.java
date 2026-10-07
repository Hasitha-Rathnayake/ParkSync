package com.parksync.pricing.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** STRATEGY concrete — normal hourly rate. */
public class BaseRateStrategy implements PricingStrategy {
    @Override
    public BigDecimal calculate(BigDecimal hours, BigDecimal baseHourly, BigDecimal peakHourly) {
        return hours.multiply(baseHourly).setScale(2, RoundingMode.HALF_UP);
    }
    @Override
    public String name() { return "BASE_RATE"; }
}
