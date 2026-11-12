package com.mobinest.order.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Address copied onto the order (a snapshot; later profile edits don't change it). */
@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ShippingAddress {

    @Column(name = "ship_full_name", nullable = false, length = 120)
    private String fullName;

    @Column(name = "ship_phone", nullable = false, length = 15)
    private String phone;

    @Column(name = "ship_email", nullable = false, length = 160)
    private String email;

    @Column(name = "ship_address", nullable = false)
    private String address;

    @Column(name = "ship_landmark", length = 120)
    private String landmark;

    @Column(name = "ship_city", nullable = false, length = 80)
    private String city;

    @Column(name = "ship_state", nullable = false, length = 60)
    private String state;

    @Column(name = "ship_pincode", nullable = false, length = 6)
    private String pincode;
}
