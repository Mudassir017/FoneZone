package com.mobinest.admin.dashboard;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mobinest.admin.dashboard.DashboardDtos.Dashboard;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Admin: dashboard")
@SecurityRequirement(name = "clerk")
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboard;

    @Operation(summary = "Revenue, order counts, daily chart (days=7..90), top phones, low stock, recent orders")
    @GetMapping
    public Dashboard get(@RequestParam(required = false) Integer days,
            @RequestParam(required = false) Integer threshold) {
        return dashboard.build(days, threshold);
    }
}
