package com.Rent_Management.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardAnalyticsResponse {

    // 3.1.2 - Rent Monthly Total amount
    private Double rentMonthlyTotal;

    // 3.1.3 - Rent Light Bill Total Amount
    private Double lightBillMonthlyTotal;

    // 3.1.4 - user Total Count Active And INActive
    private Long userActiveCount;
    private Long userInactiveCount;
    private Long userTotalCount;

    // Room inventory metrics
    private Long totalRooms;
    private Long occupiedRooms;
    private Long vacantRooms;

    // Approvals & dues
    private Long pendingApprovalsCount;
    private Double totalPendingDues;
    private Double totalCollectedRevenue;

    // 3.1.1 - Data Analysis Graph historical breakdown
    private List<MonthlyAnalysisPoint> monthlyAnalysis;

    // Recent completed payments for Live Payment History on Admin Dashboard
    private List<PaymentResponse> recentPayments;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyAnalysisPoint {
        private String month;
        private Double rentInflow;
        private Double powerUnitsKwh;
        private Double lightBillAmount;
    }
}
