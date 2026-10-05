package com.parksync.parkinglot;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lots")
public class ParkingLotController {

    @Autowired
    private ParkingLotService parkingLotService;

    @PostMapping
    public ParkingLot createLot(@Valid @RequestBody ParkingLot lot) {
        return parkingLotService.createLot(lot);
    }

    @PostMapping("/{lotId}/slots")
    public ResponseEntity<?> addSlot(@PathVariable Long lotId, @RequestBody ParkingSlot slot) {
        try {
            return ResponseEntity.ok(parkingLotService.addSlotToLot(lotId, slot));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /** Pattern add: LOTNAME-01, LOTNAME-02, ... */
    @PostMapping("/{lotId}/slots/batch")
    public ResponseEntity<?> addSlotsBatch(
            @PathVariable Long lotId,
            @RequestParam int count,
            @RequestParam(required = false) String floor) {
        try {
            return ResponseEntity.ok(parkingLotService.addSlotsBatch(lotId, count, floor));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public List<ParkingLot> getAllLots() {
        return parkingLotService.getAllLots();
    }

    @GetMapping("/{id}")
    public ParkingLot getLot(@PathVariable Long id) {
        return parkingLotService.getLotById(id);
    }

    @GetMapping("/{lotId}/slots")
    public List<ParkingSlot> getSlots(@PathVariable Long lotId) {
        return parkingLotService.getSlotsByLot(lotId);
    }

    @GetMapping("/{lotId}/occupancy")
    public double getOccupancy(@PathVariable Long lotId) {
        return parkingLotService.getOccupancyPercentage(lotId);
    }

    @PutMapping("/{id}")
    public ParkingLot updateLot(@PathVariable Long id, @Valid @RequestBody ParkingLot lot) {
        return parkingLotService.updateLot(id, lot);
    }

    @PutMapping("/slots/{slotId}/status")
    public ParkingSlot updateSlotStatus(@PathVariable Long slotId, @RequestParam ParkingSlot.SlotStatus status) {
        return parkingLotService.updateSlotStatus(slotId, status);
    }



    @GetMapping("/{lotId}/photos")
    public List<ParkingLotPhoto> listPhotos(@PathVariable Long lotId) {
        return parkingLotService.getLotPhotos(lotId);
    }

    @PostMapping("/{lotId}/photos")
    public ResponseEntity<?> addPhoto(@PathVariable Long lotId,
                                      @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(parkingLotService.addLotPhoto(lotId, file));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/photos/{photoId}")
    public ResponseEntity<?> deletePhotoById(@PathVariable Long photoId) {
        try {
            parkingLotService.deleteLotPhotoById(photoId);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{lotId}/photo")
    public ResponseEntity<?> uploadPhoto(@PathVariable Long lotId,
                                         @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(parkingLotService.saveLotPhoto(lotId, file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{lotId}/photo")
    public ParkingLot deletePhoto(@PathVariable Long lotId) {
        return parkingLotService.clearLotPhoto(lotId);
    }

    @DeleteMapping("/{id}")
    public void deleteLot(@PathVariable Long id) {
        parkingLotService.deleteLot(id);
    }

    @DeleteMapping("/slots/{slotId}")
    public void deleteSlot(@PathVariable Long slotId) {
        parkingLotService.deleteSlot(slotId);
    }
}
