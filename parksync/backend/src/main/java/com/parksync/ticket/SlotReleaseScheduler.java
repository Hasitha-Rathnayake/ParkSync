package com.parksync.ticket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * After check-out the slot stays occupied for SLOT_RELEASE_DELAY_MINUTES,
 * then this job marks it AVAILABLE so the next booking can use it.
 */
@Component
public class SlotReleaseScheduler {

    @Autowired
    private TicketService ticketService;

    // Every 30 seconds is enough for a 10-minute buffer
    @Scheduled(fixedRate = 30000)
    public void releaseSlots() {
        ticketService.releaseDueSlots();
    }
}
