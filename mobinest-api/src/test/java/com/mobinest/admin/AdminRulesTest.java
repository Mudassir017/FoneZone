package com.mobinest.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import com.mobinest.admin.common.AdminPaging;
import com.mobinest.admin.common.FieldValidationException;
import com.mobinest.admin.common.Params;
import com.mobinest.admin.order.OrderFilter;
import com.mobinest.admin.order.OrderWorkflow;
import com.mobinest.order.domain.OrderEnums.OrderStatus;
import com.mobinest.order.domain.OrderEnums.PaymentStatus;

/** Pure rules of the admin back office (no Spring context, no database). */
class AdminRulesTest {

    @Test
    void orderStatusMachine() {
        assertThat(OrderWorkflow.nextStatuses(OrderStatus.CONFIRMED)).containsExactly(OrderStatus.SHIPPED, OrderStatus.CANCELLED);
        assertThat(OrderWorkflow.nextStatuses(OrderStatus.SHIPPED)).containsExactly(OrderStatus.DELIVERED, OrderStatus.CANCELLED);
        assertThat(OrderWorkflow.nextStatuses(OrderStatus.DELIVERED)).isEmpty();
        assertThat(OrderWorkflow.nextStatuses(OrderStatus.CANCELLED)).isEmpty();
        assertThat(OrderWorkflow.canMove(OrderStatus.CONFIRMED, OrderStatus.DELIVERED)).isFalse(); // must ship first
        assertThat(OrderWorkflow.canMove(OrderStatus.CANCELLED, OrderStatus.CONFIRMED)).isFalse();
    }

    @Test
    void paymentStatusMachine() {
        assertThat(OrderWorkflow.canMovePayment(PaymentStatus.PENDING, PaymentStatus.PAID)).isTrue();
        assertThat(OrderWorkflow.canMovePayment(PaymentStatus.PAID, PaymentStatus.REFUNDED)).isTrue();
        assertThat(OrderWorkflow.canMovePayment(PaymentStatus.PAID, PaymentStatus.PENDING)).isFalse();
        assertThat(OrderWorkflow.nextPaymentStatuses(PaymentStatus.REFUNDED)).isEmpty();
    }

    @Test
    void pagingWhitelistsSortFieldsAndCapsSize() {
        var p = AdminPaging.of(1, 50, "total,desc", Map.of("total", "total"), Sort.by("id"));
        assertThat(p.getPageNumber()).isEqualTo(1);
        assertThat(p.getPageSize()).isEqualTo(50);
        assertThat(p.getSort().getOrderFor("total").getDirection()).isEqualTo(Sort.Direction.DESC);

        assertThatThrownBy(() -> AdminPaging.of(0, 20, "password", Map.of("total", "total"), Sort.by("id")))
            .isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(() -> AdminPaging.of(0, 500, null, Map.of(), Sort.by("id")))
            .isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(() -> AdminPaging.of(-1, 20, null, Map.of(), Sort.by("id")))
            .isInstanceOf(FieldValidationException.class);
    }

    @Test
    void filtersParseCaseInsensitivelyAndUseIstDays() {
        OrderFilter f = OrderFilter.parse("shipped", "cod", "pending", LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 12), " MN ");
        assertThat(f.status()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(f.q()).isEqualTo("MN");
        // 1 Nov 00:00 IST = 31 Oct 18:30 UTC; "to" includes the whole of 12 Nov IST
        assertThat(Params.startOfDay(f.from())).hasToString("2026-10-31T18:30:00Z");
        assertThat(Params.endOfDay(f.to())).hasToString("2026-11-12T18:30:00Z");

        assertThatThrownBy(() -> OrderFilter.parse("LOST", null, null, null, null, null))
            .isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(() -> OrderFilter.parse(null, null, null, LocalDate.of(2026, 11, 2), LocalDate.of(2026, 11, 1), null))
            .isInstanceOf(FieldValidationException.class);
    }

    @Test
    void likeSearchEscapesWildcards() {
        assertThat(Params.likeContains("50%_Off")).isEqualTo("%50\\%\\_off%");
    }

}
