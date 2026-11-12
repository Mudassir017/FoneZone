package com.mobinest.order.service;

import java.security.SecureRandom;
import java.util.Locale;

import org.springframework.stereotype.Component;

/** Customer-facing order ids like MNM3K9ZQ2AB7X (time-ordered, hard to guess). */
@Component
public class OrderNumberGenerator {

    private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private final SecureRandom random = new SecureRandom();

    public String next() {
        StringBuilder sb = new StringBuilder("MN")
            .append(Long.toString(System.currentTimeMillis(), 36).toUpperCase(Locale.ROOT));
        for (int i = 0; i < 4; i++) {
            sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
