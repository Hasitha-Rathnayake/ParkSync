package com.parksync.pricing;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class SpecialPackageService {

    @Autowired
    private SpecialPackageRepository repository;

    @Value("${parksync.upload-dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "webp", "gif");

    public SpecialPackage create(SpecialPackage pkg) {
        validate(pkg);
        pkg.setActive(true);
        return repository.save(pkg);
    }

    public SpecialPackage update(Long id, SpecialPackage incoming) {
        SpecialPackage pkg = get(id);
        validate(incoming);
        pkg.setName(incoming.getName());
        pkg.setDescription(incoming.getDescription());
        pkg.setPackageType(incoming.getPackageType());
        pkg.setParkingLotId(incoming.getParkingLotId());
        pkg.setStartDate(incoming.getStartDate());
        pkg.setEndDate(incoming.getEndDate());
        pkg.setDiscountPercentage(incoming.getDiscountPercentage());
        pkg.setActive(incoming.isActive());
        return repository.save(pkg);
    }

    public SpecialPackage get(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Package not found: " + id));
    }

    public List<SpecialPackage> listForLot(Long lotId, boolean activeOnly) {
        if (activeOnly) {
            return repository.findByParkingLotIdAndActiveTrueOrderByStartDateDesc(lotId);
        }
        return repository.findByParkingLotIdOrderByStartDateDesc(lotId);
    }

    public List<SpecialPackage> activeOnDate(Long lotId, LocalDate day) {
        return repository.findActiveForLotOnDate(lotId, day);
    }

    /** Active packages across all lots for dashboard / promo strip. */
    public List<SpecialPackage> listAllActiveOnDate(LocalDate day) {
        LocalDate d = day != null ? day : LocalDate.now();
        return repository.findAllActiveOnDate(d);
    }

    /** Best (highest %) active package for lot on a given day, or null */
    public SpecialPackage bestForLotOnDate(Long lotId, LocalDate day) {
        List<SpecialPackage> list = activeOnDate(lotId, day);
        return list.isEmpty() ? null : list.get(0);
    }

    public void deactivate(Long id) {
        SpecialPackage pkg = get(id);
        pkg.setActive(false);
        repository.save(pkg);
    }

    public SpecialPackage uploadImage(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please choose an image.");
        }
        SpecialPackage pkg = get(id);
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "pkg.jpg";
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) ext = original.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("Only JPG, PNG, WEBP or GIF allowed.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Image must be under 5 MB.");
        }
        try {
            Path root = Paths.get(uploadDir, "packages").toAbsolutePath().normalize();
            Files.createDirectories(root);
            String filename = "pkg_" + id + "_" + System.currentTimeMillis() + "." + ext;
            Files.copy(file.getInputStream(), root.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            pkg.setImagePath("packages/" + filename);
            return repository.save(pkg);
        } catch (IOException e) {
            throw new RuntimeException("Could not save image: " + e.getMessage());
        }
    }

    private void validate(SpecialPackage pkg) {
        if (pkg.getEndDate() != null && pkg.getStartDate() != null
                && pkg.getEndDate().isBefore(pkg.getStartDate())) {
            throw new IllegalArgumentException("End date must be on or after start date.");
        }
        if (pkg.getDiscountPercentage() == null) {
            pkg.setDiscountPercentage(BigDecimal.ZERO);
        }
        if (pkg.getPackageType() == null || pkg.getPackageType().isBlank()) {
            pkg.setPackageType("PROMO");
        }
    }
}
