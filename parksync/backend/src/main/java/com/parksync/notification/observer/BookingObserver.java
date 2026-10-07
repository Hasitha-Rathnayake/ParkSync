package com.parksync.notification.observer;

/** Member pattern: OBSERVER (Behavioral) — listener interface. */
public interface BookingObserver {
    void onEvent(String eventType, Long userId, Long reservationId, String message);
}
