package com.parksync.pricing;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PricingRuleService {

    @Autowired
    private PricingRuleRepository pricingRuleRepository;

    // CREATE
    public PricingRule createRule(PricingRule rule) {
        validateRule(rule);
        return pricingRuleRepository.save(rule);
    }

    private void validateRule(PricingRule rule) {
        if (rule.getPeakStartHour() >= rule.getPeakEndHour()) {
            throw new IllegalArgumentException(
                    "Peak start hour must be before peak end hour (e.g. start 8, end 18).");
        }
        if (rule.getBaseRatePerHour() == null || rule.getBaseRatePerHour().doubleValue() <= 0) {
            throw new IllegalArgumentException("Base rate per hour must be greater than 0.");
        }
        if (rule.getPeakRatePerHour() == null || rule.getPeakRatePerHour().doubleValue() <= 0) {
            throw new IllegalArgumentException("Peak rate per hour must be greater than 0.");
        }
        if (rule.getDiscountPercentage() != null) {
            double d = rule.getDiscountPercentage().doubleValue();
            if (d < 0 || d > 100) {
                throw new IllegalArgumentException("Discount % must be between 0 and 100.");
            }
            if (d > 0 && (rule.getDiscountCode() == null || rule.getDiscountCode().isBlank())) {
                throw new IllegalArgumentException("Discount code is required when discount % is set.");
            }
        }
        if (rule.getCancellationFeePercentage() != null) {
            double c = rule.getCancellationFeePercentage().doubleValue();
            if (c < 0 || c > 100) {
                throw new IllegalArgumentException("Cancellation fee % must be between 0 and 100.");
            }
        }
        if (rule.getFreeCancellationWindowMinutes() < 0) {
            throw new IllegalArgumentException("Free cancellation window cannot be negative.");
        }
        if (rule.getOverstayMultiplier() != null && rule.getOverstayMultiplier().doubleValue() < 1.0) {
            throw new IllegalArgumentException("Overstay multiplier must be at least 1.0.");
        }
    }

    // READ - all active rules for a lot
    public List<PricingRule> getActiveRulesForLot(Long lotId) {
        return pricingRuleRepository.findByParkingLotIdAndActiveTrue(lotId);
    }

    // READ - one rule
    public PricingRule getRule(Long id) {
        return pricingRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pricing rule not found: " + id));
    }

    // UPDATE
    public PricingRule updateRule(Long id, PricingRule updated) {
        validateRule(updated);
        PricingRule rule = getRule(id);
        rule.setBaseRatePerHour(updated.getBaseRatePerHour());
        rule.setPeakRatePerHour(updated.getPeakRatePerHour());
        rule.setPeakStartHour(updated.getPeakStartHour());
        rule.setPeakEndHour(updated.getPeakEndHour());
        rule.setDiscountCode(updated.getDiscountCode());
        rule.setDiscountPercentage(updated.getDiscountPercentage());
        rule.setCancellationFeePercentage(updated.getCancellationFeePercentage());
        rule.setFreeCancellationWindowMinutes(updated.getFreeCancellationWindowMinutes());
        rule.setOverstayMultiplier(updated.getOverstayMultiplier());
        return pricingRuleRepository.save(rule);
    }

    // DELETE - deactivate an expired rule (soft delete keeps history)
    public void deactivateRule(Long id) {
        PricingRule rule = getRule(id);
        rule.setActive(false);
        pricingRuleRepository.save(rule);
    }
}
