package com.parksync.pricing;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PricingRuleRepository extends JpaRepository<PricingRule, Long> {
    List<PricingRule> findByParkingLotIdAndActiveTrue(Long parkingLotId);
    Optional<PricingRule> findByDiscountCodeAndActiveTrue(String discountCode);
}
