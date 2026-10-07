package com.parksync.pricing.strategy;

import java.math.BigDecimal;

/** STRATEGY context — used by PaymentService. */
public class PricingContext {
    private PricingStrategy strategy;

    public PricingContext(PricingStrategy strategy) {
        this.strategy = strategy;
    }

    public void setStrategy(PricingStrategy strategy) {
        this.strategy = strategy;
    }

    public PricingStrategy getStrategy() {
        return strategy;
    }

    public BigDecimal execute(BigDecimal hours, BigDecimal baseHourly, BigDecimal peakHourly) {
        return strategy.calculate(hours, baseHourly, peakHourly);
    }
}
