package com.parksync.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderBySentAtDesc(Long userId);
    List<Notification> findByUserId(Long userId);
    boolean existsByReservationIdAndType(Long reservationId, Notification.NotificationType type);
    boolean existsByReservationIdAndTypeAndMessageContaining(
            Long reservationId, Notification.NotificationType type, String fragment);
}
