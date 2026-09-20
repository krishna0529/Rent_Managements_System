package com.Rent_Management.controller;

import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.dto.DashboardAnalyticsResponse;
import com.Rent_Management.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<DashboardAnalyticsResponse>> getAnalytics(
            @RequestParam(value = "period", required = false) String period) {
        DashboardAnalyticsResponse data = adminDashboardService.getDashboardAnalytics(period);
        return ResponseEntity.ok(ApiResponse.success("Dashboard telemetry analytics retrieved dynamically from database", data));
    }

    @GetMapping(value = "/export-csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(value = "period", required = false) String period) {
        byte[] csvBytes = adminDashboardService.exportPaymentsCsv(period);
        String activePeriod = (period == null || period.trim().isEmpty()) ? "Live_Telemetry" : period.trim().replace(" ", "_");
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String filename = "Singh_Rent_House_" + activePeriod + "_" + dateStr + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }
}

