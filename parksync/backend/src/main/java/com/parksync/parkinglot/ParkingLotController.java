package com.parksync.parkinglot;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

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
    public ParkingSlot addSlot(@PathVariable Long lotId, @Valid @RequestBody ParkingSlot slot) {
        return parkingLotService.addSlotToLot(lotId, slot);
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

    @DeleteMapping("/{id}")
    public void deleteLot(@PathVariable Long id) {
        parkingLotService.deleteLot(id);
    }

    @DeleteMapping("/slots/{slotId}")
    public void deleteSlot(@PathVariable Long slotId) {
        parkingLotService.deleteSlot(slotId);
    }
}
