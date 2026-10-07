package com.parksync.common.config;

/**
 * Member pattern: SINGLETON (Creational).
 * One shared configuration instance for the whole application.
 * Also note: Spring @Service beans are singletons by default.
 */
public final class SystemConfigSingleton {

    private static final SystemConfigSingleton INSTANCE = new SystemConfigSingleton();

    /** Minutes between slots to avoid overlap (matches reservation buffer idea). */
    private final int overlapBufferMinutes = 15;
    /** Slot stays held after checkout before becoming free. */
    private final int slotHoldAfterCheckoutMinutes = 10;
    /** Payment window length in minutes. */
    private final int paymentWindowMinutes = 15;

    private SystemConfigSingleton() {}

    public static SystemConfigSingleton getInstance() {
        return INSTANCE;
    }

    public int getOverlapBufferMinutes() { return overlapBufferMinutes; }
    public int getSlotHoldAfterCheckoutMinutes() { return slotHoldAfterCheckoutMinutes; }
    public int getPaymentWindowMinutes() { return paymentWindowMinutes; }
}
