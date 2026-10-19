package com.parksync.parkinglot.factory;

import com.parksync.parkinglot.ParkingLot;
import com.parksync.parkinglot.ParkingSlot;

/**
 * Member pattern: FACTORY METHOD (Creational) — Slot & Lot management.
 * Builds parking slot entities with code, floor, AVAILABLE status, and lot link.
 * Used by: ParkingLotService.addSlotToLot / addSlotsBatch
 */
public final class SlotFactory {

    private SlotFactory() {}

    public static ParkingSlot createSlot(ParkingLot lot, String slotCode, String floor) {
        ParkingSlot slot = new ParkingSlot();
        slot.setParkingLot(lot);
        slot.setSlotCode(slotCode);
        if (floor != null && !floor.isBlank()) {
            slot.setFloor(floor.trim());
        }
        slot.setStatus(ParkingSlot.SlotStatus.AVAILABLE);
        return slot;
    }

    public static ParkingSlot createSlotWithAutoCode(ParkingLot lot, String prefix, int number, String floor) {
        String code = String.format("%s-%02d", prefix, number);
        return createSlot(lot, code, floor);
    }
}
