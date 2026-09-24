package com.parksync.ticket;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Enriched e-ticket view for customer + attendant (history / live ticket).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TicketDetails {
    private Ticket ticket;

    private String customerName;
    private Long userId;

    private String lotName;
    private String lotAddress;
    private String slotCode;
    private String floor;

    private LocalDateTime bookedStart;
    private LocalDateTime bookedEnd;

    private BigDecimal amountPaid;
    private BigDecimal overstayPenalty;
    private BigDecimal refundAmount;
    private String paymentStatus;

    private String thankYouMessage;
}
