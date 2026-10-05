package com.parksync.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderBySentAtDesc(Long userId);
    List<Notification> findByUserId(Long userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.readFlag = false")
    long countUnreadByUserId(@Param("userId") Long userId);

    boolean existsByReservationIdAndType(Long reservationId, Notification.NotificationType type);
    boolean existsByReservationIdAndTypeAndMessageContaining(
            Long reservationId, Notification.NotificationType type, String fragment);
}
