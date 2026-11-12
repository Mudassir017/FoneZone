package com.mobinest.admin.coupon;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.mobinest.order.coupon.Coupon;

public interface AdminCouponRepository extends JpaRepository<Coupon, String>, JpaSpecificationExecutor<Coupon> {
}
