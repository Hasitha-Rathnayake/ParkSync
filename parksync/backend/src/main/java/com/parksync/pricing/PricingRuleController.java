package com.parksync.pricing;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/pricing")
public class PricingRuleController {

    @Autowired
    private PricingRuleService pricingRuleService;

    @PostMapping
    public PricingRule create(@Valid @RequestBody PricingRule rule) {
        return pricingRuleService.createRule(rule);
    }

    @GetMapping("/lot/{lotId}")
    public List<PricingRule> getForLot(@PathVariable Long lotId) {
        return pricingRuleService.getActiveRulesForLot(lotId);
    }

    @GetMapping("/{id}")
    public PricingRule getOne(@PathVariable Long id) {
        return pricingRuleService.getRule(id);
    }

    @PutMapping("/{id}")
    public PricingRule update(@PathVariable Long id, @Valid @RequestBody PricingRule rule) {
        return pricingRuleService.updateRule(id, rule);
    }

    @DeleteMapping("/{id}")
    public void deactivate(@PathVariable Long id) {
        pricingRuleService.deactivateRule(id);
    }
}
