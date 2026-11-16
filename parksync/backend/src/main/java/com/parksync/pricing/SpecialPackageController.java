package com.parksync.pricing;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/packages")
public class SpecialPackageController {

    @Autowired
    private SpecialPackageService service;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody SpecialPackage pkg) {
        try {
            return ResponseEntity.ok(service.create(pkg));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody SpecialPackage pkg) {
        try {
            return ResponseEntity.ok(service.update(id, pkg));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/lot/{lotId}")
    public List<SpecialPackage> forLot(
            @PathVariable Long lotId,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return service.listForLot(lotId, activeOnly);
    }

    @GetMapping("/lot/{lotId}/active")
    public List<SpecialPackage> activeToday(
            @PathVariable Long lotId,
            @RequestParam(required = false) String date) {
        LocalDate day = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        return service.activeOnDate(lotId, day);
    }

    /** Packages valid on a date (default today) — payment / discount apply. */
    @GetMapping("/active")
    public List<SpecialPackage> allActiveToday(
            @RequestParam(required = false) String date) {
        LocalDate day = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        return service.listAllActiveOnDate(day);
    }

    /** Offers tab: all active packages (current + upcoming), any start/end window. */
    @GetMapping("/available")
    public List<SpecialPackage> allAvailable() {
        return service.listAllActivePackages();
    }

    @GetMapping("/{id}")
    public SpecialPackage one(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(service.uploadImage(id, file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivate(@PathVariable Long id) {
        try {
            service.deactivate(id);
            return ResponseEntity.ok(Map.of("message", "Package deactivated"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
