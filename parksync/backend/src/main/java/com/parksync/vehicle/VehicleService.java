package com.parksync.vehicle;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    // CREATE - add a vehicle to a user's profile
    public Vehicle addVehicle(Vehicle vehicle) {
        boolean duplicate = vehicleRepository.existsByUserIdAndPlateNumberIgnoreCase(
                vehicle.getUserId(), vehicle.getPlateNumber());
        if (duplicate) {
            throw new IllegalStateException("You've already saved a vehicle with this plate number.");
        }
        return vehicleRepository.save(vehicle);
    }

    // READ - all vehicles belonging to a user
    public List<Vehicle> getVehiclesForUser(Long userId) {
        return vehicleRepository.findByUserId(userId);
    }

    // READ - one vehicle
    public Vehicle getVehicle(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + id));
    }

    // UPDATE - edit vehicle details
    public Vehicle updateVehicle(Long id, Vehicle updated) {
        Vehicle vehicle = getVehicle(id);

        // If plate number is changing, make sure the new plate is not already saved for this user
        if (!vehicle.getPlateNumber().equalsIgnoreCase(updated.getPlateNumber())) {
            boolean duplicate = vehicleRepository.existsByUserIdAndPlateNumberIgnoreCase(
                    vehicle.getUserId(), updated.getPlateNumber());
            if (duplicate) {
                throw new IllegalStateException("You've already saved a vehicle with this plate number.");
            }
        }

        vehicle.setPlateNumber(updated.getPlateNumber());
        vehicle.setMake(updated.getMake());
        vehicle.setModel(updated.getModel());
        vehicle.setColor(updated.getColor());
        vehicle.setType(updated.getType());
        return vehicleRepository.save(vehicle);
    }

    // DELETE - remove a vehicle from a user's profile
    public void deleteVehicle(Long id) {
        vehicleRepository.deleteById(id);
    }
}
