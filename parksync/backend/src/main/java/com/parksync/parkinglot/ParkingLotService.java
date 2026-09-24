package com.parksync.parkinglot;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ParkingLotService {

    @Autowired
    private ParkingLotRepository parkingLotRepository;

    @Autowired
    private ParkingSlotRepository parkingSlotRepository;

    // CREATE - add a new lot
    public ParkingLot createLot(ParkingLot lot) {
        return parkingLotRepository.save(lot);
    }

    // CREATE - add a slot to an existing lot
    public ParkingSlot addSlotToLot(Long lotId, ParkingSlot slot) {
        ParkingLot lot = parkingLotRepository.findById(lotId)
                .orElseThrow(() -> new RuntimeException("Parking lot not found: " + lotId));

        boolean duplicateCode = parkingSlotRepository.findByParkingLotId(lotId).stream()
                .anyMatch(s -> s.getSlotCode().equalsIgnoreCase(slot.getSlotCode()));
        if (duplicateCode) {
            throw new IllegalStateException("Slot code '" + slot.getSlotCode() + "' already exists in this lot.");
        }

        long currentSlotCount = parkingSlotRepository.findByParkingLotId(lotId).size();
        if (currentSlotCount >= lot.getTotalCapacity()) {
            throw new IllegalStateException("Cannot add slot - lot has reached its total capacity of "
                    + lot.getTotalCapacity() + ".");
        }

        slot.setParkingLot(lot);
        return parkingSlotRepository.save(slot);
    }

    // READ - all lots
    public List<ParkingLot> getAllLots() {
        return parkingLotRepository.findAll();
    }

    // READ - one lot
    public ParkingLot getLotById(Long id) {
        return parkingLotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parking lot not found: " + id));
    }

    // READ - slots for a lot
    public List<ParkingSlot> getSlotsByLot(Long lotId) {
        return parkingSlotRepository.findByParkingLotId(lotId);
    }

    // READ - occupancy percentage for a lot
    public double getOccupancyPercentage(Long lotId) {
        List<ParkingSlot> slots = parkingSlotRepository.findByParkingLotId(lotId);
        if (slots.isEmpty()) return 0.0;
        long occupied = slots.stream().filter(s -> s.getStatus() == ParkingSlot.SlotStatus.OCCUPIED).count();
        return (occupied * 100.0) / slots.size();
    }

    // UPDATE - lot details
    public ParkingLot updateLot(Long id, ParkingLot updatedLot) {
        ParkingLot lot = getLotById(id);
        lot.setName(updatedLot.getName());
        lot.setAddress(updatedLot.getAddress());
        lot.setTotalCapacity(updatedLot.getTotalCapacity());
        return parkingLotRepository.save(lot);
    }

    // UPDATE - slot status (available / occupied / maintenance)
    public ParkingSlot updateSlotStatus(Long slotId, ParkingSlot.SlotStatus status) {
        ParkingSlot slot = parkingSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found: " + slotId));
        slot.setStatus(status);
        return parkingSlotRepository.save(slot);
    }

    // DELETE - remove a lot (cascades to its slots)
    public void deleteLot(Long id) {
        parkingLotRepository.deleteById(id);
    }

    // DELETE - remove a single slot
    public void deleteSlot(Long slotId) {
        parkingSlotRepository.deleteById(slotId);
    }
}
