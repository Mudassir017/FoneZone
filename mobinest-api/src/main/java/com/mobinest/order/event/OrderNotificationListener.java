package com.mobinest.order.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Runs only after the order transaction commits, so no email is ever sent for a rolled-back order.
 * Draft: logs only. Next: send the confirmation with JavaMailSender / an email provider.
 */
@Component
public class OrderNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(OrderNotificationListener.class);

    @Async
    @TransactionalEventListener
    public void onOrderPlaced(OrderPlacedEvent event) {
        log.info("Order {} placed: total Rs.{} - confirmation would be emailed to {}",
            event.orderNumber(), event.total(), event.email());
    }
}
