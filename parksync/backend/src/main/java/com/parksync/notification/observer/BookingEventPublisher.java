package com.parksync.notification.observer;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Member pattern: OBSERVER — subject that notifies all registered observers.
 * Spring creates one publisher (singleton bean); NotificationService registers itself.
 */
@Component
public class BookingEventPublisher {

    private final List<BookingObserver> observers = new ArrayList<>();

    public synchronized void subscribe(BookingObserver observer) {
        if (observer != null && !observers.contains(observer)) {
            observers.add(observer);
        }
    }

    public synchronized void publish(String eventType, Long userId, Long reservationId, String message) {
        for (BookingObserver o : List.copyOf(observers)) {
            o.onEvent(eventType, userId, reservationId, message);
        }
    }
}
