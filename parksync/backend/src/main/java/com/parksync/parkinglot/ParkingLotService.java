package com.parksync.parkinglot;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ParkingLotService {

    @Autowired
    private ParkingLotRepository parkingLotRepository;

    @Autowired
    private ParkingSlotRepository parkingSlotRepository;

    @Autowired
    private ParkingLotPhotoRepository parkingLotPhotoRepository;

    // CREATE - add a new lot
    public ParkingLot createLot(ParkingLot lot) {
        return parkingLotRepository.save(lot);
    }

    /**
     * Pattern: LOTNAME-01, LOTNAME-02, ...
     * Lot name "Matara City LOT" → prefix MATARACITYLOT (alphanumeric only, max 12).
     */
    public static String slotPrefixFromLotName(String lotName) {
        if (lotName == null || lotName.isBlank()) return "LOT";
        String cleaned = lotName.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
        if (cleaned.isEmpty()) return "LOT";
        if (cleaned.length() > 12) cleaned = cleaned.substring(0, 12);
        return cleaned;
    }

    private int nextSlotNumber(Long lotId, String prefix) {
        List<ParkingSlot> existing = parkingSlotRepository.findByParkingLotId(lotId);
        Pattern p = Pattern.compile("^" + Pattern.quote(prefix) + "-(\\d+)$", Pattern.CASE_INSENSITIVE);
        int max = 0;
        for (ParkingSlot s : existing) {
            if (s.getSlotCode() == null) continue;
            Matcher m = p.matcher(s.getSlotCode().trim());
            if (m.matches()) {
                max = Math.max(max, Integer.parseInt(m.group(1)));
            }
        }
        // If no patterned codes, continue after total count so we don't collide oddly
        if (max == 0 && !existing.isEmpty()) {
            max = existing.size();
        }
        return max + 1;
    }

    private void assertCapacity(ParkingLot lot, Long lotId, int adding) {
        long current = parkingSlotRepository.findByParkingLotId(lotId).size();
        if (current + adding > lot.getTotalCapacity()) {
            throw new IllegalStateException(
                    "Cannot add " + adding + " slot(s) — lot capacity is " + lot.getTotalCapacity()
                            + " and " + current + " already exist.");
        }
    }

    // CREATE - one slot; if slotCode blank, auto LOTNAME-NN
    public ParkingSlot addSlotToLot(Long lotId, ParkingSlot slot) {
        ParkingLot lot = parkingLotRepository.findById(lotId)
                .orElseThrow(() -> new RuntimeException("Parking lot not found: " + lotId));

        assertCapacity(lot, lotId, 1);

        String code = slot.getSlotCode();
        if (code == null || code.isBlank()) {
            String prefix = slotPrefixFromLotName(lot.getName());
            int n = nextSlotNumber(lotId, prefix);
            code = String.format("%s-%02d", prefix, n);
            slot.setSlotCode(code);
        } else {
            code = code.trim().toUpperCase(Locale.ROOT);
            slot.setSlotCode(code);
        }

        final String finalCode = slot.getSlotCode();
        boolean duplicate = parkingSlotRepository.findByParkingLotId(lotId).stream()
                .anyMatch(s -> s.getSlotCode() != null && s.getSlotCode().equalsIgnoreCase(finalCode));
        if (duplicate) {
            throw new IllegalStateException("Slot code '" + finalCode + "' already exists in this lot.");
        }

        slot.setParkingLot(lot);
        if (slot.getStatus() == null) slot.setStatus(ParkingSlot.SlotStatus.AVAILABLE);
        return parkingSlotRepository.save(slot);
    }

    // CREATE - batch slots with pattern LOTNAME-01, LOTNAME-02, ...
    public List<ParkingSlot> addSlotsBatch(Long lotId, int count, String floor) {
        if (count < 1 || count > 50) {
            throw new IllegalArgumentException("Count must be between 1 and 50.");
        }
        ParkingLot lot = parkingLotRepository.findById(lotId)
                .orElseThrow(() -> new RuntimeException("Parking lot not found: " + lotId));

        assertCapacity(lot, lotId, count);

        String prefix = slotPrefixFromLotName(lot.getName());
        int next = nextSlotNumber(lotId, prefix);
        List<ParkingSlot> created = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            ParkingSlot slot = new ParkingSlot();
            slot.setSlotCode(String.format("%s-%02d", prefix, next + i));
            slot.setFloor(floor != null && !floor.isBlank() ? floor.trim() : null);
            slot.setStatus(ParkingSlot.SlotStatus.AVAILABLE);
            slot.setParkingLot(lot);
            created.add(parkingSlotRepository.save(slot));
        }
        return created;
    }

    public List<ParkingLot> getAllLots() {
        return parkingLotRepository.findAll();
    }

    public ParkingLot getLotById(Long id) {
        return parkingLotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parking lot not found: " + id));
    }

    public List<ParkingSlot> getSlotsByLot(Long lotId) {
        return parkingSlotRepository.findByParkingLotId(lotId);
    }

    public double getOccupancyPercentage(Long lotId) {
        List<ParkingSlot> slots = parkingSlotRepository.findByParkingLotId(lotId);
        if (slots.isEmpty()) return 0.0;
        long occupied = slots.stream().filter(s -> s.getStatus() == ParkingSlot.SlotStatus.OCCUPIED).count();
        return (occupied * 100.0) / slots.size();
    }

    public ParkingLot updateLot(Long id, ParkingLot updatedLot) {
        ParkingLot lot = getLotById(id);
        lot.setName(updatedLot.getName());
        lot.setAddress(updatedLot.getAddress());
        lot.setTotalCapacity(updatedLot.getTotalCapacity());
        return parkingLotRepository.save(lot);
    }

    public ParkingSlot updateSlotStatus(Long slotId, ParkingSlot.SlotStatus status) {
        ParkingSlot slot = parkingSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found: " + slotId));
        slot.setStatus(status);
        return parkingSlotRepository.save(slot);
    }

    @Value("${parksync.upload-dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final int MAX_PHOTOS_PER_LOT = 5;

    public List<ParkingLotPhoto> getLotPhotos(Long lotId) {
        getLotById(lotId); // ensure exists
        return parkingLotPhotoRepository.findByParkingLotIdOrderBySortOrderAscIdAsc(lotId);
    }

    public ParkingLotPhoto addLotPhoto(Long lotId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please choose an image file.");
        }
        ParkingLot lot = getLotById(lotId);
        long count = parkingLotPhotoRepository.countByParkingLotId(lotId);
        if (count >= MAX_PHOTOS_PER_LOT) {
            throw new IllegalStateException("Maximum " + MAX_PHOTOS_PER_LOT + " photos per lot.");
        }

        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "photo.jpg";
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) ext = original.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("Only JPG, PNG, WEBP or GIF images are allowed.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Image must be under 5 MB.");
        }

        try {
            Path root = Paths.get(uploadDir, "lots").toAbsolutePath().normalize();
            Files.createDirectories(root);
            String filename = lotId + "_" + System.currentTimeMillis() + "." + ext;
            Path target = root.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            ParkingLotPhoto photo = new ParkingLotPhoto();
            photo.setParkingLot(lot);
            photo.setFilePath("lots/" + filename);
            photo.setSortOrder((int) count);
            photo = parkingLotPhotoRepository.save(photo);

            // Keep cover imagePath = first photo for list cards
            syncCoverImage(lotId);
            return photo;
        } catch (IOException e) {
            throw new RuntimeException("Could not save image: " + e.getMessage());
        }
    }

    /** Legacy single-upload still works — adds one photo (max 5). */
    public ParkingLot saveLotPhoto(Long lotId, MultipartFile file) {
        addLotPhoto(lotId, file);
        return getLotById(lotId);
    }

    public void deleteLotPhotoById(Long photoId) {
        ParkingLotPhoto photo = parkingLotPhotoRepository.findById(photoId)
                .orElseThrow(() -> new RuntimeException("Photo not found: " + photoId));
        Long lotId = photo.getParkingLot().getId();
        try {
            Path file = Paths.get(uploadDir).resolve(photo.getFilePath()).toAbsolutePath().normalize();
            Files.deleteIfExists(file);
        } catch (IOException ignored) { }
        parkingLotPhotoRepository.delete(photo);
        syncCoverImage(lotId);
    }

    public ParkingLot clearLotPhoto(Long lotId) {
        // remove all photos
        for (ParkingLotPhoto p : parkingLotPhotoRepository.findByParkingLotIdOrderBySortOrderAscIdAsc(lotId)) {
            try {
                Path file = Paths.get(uploadDir).resolve(p.getFilePath()).toAbsolutePath().normalize();
                Files.deleteIfExists(file);
            } catch (IOException ignored) { }
            parkingLotPhotoRepository.delete(p);
        }
        ParkingLot lot = getLotById(lotId);
        lot.setImagePath(null);
        return parkingLotRepository.save(lot);
    }

    private void syncCoverImage(Long lotId) {
        ParkingLot lot = getLotById(lotId);
        List<ParkingLotPhoto> photos = parkingLotPhotoRepository.findByParkingLotIdOrderBySortOrderAscIdAsc(lotId);
        if (photos.isEmpty()) {
            lot.setImagePath(null);
        } else {
            lot.setImagePath(photos.get(0).getFilePath());
        }
        parkingLotRepository.save(lot);
    }

    public void deleteLot(Long id) {
        parkingLotRepository.deleteById(id);
    }

    public void deleteSlot(Long slotId) {
        parkingSlotRepository.deleteById(slotId);
    }
}
